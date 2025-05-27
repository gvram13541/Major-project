from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from prometheus_client import Gauge, generate_latest, CONTENT_TYPE_LATEST
import threading
import time, psutil, random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Email configuration
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
EMAIL_ADDRESS = 'rogernovak377@gmail.com'  # Sender's email address
EMAIL_PASSWORD = 'rogernovak@2024'  # Sender's email password (use an app password if 2FA is enabled)
RECIPIENT_EMAIL = 'sudarshanudupa06@gmail.com'  # Recipient's email address

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# In-memory storage for metrics from agents
agent_data = {}

# Prometheus metrics
agent_count = Gauge('agent_count', 'Number of agents sending metrics')
avg_cpu_usage = Gauge('avg_cpu_usage', 'Average CPU Usage in percentage')
avg_memory_usage = Gauge('avg_memory_usage', 'Average Memory Usage in GB')
avg_disk_usage = Gauge('avg_disk_usage', 'Average Disk Usage in GB')
avg_bandwidth_usage = Gauge('avg_bandwidth_usage', 'Average Bandwidth Usage in bytes')
avg_jitter = Gauge('avg_jitter', 'Average Jitter in microseconds')
avg_latency = Gauge('avg_latency', 'Average Latency in microseconds')
avg_outbound_traffic = Gauge('avg_outbound_traffic', 'Average Outbound Traffic in packets')
avg_protocol_traffic = Gauge('avg_protocol_traffic', 'Average Protocol Traffic in packets')
avg_top_talkers = Gauge('avg_top_talkers', 'Average Top Talkers in bytes')

# Endpoint for agents to send metrics
@app.route('/agent-metrics', methods=['POST'])
def receive_metrics():
    try:
        data = request.json
        agent_id = data.get("agent_id")
        metrics = data.get("metrics")

        print(data)  # Debugging line to see incoming data

        if not agent_id or not metrics:
            return jsonify({"error": "agent_id and metrics are required"}), 400

        # Store the metrics in memory, keyed by agent_id
        agent_data[agent_id] = metrics

        # Update agent count
        agent_count.set(len(agent_data))

        # Calculate averages and update Prometheus metrics
        calculate_averages()

        return jsonify({"message": "Metrics received successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Function to send email alerts
def send_email_alert(subject, body):
    try:
        # Create the email
        msg = MIMEMultipart()
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = RECIPIENT_EMAIL
        msg['Subject'] = subject

        # Add the email body
        msg.attach(MIMEText(body, 'plain'))

        # Connect to the SMTP server and send the email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()  # Upgrade the connection to a secure encrypted SSL/TLS connection
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()

        print(f"Email sent to {RECIPIENT_EMAIL}")
    except Exception as e:
        print(f"Failed to send email: {e}")

# Function to calculate averages and update Prometheus metrics
def calculate_averages():
    if not agent_data:
        return

    # Initialize accumulators
    total_cpu = 0
    total_memory = 0
    total_disk = 0
    total_bandwidth = 0
    total_jitter = 0
    total_latency = 0
    total_outbound = 0
    total_protocol = 0
    total_top_talkers = 0

    agent_count = len(agent_data)
    bandwidth_count = 0
    jitter_count = 0
    latency_count = 0
    outbound_count = 0
    protocol_count = 0
    top_talkers_count = 0

    for agent_id, metrics in agent_data.items():
        system_metrics = metrics.get("System Metrics", {})
        eBPF_metrics = metrics.get("eBPF Metrics", {})

        # Aggregate system metrics
        total_cpu += system_metrics.get("CPU Usage", [0])[0]
        total_memory += system_metrics.get("Free Memory (GB)", 0)
        total_disk += system_metrics.get("Used Disk (GB)", 0)

        # Aggregate eBPF metrics
        for ip, usage in eBPF_metrics.get("Bandwidth Usage", {}).items():
            total_bandwidth += usage
            bandwidth_count += 1

        for ip, jitter_value in eBPF_metrics.get("Jitter", {}).items():
            total_jitter += jitter_value
            jitter_count += 1

        for ip, latency_value in eBPF_metrics.get("Latency", {}).items():
            total_latency += latency_value
            latency_count += 1

        for ip, packets in eBPF_metrics.get("Outbound Traffic", {}).items():
            total_outbound += packets
            outbound_count += 1

        for protocol_id, packets in eBPF_metrics.get("Protocol Traffic", {}).items():
            total_protocol += packets
            protocol_count += 1

        for ip, bytes_sent in eBPF_metrics.get("Top Talkers", {}).items():
            total_top_talkers += bytes_sent
            top_talkers_count += 1

    # Calculate averages
    avg_cpu = total_cpu / agent_count
    avg_memory = total_memory / agent_count

    avg_cpu_usage.set(avg_cpu)
    avg_memory_usage.set(avg_memory)
    avg_disk_usage.set(total_disk / agent_count)
    avg_bandwidth_usage.set(total_bandwidth / bandwidth_count if bandwidth_count > 0 else 0)
    avg_jitter.set(total_jitter / jitter_count if jitter_count > 0 else 0)
    avg_latency.set(total_latency / latency_count if latency_count > 0 else 0)
    avg_outbound_traffic.set(total_outbound / outbound_count if outbound_count > 0 else 0)
    avg_protocol_traffic.set(total_protocol / protocol_count if protocol_count > 0 else 0)
    avg_top_talkers.set(total_top_talkers / top_talkers_count if top_talkers_count > 0 else 0)

    # Send email alerts if thresholds are exceeded
    if avg_cpu > 50:
        send_email_alert(
            "High CPU Usage Alert",
            f"The average CPU usage is {avg_cpu:.2f}%, which exceeds the threshold of 50%."
        )

    if avg_memory > 50:
        send_email_alert(
            "High Memory Usage Alert",
            f"The average memory usage is {avg_memory:.2f}%, which exceeds the threshold of 50%."
        )


# Endpoint for the frontend to fetch metrics
@app.route('/frontend-metrics', methods=['GET'])
def get_metrics():
    fronte_end_metrics = jsonify(agent_data)
    print(fronte_end_metrics)
    return jsonify(agent_data)

# Endpoint for the frontend to fetch specific agent metrics
@app.route('/agent-metrics/<agent_id>', methods=['GET'])
def get_agent_metrics(agent_id):
    metrics = agent_data.get(agent_id)
    if not metrics:
        return jsonify({"error": "Agent not found"}), 404
    return jsonify(metrics)
# Endpoint for the frontend to fetch all agent IDs
@app.route('/agent-ids', methods=['GET'])
def get_agent_ids():
    agent_ids = list(agent_data.keys())
    return jsonify(agent_ids)

@app.route('/charts-data/polar', methods=['GET'])
def get_polar_chart_data():
    data = {
        "labels": ['Node1', 'Node2', 'Node3'],
        "data": [11, 16, 7]  # Example packet drop rates for Node1, Node2, and Node3
    }
    return jsonify(data)

@app.route('/charts-data/radar', methods=['GET'])
def get_radar_chart_data():
    data = {
        "labels": ['CPU Usage', 'Memory Usage', 'Disk Usage'],
        "datasets": [
            {
                "label": "Node1",
                "data": [65, 59, 90]  # Example data for Node1
            },
            {
                "label": "Node2",
                "data": [28, 48, 40]  # Example data for Node2
            },
            {
                "label": "Node3",
                "data": [75, 68, 50]  # Example data for Node3
            },
        ]
    }
    return jsonify(data)

# Endpoint to fetch average metrics for widgets
@app.route('/widget-metrics', methods=['GET'])
def get_widget_metrics():
    if not agent_data:
        return jsonify({
            "cpuUsage": 0,
            "memoryUsage": 0,
            "packetsSent": 0,
            "packetsReceived": 0,
        })

    # Initialize accumulators
    total_cpu = 0
    total_memory = 0
    total_packets_sent = 0
    total_packets_received = 0
    agent_count = len(agent_data)

    # Aggregate metrics from all agents
    for agent_id, metrics in agent_data.items():
        system_metrics = metrics.get("System Metrics", {})
        total_cpu += system_metrics.get("CPU Usage", [0])[0]
        total_memory += system_metrics.get("Free Memory (GB)", 0)
        total_packets_sent += system_metrics.get("Packets Sent", 0)
        total_packets_received += system_metrics.get("Packets Received", 0)

    # Calculate averages
    avg_cpu = round(total_cpu / agent_count, 2)
    avg_memory = round(total_memory / agent_count, 2)
    avg_packets_sent = int(total_packets_sent / agent_count)
    avg_packets_received = int(total_packets_received / agent_count)

    return jsonify({
        "cpuUsage": avg_cpu,
        "memoryUsage": avg_memory,
        "packetsSent": avg_packets_sent,
        "packetsReceived": avg_packets_received,
    })

@app.route('/applications', methods=['GET'])
def applications():
    # Get running applications (process names)
    running_apps = [p.info['name'] for p in psutil.process_iter(['name']) if p.info['name']]

    # Get system metrics
    cpu = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory().percent
    network_info = psutil.net_io_counters()
    network_throughput = (network_info.bytes_sent + network_info.bytes_recv) / (1024 * 1024)  # Convert to MB
    active_connections = len(psutil.net_connections(kind='inet'))

    # Simulate multiple systems for demonstration
    systems_data = []
    for i in range(1, 11):  # Simulate 10 systems
        systems_data.append({
            "systemId": f"System-{i}",
            "applications": running_apps[:2],  # Limit to 2 applications for display
            "cpuUsage": cpu,
            "memoryUsage": memory,
            "networkThroughput": round(network_throughput, 2),
            "packetDropRate": round(random.uniform(0, 10), 2),  # Simulate packet drop rate
            "activeConnections": active_connections
        })

    return jsonify(systems_data)

@app.route('/charts-data/bar', methods=['GET'])
def get_bar_chart_data():
    # Example data: Replace this with actual data collection logic
    http_methods = {
        "GET": 120,
        "POST": 80,
        "PUT": 30,
        "DELETE": 10,
        "PATCH": 5,
    }

    protocols = {
        "HTTP/1.1": 150,
        "HTTP/2": 90,
        "HTTP/3": 20,
    }

    # Combine the data into a format suitable for the frontend
    data = {
        "labels": list(http_methods.keys()) + list(protocols.keys()),
        "datasets": [
            {
                "label": "HTTP Methods",
                "backgroundColor": "#f87979",
                "data": list(http_methods.values()),
            },
            {
                "label": "Protocols",
                "backgroundColor": "#36A2EB",
                "data": list(protocols.values()),
            },
        ],
    }

    return jsonify(data)

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

@app.route('/dashboard-metrics', methods=['GET'])
def get_dashboard_metrics():
    if not agent_data:
        # Return default values if no data is available
        return jsonify({
            "packetRate": 0,
            "droppedPackets": 0,
            "cpuUtilization": 0,
            "memoryUsage": 0,
            "latency": 0,
        })

    # Initialize accumulators
    total_packet_rate = 0
    total_dropped_packets = 0
    total_cpu_utilization = 0
    total_memory_usage = 0
    total_latency = 0
    system_count = len(agent_data)

    # Aggregate metrics from all systems
    for agent_id, metrics in agent_data.items():
        system_metrics = metrics.get("System Metrics", {})
        eBPF_metrics = metrics.get("eBPF Metrics", {})

        # Aggregate system metrics
        total_cpu_utilization += system_metrics.get("CPU Usage", [0])[0]
        total_memory_usage += ((system_metrics.get("Used Memory (GB)", 0) / system_metrics.get("Total Memory (GB)", 1)) * 100)

        # Aggregate eBPF metrics
        total_packet_rate += sum(eBPF_metrics.get("Outbound Traffic", {}).values())
        total_dropped_packets += sum(eBPF_metrics.get("Dropped Packets", {}).values())
        total_latency += sum(eBPF_metrics.get("Latency", {}).values())

    # Calculate averages
    avg_packet_rate = total_packet_rate / system_count
    avg_dropped_packets = total_dropped_packets / system_count
    avg_cpu_utilization = total_cpu_utilization / system_count
    avg_memory_usage = total_memory_usage / system_count
    avg_latency = total_latency / system_count

    # Return the averages as JSON
    return jsonify({
        "packetRate": round(avg_packet_rate, 2),
        "droppedPackets": round(avg_dropped_packets, 2),
        "cpuUtilization": round(avg_cpu_utilization, 2),
        "memoryUsage": round(avg_memory_usage, 2),
        "latency": round(avg_latency, 2),
    })

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

# Expose Prometheus metrics
@app.route('/metrics', methods=['GET'])
def prometheus_metrics():
    return Response(generate_latest(), content_type=CONTENT_TYPE_LATEST)

# Simulate periodic cleanup of old data (optional)
def cleanup_old_data():
    while True:
        time.sleep(60)  # Run every 60 seconds
        # Logic to clean up old data if needed
        pass

if __name__ == '__main__':
    # Start the cleanup thread
    threading.Thread(target=cleanup_old_data, daemon=True).start()
    # Start the historical metrics update thread
    # threading.Thread(target=get_dashboard_metrics, daemon=True).start()
    # Start the Flask server
    app.run(host='0.0.0.0', port=8000)