# filepath: /home/Ubuntu/Desktop/Major-project/frontend/mock_data.py
from flask import Flask, Response
from flask_cors import CORS
from prometheus_client import Gauge, generate_latest, CONTENT_TYPE_LATEST
import random
import time
import threading

# Create Prometheus metrics to expose
cpu_usage = Gauge('cpu_usage', 'CPU Usage in percentage')
memory_usage = Gauge('memory_usage', 'Memory Usage in MB')

# Flask app setup
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Endpoint to expose metrics
@app.route('/metrics')
def metrics():
    return Response(generate_latest(), content_type=CONTENT_TYPE_LATEST)

# Function to simulate metric collection
def collect_metrics():
    while True:
        cpu_usage.set(random.uniform(0, 100))  # Simulate CPU usage in percentage
        memory_usage.set(random.uniform(0, 8192))  # Simulate Memory usage in MB
        time.sleep(10)

if __name__ == '__main__':
    # Start the metric collection in a separate thread
    threading.Thread(target=collect_metrics, daemon=True).start()
    # Start the Flask server
    app.run(host='0.0.0.0', port=8000)