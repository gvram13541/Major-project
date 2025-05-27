import socketio

# Initialize client
sio = socketio.Client()

# Connection events
@sio.event
def connect():
    print('✅ Connected to server')

@sio.event
def disconnect():
    print('❌ Disconnected from server')

# General handlers
@sio.on('success')
def on_success(data):
    print('✅ Success:', data)

@sio.on('error')
def on_error(data):
    print('❌ Error:', data)

# Specific event handlers
@sio.on('widget_metrics')
def on_widget_metrics(data):
    print('📊 Widget Metrics:', data)

@sio.on('dashboard_metrics')
def on_dashboard_metrics(data):
    print('📉 Dashboard Metrics:', data)

@sio.on('chrome_tabs')
def on_chrome_tabs(data):
    print('🧭 Chrome Tabs:', data)

@sio.on('systems_monitoring')
def on_systems_monitoring(data):
    print('🖥️ Systems Monitoring:', data)

# Connect to your Flask-SocketIO server
sio.connect('http://localhost:8000')

# Emit sample metrics data
agent_id = "agent-test-001"
sio.emit('receive_metrics', {
    "agent_id": agent_id,
    "metrics": {
        "System Metrics": {
            "CPU Usage": [42.5],
            "Free Memory (GB)": 6.2,
            "Used Memory (GB)": 9.8,
            "Total Memory (GB)": 16,
            "Packets Sent": 1200,
            "Packets Received": 1180,
            "Per Process": [{"Name": "nginx"}, {"Name": "python"}],
            "Open Tabs": ["https://openai.com", "https://github.com"]
        },
        "eBPF Metrics": {
            "Bandwidth Usage": {"eth0": 1536000},
            "Jitter": {"eth0": 40},
            "Latency": {"eth0": 150},
            "Outbound Traffic": {"TCP": 300},
            "Protocol Traffic": {"HTTP": 150},
            "Dropped Packets": {"eth0": 3},
            "Top Talkers": {"10.0.0.1": 2048000}
        }
    }
})

# Request additional metrics after a brief pause
import time
time.sleep(1)

sio.emit('fetch_widget_metrics')
sio.emit('fetch_dashboard_metrics')
sio.emit('fetch_chrome_tabs', {"system_id": agent_id})
sio.emit('fetch_systems_monitoring')

sio.wait()
