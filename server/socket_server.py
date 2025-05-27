from flask import Flask, Response
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from prometheus_client import Gauge, generate_latest, CONTENT_TYPE_LATEST
import threading, time

# Initialize Flask app and SocketIO
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins='*')

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

# WebSocket Event: Receive metrics from agents
@socketio.on('receive_metrics')
def handle_receive_metrics(data):
    try:
        agent_id = data.get("agent_id")
        metrics = data.get("metrics")

        print(f"Received metrics from {agent_id}: {metrics}")

        if not agent_id or not metrics:
            emit('error', {"error": "agent_id and metrics are required"})
            return

        # Store the metrics in memory, keyed by agent_id
        agent_data[agent_id] = metrics

        # Update agent count
        agent_count.set(len(agent_data))

        # Calculate averages and update Prometheus metrics
        calculate_averages()

        emit('success', {"message": "Metrics received successfully"})
    except Exception as e:
        emit('error', {"error": str(e)})

# WebSocket Event: Fetch all metrics for the frontend
@socketio.on('fetch_frontend_metrics')
def fetch_frontend_metrics():
    emit('frontend_metrics', agent_data)

# WebSocket Event: Fetch specific agent metrics
@socketio.on('fetch_agent_metrics')
def fetch_agent_metrics(data):
    agent_id = data.get("agent_id")
    metrics = agent_data.get(agent_id)
    if not metrics:
        emit('error', {"error": "Agent not found"})
    else:
        emit('agent_metrics', metrics)

# WebSocket Event: Fetch average metrics for widgets
@socketio.on('fetch_widget_metrics')
def fetch_widget_metrics():
    if not agent_data:
        emit('widget_metrics', {
            "cpuUsage": 0,
            "memoryUsage": 0,
            "packetsSent": 0,
            "packetsReceived": 0,
        })
        return

    # Initialize accumulators
    total_cpu = 0
    total_memory = 0
    total_packets_sent = 0
    total_packets_received = 0
    agent_count = len(agent_data)

    # Aggregate metrics from all agents
    for metrics in agent_data.values():
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

    emit('widget_metrics', {
        "cpuUsage": avg_cpu,
        "memoryUsage": avg_memory,
        "packetsSent": avg_packets_sent,
        "packetsReceived": avg_packets_received,
    })

# WebSocket Event: Fetch Chrome tabs for a system
@socketio.on('fetch_chrome_tabs')
def fetch_chrome_tabs(data):
    system_id = data.get("system_id")
    if system_id not in agent_data:
        emit('error', {"error": "System not found"})
        return

    system_metrics = agent_data[system_id].get("System Metrics", {})
    open_tabs = system_metrics.get("Open Tabs", [])

    emit('chrome_tabs', {
        "systemId": system_id,
        "openTabs": open_tabs
    })

# WebSocket Event: Fetch dashboard metrics
@socketio.on('fetch_dashboard_metrics')
def fetch_dashboard_metrics():
    if not agent_data:
        emit('dashboard_metrics', {
            "packetRate": 0,
            "droppedPackets": 0,
            "cpuUtilization": 0,
            "memoryUsage": 0,
            "latency": 0,
        })
        return

    # Initialize accumulators
    total_packet_rate = 0
    total_dropped_packets = 0
    total_cpu_utilization = 0
    total_memory_usage = 0
    total_latency = 0
    system_count = len(agent_data)

    # Aggregate metrics from all systems
    for metrics in agent_data.values():
        system_metrics = metrics.get("System Metrics", {})
        eBPF_metrics = metrics.get("eBPF Metrics", {})

        total_cpu_utilization += system_metrics.get("CPU Usage", [0])[0]
        total_memory_usage += ((system_metrics.get("Used Memory (GB)", 0) / system_metrics.get("Total Memory (GB)", 1)) * 100)
        total_packet_rate += sum(eBPF_metrics.get("Outbound Traffic", {}).values())
        total_dropped_packets += sum(eBPF_metrics.get("Dropped Packets", {}).values())
        total_latency += sum(eBPF_metrics.get("Latency", {}).values())

    # Calculate averages
    avg_packet_rate = total_packet_rate / system_count
    avg_dropped_packets = total_dropped_packets / system_count
    avg_cpu_utilization = total_cpu_utilization / system_count
    avg_memory_usage = total_memory_usage / system_count
    avg_latency = total_latency / system_count

    emit('dashboard_metrics', {
        "packetRate": round(avg_packet_rate, 2),
        "droppedPackets": round(avg_dropped_packets, 2),
        "cpuUtilization": round(avg_cpu_utilization, 2),
        "memoryUsage": round(avg_memory_usage, 2),
        "latency": round(avg_latency, 2),
    })

# WebSocket Event: Fetch system monitoring data
@socketio.on('fetch_systems_monitoring')
def fetch_systems_monitoring():
    systems_data = []

    for agent_id, metrics in agent_data.items():
        system_metrics = metrics.get("System Metrics", {})
        eBPF_metrics = metrics.get("eBPF Metrics", {})

        network_throughput = sum(eBPF_metrics.get("Bandwidth Usage", {}).values()) / (1024 * 1024)  # Convert to Mbps

        systems_data.append({
            "systemId": agent_id,
            "applications": [process["Name"] for process in system_metrics.get("Per Process", [])],
            "cpuUsage": system_metrics.get("CPU Usage", [0])[0],
            "memoryUsage": ((system_metrics.get("Used Memory (GB)", 0) / system_metrics.get("Total Memory (GB)", 1)) * 100),
            "networkThroughput": round(network_throughput, 2),
            "packetDropRate": round(sum(eBPF_metrics.get("Dropped Packets", {}).values()), 2),
            "activeConnections": len(eBPF_metrics.get("Outbound Traffic", {})),
        })

    emit('systems_monitoring', systems_data)

# WebSocket Event: Fetch system processes
@socketio.on('fetch_system_processes')
def fetch_system_processes(data):
    system_id = data.get("system_id")
    limit = int(data.get('limit', 10))
    offset = int(data.get('offset', 0))
    detailed = data.get('detailed', False)

    if system_id not in agent_data:
        emit('error', {"error": "System not found"})
        return

    system_metrics = agent_data[system_id].get("System Metrics", {})
    processes = system_metrics.get("Per Process", [])
    paginated_processes = processes[offset:offset + limit]

    if detailed:
        for process in paginated_processes:
            process["connections"] = [
                {"laddr": {"ip": "127.0.0.1", "port": 8080}, "raddr": {"ip": "192.168.1.1", "port": 443}, "status": "ESTABLISHED"},
                {"laddr": {"ip": "127.0.0.1", "port": 9090}, "raddr": {"ip": "192.168.1.2", "port": 80}, "status": "CLOSE_WAIT"},
            ]
            process["open_files"] = [
                {"path": f"/var/log/{process['Name']}.log", "fd": 3},
                {"path": f"/etc/{process['Name']}.conf", "fd": 4},
            ]

    emit('system_processes', {
        "processes": paginated_processes,
        "total": len(processes),
    })

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
    threading.Thread(target=cleanup_old_data, daemon=True).start()
    socketio.run(app, host='0.0.0.0', port=8000)
