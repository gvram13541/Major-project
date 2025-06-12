from flask import Flask, Response, jsonify, request, send_file
from flask_sock import Sock
from flask_cors import CORS
from prometheus_client import Gauge, generate_latest, CONTENT_TYPE_LATEST
import threading, time, json
from email.mime.text import MIMEText
import smtplib
import imaplib
import email
from email.header import decode_header
from email.utils import parseaddr
import pandas as pd
from datetime import datetime
import io
import json

# Reasonable maximums for normalization
MAX_OUTBOUND_TRAFFIC = 1_000_000      # packets/sec
MAX_BANDWIDTH_USAGE = 125_000_000     # bytes/sec (1 Gbps)
MAX_LATENCY = 500_000                 # microseconds (500 ms)

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3001", "http://localhost:8080", "http://localhost:8000"])
sock = Sock(app)

# Configure your SMTP server details here
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
SMTP_USER = 'gunavardhan240@gmail.com'      # Replace with your email
SMTP_PASSWORD = 'rtwh krbx pvxy hqfh'   

# In-memory storage for metrics from agents
agent_data = {}
connected_clients = ()
alerts_store = []
sent_mails_store = []

# Prometheus metrics
agent_count_metric = Gauge('agent_count', 'Number of agents sending metrics')
avg_cpu_usage = Gauge('avg_cpu_usage', 'Average CPU Usage in percentage')
avg_memory_usage = Gauge('avg_memory_usage', 'Average Memory Usage in GB')
avg_disk_usage = Gauge('avg_disk_usage', 'Average Disk Usage in GB')
avg_bandwidth_usage = Gauge('avg_bandwidth_usage', 'Average Bandwidth Usage in bytes')
avg_jitter = Gauge('avg_jitter', 'Average Jitter in microseconds')
avg_latency = Gauge('avg_latency', 'Average Latency in microseconds')
avg_outbound_traffic = Gauge('avg_outbound_traffic', 'Average Outbound Traffic in packets')
avg_protocol_traffic = Gauge('avg_protocol_traffic', 'Average Protocol Traffic in packets')
avg_top_talkers = Gauge('avg_top_talkers', 'Average Top Talkers in bytes')

@app.route("/")
def index():
    return "WebSocket server running..."

@app.route('/metrics', methods=['GET'])
def prometheus_metrics():
    return Response(generate_latest(), content_type=CONTENT_TYPE_LATEST)

@sock.route('/ws')
def ws_handler(ws):
    while True:
        try:
            message = ws.receive()
            if not message:
                continue
            try:
                data = json.loads(message)
            except Exception:
                ws.send(json.dumps({"event": "error", "message": "Invalid JSON"}))
                continue

            event = data.get("event")
            agent_id = data.get("agent_id")

            # 1. Receive metrics from agent
            if event == "metric":
                metrics = data.get("data")
                if not agent_id or not metrics:
                    ws.send(json.dumps({"event": "error", "message": "agent_id and metrics are required"}))
                    continue
                agent_data[agent_id] = metrics
                agent_count_metric.set(len(agent_data))
                calculate_averages()
                ws.send(json.dumps({"event": "success", "message": "Metrics received successfully"}))
            
                user_email = metrics.get("user_email") or "gunavardhan240@gmail.com"  # fallback for demo

                cpu_usage = metrics.get("System Metrics", {}).get("CPU Usage", [0])[0]
                mem_used = metrics.get("System Metrics", {}).get("Used Memory (GB)", 0)
                mem_total = metrics.get("System Metrics", {}).get("Total Memory (GB)", 1)
                mem_percent = (mem_used / mem_total) * 100 if mem_total else 0

                if cpu_usage > 1:
                    send_metric_spike_mail(
                        to=user_email,
                        system_id=agent_id,
                        metric_name="CPU Usage",
                        metric_value=cpu_usage,
                        details=f"CPU Usage reached {cpu_usage}%"
                    )
                if mem_percent > 190:
                    send_metric_spike_mail(
                        to=user_email,
                        system_id=agent_id,
                        metric_name="Memory Usage",
                        metric_value=f"{mem_used}GB used of {mem_total}GB ({mem_percent:.2f}%)",
                        details=f"Memory Usage reached {mem_percent:.2f}%"
                    )

            elif event == "alert":
                print(data["data"])
                alert_type = data["data"].get("alert_type")
                print(f"🚨 Alert from {agent_id}: {alert_type}")

                # Send alert to frontend
                alert_message = json.dumps({
                    "event": "alert",
                    "data": data["data"],
                    "agent_id": agent_id
                })
                for client in list(connected_clients):
                    try:
                        client.send(alert_message)
                    except Exception:
                        connected_clients.discard(client)
                alert_entry = {
                    "agent_id": agent_id,
                    "alert_type": alert_type,
                    "message": data["data"].get("message", ""),
                    "timestamp": data["data"].get("timestamp", time.strftime("%Y-%m-%d %H:%M:%S"))
                }
                alerts_store.append(alert_entry)

                if alert_type == "high_bandwidth":
                    ip_to_block = data["data"].get("ip")
                    print(f"🛡️ Deciding to block IP: {ip_to_block}")

                    block_command = {
                        "agent_id": agent_id,
                        "event": "block",
                        "data": {
                            "ip": ip_to_block
                        }
                    }
                    ws.send(json.dumps(block_command))
                    print(f"✅ Block command sent to {agent_id} for IP {ip_to_block}")

        except Exception as e:
            ws.send(json.dumps({"event": "error", "message": str(e)}))
            break
        
from datetime import datetime

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    # Prepare alerts with parsed timestamps and consistent fields
    def parse_time(ts):
        try:
            # Try ISO format first
            dt = datetime.fromisoformat(ts)
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            try:
                # Try common string format
                dt = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
                return dt.strftime("%Y-%m-%d %H:%M:%S")
            except Exception:
                return ts  # Return as is if parsing fails

    formatted_alerts = []
    for alert in alerts_store[-100:]:
        formatted_alerts.append({
            "agent_id": alert.get("agent_id", ""),
            "timestamp": parse_time(alert.get("timestamp", "")),
            "alert_type": alert.get("alert_type", ""),
            "message": alert.get("message", ""),
        })
    return jsonify(formatted_alerts)
def send_metric_spike_mail(to, system_id, metric_name, metric_value, details):
    subject = f"metric spike - {metric_name} in the system - {system_id}"
    body = f"Alert: {metric_name} spike detected on system {system_id}.\n\nCurrent Value: {metric_value}\n\nDetails: {details}"
    try:
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = SMTP_USER
        msg['To'] = to

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, [to], msg.as_string())
        print(f"Alert mail sent to {to} for {metric_name} spike on {system_id}")
    except Exception as e:
        print("Mail send error:", e)

def calculate_averages():
    if not agent_data:
        return
    total_cpu = total_memory = total_disk = total_bandwidth = total_jitter = total_latency = 0
    total_outbound = total_protocol = total_top_talkers = 0
    agent_count = len(agent_data)
    bandwidth_count = jitter_count = latency_count = outbound_count = protocol_count = top_talkers_count = 0

    for metrics in agent_data.values():
        system_metrics = metrics.get("System Metrics", {})
        eBPF_metrics = metrics.get("eBPF Metrics", {})

        total_cpu += system_metrics.get("CPU Usage", [0])[0]
        total_memory += system_metrics.get("Free Memory (GB)", 0)
        total_disk += system_metrics.get("Used Disk (GB)", 0)

        for usage in eBPF_metrics.get("Bandwidth Usage", {}).values():
            total_bandwidth += usage
            bandwidth_count += 1

        for jitter_value in eBPF_metrics.get("Jitter", {}).values():
            total_jitter += jitter_value
            jitter_count += 1

        for latency_value in eBPF_metrics.get("Latency", {}).values():
            total_latency += latency_value
            latency_count += 1

        for packets in eBPF_metrics.get("Outbound Traffic", {}).values():
            total_outbound += packets
            outbound_count += 1

        for packets in eBPF_metrics.get("Protocol Traffic", {}).values():
            total_protocol += packets
            protocol_count += 1

        for bytes_sent in eBPF_metrics.get("Top Talkers", {}).values():
            total_top_talkers += bytes_sent
            top_talkers_count += 1

    avg_cpu_usage.set(total_cpu / agent_count)
    avg_memory_usage.set(total_memory / agent_count)
    avg_disk_usage.set(total_disk / agent_count)
    avg_bandwidth_usage.set(total_bandwidth / bandwidth_count if bandwidth_count > 0 else 0)
    avg_jitter.set(total_jitter / jitter_count if jitter_count > 0 else 0)
    avg_latency.set(total_latency / latency_count if latency_count > 0 else 0)
    avg_outbound_traffic.set(total_outbound / outbound_count if outbound_count > 0 else 0)
    avg_protocol_traffic.set(total_protocol / protocol_count if protocol_count > 0 else 0)
    avg_top_talkers.set(total_top_talkers / top_talkers_count if top_talkers_count > 0 else 0)

# Endpoint to fetch average metrics for widgets
@app.route('/widget-metrics', methods=['GET'])
def get_widget_metrics():
    if not agent_data:
        return jsonify({
            "cpuUsage": 0,
            "memoryUsage": 0,
            "bandwidthUsage": 0,
            "latency": 0,
        })

    # Initialize accumulators
    total_cpu = 0
    total_memory = 0
    total_bandwidth = 0
    total_latency = 0
    agent_count = len(agent_data)

    print(f"agnet_data: {agent_data}")

    # Aggregate metrics from all agents
    for agent_id, metrics in agent_data.items():
        system_metrics = metrics.get("System Metrics", {})
        agent_metrics = metrics.get("eBPF Metrics", {})
        # print(f"system_metrics: {system_metrics}")
        # print(f"ebpf_metrics: {metrics.get('eBPF Metrics', {})}")
        total_cpu += system_metrics.get("CPU Usage", [0])[0]
        total_memory += system_metrics.get("Free Memory (GB)", 0)
        bandwidth_usage = agent_metrics.get("Bandwidth Usage", {})
        total_bandwidth += sum(bandwidth_usage.values())
        latency = agent_metrics.get("Latency", {})
        total_latency += sum(latency.values())
        # total_bandwidth += agent_metrics.get("Bandwidth Usage", 0)
        # total_latency += agent_metrics.get("Latency", 0)

    # print(system_metrics.get("Bandwidth Usage", 0))
    # print(system_metrics.get("Outbound Traffic", 0))

    # Calculate averages
    avg_cpu = round(total_cpu / agent_count, 2)
    avg_memory = round(total_memory / agent_count, 2)
    avg_bandwidth_usage = round(total_bandwidth / agent_count, 2)
    avg_latency = round(total_latency / agent_count, 2)

    # print(f"Average Widget Metrics: {avg_cpu}, {avg_memory}, {avg_bandwidth_usage}, {avg_outbound_traffic}")

    return jsonify({
        "cpuUsage": avg_cpu,
        "memoryUsage": avg_memory,
        "bandwidthUsage": avg_bandwidth_usage,
        "latency": round(avg_latency/10**6, 2),
    })

import random

@app.route('/dashboard-metrics', methods=['GET'])
def get_dashboard_metrics():
    if not agent_data:
        return jsonify({
            "outboundTraffic": 0,
            "bandwidthUsage": 0,
            "cpuUtilization": 0,
            "memoryUsage": 0,
            "latency": 0,
        })

    total_outbound_traffic = 0
    total_bandwith_usage = 0
    total_cpu_utilization = 0
    total_memory_usage = 0
    total_latency = 0
    system_count = len(agent_data)

    for agent_id, metrics in agent_data.items():
        system_metrics = metrics.get("System Metrics", {})
        eBPF_metrics = metrics.get("eBPF Metrics", {})

        total_cpu_utilization += system_metrics.get("CPU Usage", [0])[0]
        total_memory_usage += ((system_metrics.get("Used Memory (GB)", 0) / system_metrics.get("Total Memory (GB)", 1)) * 100)
        total_outbound_traffic += sum(eBPF_metrics.get("Outbound Traffic", {}).values())
        total_bandwith_usage += sum(eBPF_metrics.get("Bandwidth Usage", {}).values())
        total_latency += sum(eBPF_metrics.get("Latency", {}).values())

    avg_outbound_traffic = total_outbound_traffic / system_count
    avg_bandwidth_usage = total_bandwith_usage / system_count
    avg_cpu_utilization = total_cpu_utilization / system_count
    avg_memory_usage = total_memory_usage / system_count
    avg_latency = total_latency / system_count

    # Generate random maximums greater than current values
    def random_max(current):
        return random.uniform(current + 1, max(current * 2, current + 10)) if current > 0 else 100

    max_outbound = random_max(avg_outbound_traffic)
    max_bandwidth = random_max(avg_bandwidth_usage)
    max_latency = random_max(avg_latency)

    # Normalize to percentage
    outbound_percent = min(100, round((avg_outbound_traffic / max_outbound) * 100, 2)) if max_outbound else 0
    bandwidth_percent = min(100, round((avg_bandwidth_usage / max_bandwidth) * 100, 2)) if max_bandwidth else 0
    latency_percent = min(100, round((avg_latency / max_latency) * 100, 2)) if max_latency else 0

    return jsonify({
        "outboundTraffic": outbound_percent,
        "bandwidthUsage": bandwidth_percent,
        "cpuUtilization": round(avg_cpu_utilization, 2),
        "memoryUsage": round(avg_memory_usage, 2),
        "latency": latency_percent,
    })

@app.route('/system/<system_id>/chrome-tabs', methods=['GET'])
def get_chrome_tabs(system_id):
    # Check if the system exists in agent_data
    if system_id not in agent_data:
        return jsonify({"error": "System not found"}), 404

    # Fetch system metrics
    system_metrics = agent_data[system_id].get("System Metrics", {})
    open_tabs = system_metrics.get("Open Tabs", [])

    # Return the open tabs
    return jsonify({
        "systemId": system_id,
        "openTabs": open_tabs
    })

@app.route('/system/<system_id>/processes', methods=['GET'])
def get_system_processes(system_id):
    # Check if the system exists in agent_data
    if system_id not in agent_data:
        return jsonify({"error": "System not found"}), 404

    # Get query parameters for pagination
    limit = int(request.args.get('limit', 10))  # Default limit is 10
    offset = int(request.args.get('offset', 0))  # Default offset is 0
    detailed = request.args.get('detailed', 'false').lower() == 'true'

    # Fetch system metrics
    system_metrics = agent_data[system_id].get("System Metrics", {})
    processes = system_metrics.get("Per Process", [])

    # Paginate the processes
    paginated_processes = processes[offset:offset + limit]

    # Add detailed information if requested
    if detailed:
        for process in paginated_processes:
            # Simulate connections for each process
            process["connections"] = [
                {
                    "laddr": {"ip": "127.0.0.1", "port": 8080},
                    "raddr": {"ip": "192.168.1.1", "port": 443},
                    "status": "ESTABLISHED",
                },
                {
                    "laddr": {"ip": "127.0.0.1", "port": 9090},
                    "raddr": {"ip": "192.168.1.2", "port": 80},
                    "status": "CLOSE_WAIT",
                },
            ]

            # Simulate open files for each process
            process["open_files"] = [
                {"path": f"/var/log/{process['Name']}.log", "fd": 3},
                {"path": f"/etc/{process['Name']}.conf", "fd": 4},
            ]

    # Return the paginated processes and total count
    return jsonify({
        "processes": paginated_processes,
        "total": len(processes),
    })

@app.route('/api/send-mail', methods=['POST'])
def send_mail():
    data = request.get_json()
    sender = data.get('from')
    recipient = data.get('to')
    content = data.get('content')

    if not sender or not recipient or not content:
        return jsonify({'error': 'Missing fields'}), 400

    try:
        msg = MIMEText(content)
        msg['Subject'] = 'Message from Monitoring App'
        msg['From'] = sender
        msg['To'] = recipient

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(sender, [recipient], msg.as_string())

        # Store sent mail
        sent_mails_store.append({
            "from": sender,
            "to": recipient,
            "content": content,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        })

        return jsonify({'message': 'Mail sent successfully!'}), 200
    except Exception as e:
        print("Mail send error:", e)
        return jsonify({'error': 'Failed to send mail.'}), 500

@app.route('/mails', methods=['GET'])
def fetch_mails():
    try:
        imap = imaplib.IMAP4_SSL("imap.gmail.com")
        imap.login(SMTP_USER, SMTP_PASSWORD)
        imap.select("inbox")
        status, messages = imap.search(None, 'ALL')
        email_ids = messages[0].split()
        emails = []

        for i in email_ids[-10:]:
            res, msg_data = imap.fetch(i, "(RFC822)")
            if res != "OK":
                continue
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    # Decode subject
                    subject, encoding = decode_header(msg["Subject"])[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(encoding if encoding else "utf-8", errors="ignore")
                    # Decode sender
                    from_name, from_addr = parseaddr(msg.get("From"))
                    if from_name:
                        try:
                            from_name, enc = decode_header(from_name)[0]
                            if isinstance(from_name, bytes):
                                from_name = from_name.decode(enc if enc else "utf-8", errors="ignore")
                        except Exception:
                            pass
                    sender = f"{from_name} <{from_addr}>" if from_name else from_addr
                    # Get body
                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            content_type = part.get_content_type()
                            if content_type == "text/plain" and part.get_payload(decode=True):
                                body = part.get_payload(decode=True).decode(errors="ignore")
                                break
                    else:
                        body = msg.get_payload(decode=True).decode(errors="ignore")
                    emails.append({
                        "from": sender,
                        "subject": subject,
                        "body": body[:500]  # Show up to 500 chars
                    })
        imap.logout()
        return jsonify(emails)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sent-mails', methods=['GET'])
def get_sent_mails():
    user = request.args.get('user')
    if not user:
        return jsonify([])
    # Return the 10 most recent sent mails for this user
    mails = [mail for mail in sent_mails_store if mail['from'] == user]
    return jsonify(mails[-10:])

@app.route('/systems-monitoring', methods=['GET'])
def systems_monitoring():
    systems_data = []

    # Iterate through all agents in agent_data
    for agent_id, metrics in agent_data.items():
        system_metrics = metrics.get("System Metrics", {})
        eBPF_metrics = metrics.get("eBPF Metrics", {})

        # Calculate network throughput (sum of Bandwidth Usage)
        network_throughput = sum(eBPF_metrics.get("Bandwidth Usage", {}).values()) / (1024 * 1024)  # Convert to Mbps

        # Aggregate data for each system
        systems_data.append({
            "systemId": agent_id,
            "applications": [process["Name"] for process in system_metrics.get("Per Process", [])],
            "cpuUsage": system_metrics.get("CPU Usage", [0])[0],
            "memoryUsage": ((system_metrics.get("Used Memory (GB)", 0) / system_metrics.get("Total Memory (GB)", 1)) * 100),
            "networkThroughput": round(network_throughput, 2),
            "packetDropRate": round(sum(eBPF_metrics.get("Dropped Packets", {}).values()), 2),
            "activeConnections": len(eBPF_metrics.get("Outbound Traffic", {})),
        })

    return jsonify(systems_data)

def flatten_agent_data(data):
    """
    Flatten the nested agent data structure into multiple DataFrames
    """
    sheets = {}
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    for mac_address, agent_info in data.items():
        # System Metrics Overview
        system_metrics = agent_info.get('System Metrics', {})
        system_overview = []
        
        # Basic system metrics
        basic_metrics = {
            'MAC Address': mac_address,
            'Timestamp': timestamp,
            'CPU Usage (%)': system_metrics.get('CPU Usage', [0])[0] if system_metrics.get('CPU Usage') else 0,
            'Free Disk (GB)': system_metrics.get('Free Disk (GB)', 0),
            'Free Memory (GB)': system_metrics.get('Free Memory (GB)', 0),
            'Total Disk (GB)': system_metrics.get('Total Disk (GB)', 0),
            'Total Memory (GB)': system_metrics.get('Total Memory (GB)', 0),
            'Used Disk (GB)': system_metrics.get('Used Disk (GB)', 0),
            'Used Memory (GB)': system_metrics.get('Used Memory (GB)', 0)
        }
        system_overview.append(basic_metrics)
        sheets['System_Overview'] = pd.DataFrame(system_overview)
        
        # Per Process Data
        processes = system_metrics.get('Per Process', [])
        if processes:
            process_data = []
            for process in processes:
                process_row = {
                    'MAC Address': mac_address,
                    'Timestamp': timestamp,
                    'Process Name': process.get('Name', ''),
                    'PID': process.get('PID', ''),
                    'CPU (%)': process.get('CPU (%)', 0),
                    'Memory (%)': process.get('Memory (%)', 0),
                    'Executable': process.get('Executable', ''),
                    'User': process.get('User', ''),
                    'ReadBytes': process.get('ReadBytes', 0),
                    'WriteBytes': process.get('WriteBytes', 0)
                }
                process_data.append(process_row)
            sheets['Process_Details'] = pd.DataFrame(process_data)
        
        # eBPF Metrics
        ebpf_metrics = agent_info.get('eBPF Metrics', {})
        
        # Bandwidth Usage
        bandwidth_data = []
        for ip, usage in ebpf_metrics.get('Bandwidth Usage', {}).items():
            bandwidth_data.append({
                'MAC Address': mac_address,
                'Timestamp': timestamp,
                'IP Address': ip,
                'Bandwidth Usage': usage
            })
        if bandwidth_data:
            sheets['Bandwidth_Usage'] = pd.DataFrame(bandwidth_data)
        
        # Latency Data
        latency_data = []
        for ip, latency in ebpf_metrics.get('Latency', {}).items():
            latency_data.append({
                'MAC Address': mac_address,
                'Timestamp': timestamp,
                'IP Address': ip,
                'Latency': latency
            })
        if latency_data:
            sheets['Latency_Data'] = pd.DataFrame(latency_data)
        
        # Jitter Data
        jitter_data = []
        for ip, jitter in ebpf_metrics.get('Jitter', {}).items():
            jitter_data.append({
                'MAC Address': mac_address,
                'Timestamp': timestamp,
                'IP Address': ip,
                'Jitter': jitter
            })
        if jitter_data:
            sheets['Jitter_Data'] = pd.DataFrame(jitter_data)
        
        # Outbound Traffic
        outbound_data = []
        for ip, traffic in ebpf_metrics.get('Outbound Traffic', {}).items():
            outbound_data.append({
                'MAC Address': mac_address,
                'Timestamp': timestamp,
                'IP Address': ip,
                'Outbound Traffic': traffic
            })
        if outbound_data:
            sheets['Outbound_Traffic'] = pd.DataFrame(outbound_data)
        
        # Protocol Traffic
        protocol_data = []
        for protocol, traffic in ebpf_metrics.get('Protocol Traffic', {}).items():
            protocol_data.append({
                'MAC Address': mac_address,
                'Timestamp': timestamp,
                'Protocol': protocol,
                'Traffic': traffic
            })
        if protocol_data:
            sheets['Protocol_Traffic'] = pd.DataFrame(protocol_data)
        
        # Top Talkers
        top_talkers_data = []
        for ip, traffic in ebpf_metrics.get('Top Talkers', {}).items():
            top_talkers_data.append({
                'MAC Address': mac_address,
                'Timestamp': timestamp,
                'IP Address': ip,
                'Traffic Volume': traffic
            })
        if top_talkers_data:
            sheets['Top_Talkers'] = pd.DataFrame(top_talkers_data)
    
    return sheets

@app.route('/download-agent-data', methods=['GET'])
def download_agent_data():
    try:
        # Flatten the data into multiple sheets
        sheets = flatten_agent_data(agent_data)
        
        # Create Excel file in memory
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            for sheet_name, df in sheets.items():
                df.to_excel(writer, sheet_name=sheet_name, index=False)
        
        output.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'agent_data_{timestamp}.xlsx'
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        print("Download agent data error:", e)  # <--- Add this line
        return jsonify({'error': f'Failed to generate Excel file: {str(e)}'}), 500

@app.route('/download-agent-data-json', methods=['GET'])
def download_agent_data_json():
    """
    Alternative endpoint to download agent data as JSON file with timestamp
    """
    try:
        # Add timestamp to the data
        timestamped_data = {
            'export_timestamp': datetime.now().isoformat(),
            'agent_data': agent_data
        }
        
        # Create JSON file in memory
        output = io.BytesIO()
        json_str = json.dumps(timestamped_data, indent=2)
        output.write(json_str.encode('utf-8'))
        output.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'agent_data_{timestamp}.json'
        
        return send_file(
            output,
            mimetype='application/json',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate JSON file: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})


def cleanup_old_data():
    while True:
        time.sleep(60)
        # Add cleanup logic if needed

if __name__ == '__main__':
    threading.Thread(target=cleanup_old_data, daemon=True).start()
    print("🚀 WebSocket server running at http://localhost:8000/ws")
    app.run(host='0.0.0.0', port=8000, debug=True)


# from flask import Flask
# from flask_sock import Sock
# import json
# import logging
# from prometheus_client import Gauge, generate_latest, CONTENT_TYPE_LATEST


# app = Flask(__name__)
# sock = Sock(app)

# connected_clients = []

# # In-memory storage for metrics from agents
# agent_data = {}

# # Prometheus metrics
# agent_count = Gauge('agent_count', 'Number of agents sending metrics')
# avg_cpu_usage = Gauge('avg_cpu_usage', 'Average CPU Usage in percentage')
# avg_memory_usage = Gauge('avg_memory_usage', 'Average Memory Usage in GB')
# avg_disk_usage = Gauge('avg_disk_usage', 'Average Disk Usage in GB')
# avg_bandwidth_usage = Gauge('avg_bandwidth_usage', 'Average Bandwidth Usage in bytes')
# avg_jitter = Gauge('avg_jitter', 'Average Jitter in microseconds')
# avg_latency = Gauge('avg_latency', 'Average Latency in microseconds')
# avg_outbound_traffic = Gauge('avg_outbound_traffic', 'Average Outbound Traffic in packets')
# avg_protocol_traffic = Gauge('avg_protocol_traffic', 'Average Protocol Traffic in packets')
# avg_top_talkers = Gauge('avg_top_talkers', 'Average Top Talkers in bytes')

# @app.route("/")
# def index():
#     return "WebSocket server running..."

# @sock.route('/ws')
# def handle_ws(ws):
#     connected_clients.append(ws)
#     try:
#         while True:
#             message = ws.receive()
#             if not message:
#                 continue
#             try:
#                 data = json.loads(message)
#                 event_type = data.get("event")
#                 agent_id = data.get("agent_id")

#                 if event_type == "metric":
#                     print(f"📊 Metrics from {agent_id}:")
#                     print(json.dumps(data.get("data", {}), indent=2))

#                 elif event_type == "alert":
#                     alert_type = data["data"].get("alert_type")
#                     print(f"🚨 Alert from {agent_id}: {alert_type}")

#                     if alert_type == "high_bandwidth":
#                         ip_to_block = data["data"].get("ip")
#                         print(f"🛡️ Deciding to block IP: {ip_to_block}")

#                         block_command = {
#                             "agent_id": agent_id,
#                             "event": "block",
#                             "data": {
#                                 "ip": ip_to_block
#                             }
#                         }
#                         ws.send(json.dumps(block_command))
#                         print(f"✅ Block command sent to {agent_id} for IP {ip_to_block}")

#                     else:
#                         print(json.dumps(data["data"], indent=2))

#                 else:
#                     print(f"⚠️ Unknown event type from {agent_id}: {event_type}")

#             except json.JSONDecodeError:
#                 print("❌ Invalid JSON received.")

#     except Exception as e:
#         print(f"❌ WebSocket connection closed: {e}")
#     finally:
#         connected_clients.remove(ws)

# if __name__ == '__main__':
#     logging.getLogger('werkzeug').setLevel(logging.ERROR)
#     print("🚀 WebSocket server running at http://localhost:8000/ws")
#     app.run(host="0.0.0.0", port=8000)
