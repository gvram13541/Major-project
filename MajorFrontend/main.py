from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from prometheus_client import Gauge, generate_latest, CONTENT_TYPE_LATEST
import psutil
import random
import time
import threading

# Create Prometheus metrics to expose
cpu_usage = Gauge('cpu_usage', 'CPU Usage in percentage')
memory_usage = Gauge('memory_usage', 'Memory Usage in percentage')
packet_rate = Gauge('packet_rate', 'Packet Rate in packets per second (pps)')
dropped_packets = Gauge('dropped_packets', 'Dropped Packets in percentage')
latency = Gauge('latency', 'Network Latency in milliseconds (ms)')
total_packets_sent = Gauge('total_packets_sent', 'Total Packets Sent')
total_packets_received = Gauge('total_packets_received', 'Total Packets Received')

# Flask app setup
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Endpoint to expose Prometheus metrics
@app.route('/metrics')
def metrics():
    return Response(generate_latest(), content_type=CONTENT_TYPE_LATEST)

# Endpoint to expose system metrics and running applications
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
    for i in range(1, 11):  # Simulate 11 systems
        systems_data.append({
            "systemId": f"System-{i}",
            "applications": running_apps[:2],  # Limit to 2 applications for display
            "cpuUsage": cpu,
            "memoryUsage": memory,
            "networkThroughput": round(network_throughput, 2),
            "packetDropRate": random.uniform(0, 10),  # Simulate packet drop rate
            "activeConnections": active_connections
        })

    return jsonify(systems_data)


@app.route('/system/<system_id>/processes', methods=['GET'])
def get_processes(system_id):
    detailed = request.args.get('detailed', 'false').lower() == 'true'
    try:
        limit = int(request.args.get('limit', 10))
        offset = int(request.args.get('offset', 0))
    except ValueError:
        return jsonify({'error': 'Invalid limit or offset'}), 400

    all_procs = []
    for proc in psutil.process_iter(['pid', 'name', 'username', 'cpu_percent', 'memory_percent']):
        try:
            proc_data = {
                'pid': proc.info['pid'],
                'name': proc.info['name'],
                'username': proc.info['username'],
                'cpu_percent': proc.info['cpu_percent'],
                'memory_percent': proc.info['memory_percent']
            }

            if detailed:
                proc_data['connections'] = [
                    {
                        'fd': conn.fd,
                        'family': conn.family.name,
                        'type': conn.type.name,
                        'laddr': conn.laddr._asdict() if conn.laddr else None,
                        'raddr': conn.raddr._asdict() if conn.raddr else None,
                        'status': conn.status
                    }
                    for conn in proc.connections(kind='inet')
                ]

                proc_data['open_files'] = [
                    {
                        'path': file.path,
                        'fd': file.fd
                    }
                    for file in proc.open_files()
                ]

            all_procs.append(proc_data)

        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    # Apply pagination
    paginated = all_procs[offset:offset + limit]

    return jsonify({
        'systemId': system_id,
        'total': len(all_procs),
        'limit': limit,
        'offset': offset,
        'processes': paginated
    })

# In-memory storage for settings and IPTable rules
settings = {
    "real_time_monitoring": True,
    "traffic_alert_threshold": 80,  # Percentage
}

iptable_rules = [
    {"id": 1, "source": "192.168.1.1", "destination": "192.168.1.2", "port": "80", "action": "ALLOW"},
    {"id": 2, "source": "192.168.1.3", "destination": "192.168.1.4", "port": "443", "action": "BLOCK"},
]

# Endpoint to get general settings
@app.route('/settings', methods=['GET'])
def get_settings():
    return jsonify(settings)

# Endpoint to update general settings
@app.route('/settings', methods=['PUT'])
def update_settings():
    global settings
    data = request.json
    settings["real_time_monitoring"] = data.get("real_time_monitoring", settings["real_time_monitoring"])
    settings["traffic_alert_threshold"] = data.get("traffic_alert_threshold", settings["traffic_alert_threshold"])
    return jsonify({"message": "Settings updated successfully", "settings": settings})

# Endpoint to get all IPTable rules
@app.route('/iptable-rules', methods=['GET'])
def get_iptable_rules():
    return jsonify(iptable_rules)

# Endpoint to add a new IPTable rule
@app.route('/iptable-rules', methods=['POST'])
def add_iptable_rule():
    global iptable_rules
    data = request.json
    new_rule = {
        "id": len(iptable_rules) + 1,
        "source": data["source"],
        "destination": data["destination"],
        "port": data["port"],
        "action": data["action"],
    }
    iptable_rules.append(new_rule)
    return jsonify({"message": "Rule added successfully", "rule": new_rule})

# Endpoint to delete an IPTable rule
@app.route('/iptable-rules/<int:rule_id>', methods=['DELETE'])
def delete_iptable_rule(rule_id):
    global iptable_rules
    iptable_rules = [rule for rule in iptable_rules if rule["id"] != rule_id]
    return jsonify({"message": f"Rule with ID {rule_id} deleted successfully"})

# Function to simulate Prometheus metric collection
def collect_metrics():
    packets_sent = 0
    packets_received = 0

    while True:
        # Simulate CPU usage in percentage
        cpu_usage.set(random.uniform(0, 100))
        # Simulate Memory usage in percentage
        memory_usage.set(random.uniform(0, 100))
        # Simulate Packet Rate in packets per second
        packet_rate.set(random.uniform(100, 10000))
        # Simulate Dropped Packets in percentage
        dropped_packets.set(random.uniform(0, 10))
        # Simulate Latency in milliseconds
        latency.set(random.uniform(1, 500))
        # Simulate Total Packets Sent and Received
        packets_sent += random.randint(100, 1000)
        packets_received += random.randint(100, 1000)
        total_packets_sent.set(packets_sent)
        total_packets_received.set(packets_received)
        time.sleep(10)

if __name__ == '__main__':
    # Start the metric collection in a separate thread
    threading.Thread(target=collect_metrics, daemon=True).start()
    # Start the Flask server
    app.run(host='0.0.0.0', port=8000)