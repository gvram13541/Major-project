
from flask import Flask, Response
from flask_cors import CORS
from prometheus_client import Gauge, generate_latest, CONTENT_TYPE_LATEST
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

# Endpoint to expose metrics
@app.route('/metrics')
def metrics():
    return Response(generate_latest(), content_type=CONTENT_TYPE_LATEST)

# Function to simulate metric collection
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
