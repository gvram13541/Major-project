from prometheus_client import start_http_server, Gauge
import random
import time

# Create Prometheus metrics to expose
cpu_usage = Gauge('cpu_usage', 'CPU Usage in percentage')
memory_usage = Gauge('memory_usage', 'Memory Usage in MB')

def collect_metrics():
    cpu_usage.set(random.uniform(0, 100))  # Simulate CPU usage in percentage
    memory_usage.set(random.uniform(0, 8192))  # Simulate Memory usage in MB

if __name__ == '__main__':
    start_http_server(8000)  # Expose metrics on port 8000
    while True:
        collect_metrics()
        time.sleep(10)

