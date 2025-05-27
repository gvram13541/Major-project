import websocket
import json
import time
import random
import threading

SERVER_WS_URL = "ws://localhost:8000/ws"
AGENT_ID = "dummy-agent-001"

def random_metrics():
    return {
        "System Metrics": {
            "CPU Usage": [round(random.uniform(10, 90), 2)],
            "Free Memory (GB)": round(random.uniform(1, 16), 2),
            "Used Memory (GB)": round(random.uniform(1, 16), 2),
            "Total Memory (GB)": 16,
            "Used Disk (GB)": round(random.uniform(10, 100), 2),
            "Per Process": [
                {"Name": "python", "CPU": round(random.uniform(0, 10), 2)},
                {"Name": "nginx", "CPU": round(random.uniform(0, 10), 2)},
            ],
            "Packets Sent": random.randint(1000, 5000),
            "Packets Received": random.randint(1000, 5000),
            "Open Tabs": ["https://example.com", "https://github.com"]
        },
        "eBPF Metrics": {
            "Bandwidth Usage": {"eth0": random.randint(100000, 1000000)},
            "Jitter": {"eth0": random.randint(1, 10)},
            "Latency": {"eth0": random.randint(10, 100)},
            "Outbound Traffic": {"eth0": random.randint(100, 1000)},
            "Protocol Traffic": {"TCP": random.randint(100, 1000)},
            "Top Talkers": {"192.168.1.1": random.randint(1000, 10000)},
            "Dropped Packets": {"eth0": random.randint(0, 10)}
        }
    }

def send_metrics(ws):
    while True:
        metrics_payload = {
            "event": "metric",
            "agent_id": AGENT_ID,
            "data": random_metrics()
        }
        ws.send(json.dumps(metrics_payload))
        print("Sent metrics")
        time.sleep(5)

def send_alert(ws):
    # Send a high_bandwidth alert after 15 seconds
    time.sleep(15)
    alert_payload = {
        "event": "alert",
        "agent_id": AGENT_ID,
        "data": {
            "alert_type": "high_bandwidth",
            "ip": "10.0.0.5"
        }
    }
    ws.send(json.dumps(alert_payload))
    print("Sent alert")

def on_message(ws, message):
    print("Received from server:", message)

def on_error(ws, error):
    print("WebSocket error:", error)

def on_close(ws, close_status_code, close_msg):
    print("WebSocket closed")

def on_open(ws):
    threading.Thread(target=send_metrics, args=(ws,), daemon=True).start()
    threading.Thread(target=send_alert, args=(ws,), daemon=True).start()

if __name__ == "__main__":
    ws = websocket.WebSocketApp(
        SERVER_WS_URL,
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close
    )
    ws.run_forever()