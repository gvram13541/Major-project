import random
import json
import time
import requests

def generate_agent_id():
    return ":".join(f"{random.randint(0, 255):02x}" for _ in range(6))

def generate_system_metrics():
    process_names = ["firefox", "chrome", "gnome-shell", "pipewire", "update-notifier", "gjs", "sudo"]
    return {
        "CPU Usage": [round(random.uniform(0, 100), 2)],
        "Free Disk (GB)": round(random.uniform(1, 10), 2),
        "Free Memory (GB)": round(random.uniform(0.05, 2), 2),
        "Open Tabs": [
            {
                "Title": "youtube - Google Search",
                "URL": "https://www.google.com/search?q=youtube"
            },
            {
                "Title": "YouTube Embed",
                "URL": "https://www.youtube.com/embed/?enablejsapi=1"
            }
        ],
        "Per Process": [
            {
                "CPU (%)": round(random.uniform(0, 10), 3),
                "Executable": f"/usr/bin/{name}",
                "Memory (%)": round(random.uniform(0.01, 10.0), 3),
                "Name": name,
                "PID": random.randint(1000, 9999),
                "ReadBytes": random.randint(1_000_000, 100_000_000),
                "User": "node-3",
                "WriteBytes": random.randint(0, 50_000_000)
            }
            for name in random.choices(process_names, k=random.randint(5, 10))
        ],
        "Total Disk (GB)": 19.52,
        "Total Memory (GB)": 1.87,
        "Used Disk (GB)": round(random.uniform(10, 18), 2),
        "Used Memory (GB)": round(random.uniform(1, 1.8), 2)
    }

def generate_ebpf_metrics():
    ip_addresses = ["104.18.32.47", "142.250.194.202", "3.233.158.24", "34.104.35.123"]
    ebpf = {
        "Bandwidth Usage": {},
        "DNS Queries": {},
        "Dropped Packets": {},
        "Failed Connections": {},
        "Firewall Rules": {},
        "HTTP Requests": {},
        "Interface Stats": {},
        "Jitter": {},
        "Latency": {},
        "Outbound Traffic": {},
        "Per Process Traffic": {},
        "Protocol Traffic": {"6.0.0.0": 1024},
        "TCP State Transitions": {},
        "Top Talkers": {}
    }

    for ip in ip_addresses:
        value = random.randint(50, 600)
        latency = random.randint(50_000_000, 250_000_000)
        ebpf["Bandwidth Usage"][ip] = value
        ebpf["Outbound Traffic"][ip] = random.randint(1, 10)
        ebpf["Top Talkers"][ip] = value
        ebpf["Latency"][ip] = latency
        ebpf["Jitter"][ip] = latency

    # Generate random DNS Queries
    ebpf["DNS Queries"] = {ip: random.randint(1, 50) for ip in ip_addresses}

    # Generate random Dropped Packets
    ebpf["Dropped Packets"] = {ip: random.randint(0, 5) for ip in ip_addresses}

    # Generate random Failed Connections
    ebpf["Failed Connections"] = {ip: random.randint(0, 10) for ip in ip_addresses}

    # Generate random Firewall Rules
    ebpf["Firewall Rules"] = {ip: random.randint(0, 3) for ip in ip_addresses}

    # Generate random HTTP Requests
    ebpf["HTTP Requests"] = {ip: random.randint(0, 100) for ip in ip_addresses}

    # Generate random Interface Stats
    ebpf["Interface Stats"] = {
        "eth0": {"rx_bytes": random.randint(1_000_000, 10_000_000), "tx_bytes": random.randint(1_000_000, 10_000_000)},
        "wlan0": {"rx_bytes": random.randint(1_000_000, 10_000_000), "tx_bytes": random.randint(1_000_000, 10_000_000)},
    }

    # Generate random TCP State Transitions
    ebpf["TCP State Transitions"] = {
        "ESTABLISHED": random.randint(50, 200),
        "CLOSED": random.randint(10, 50),
        "SYN_SENT": random.randint(5, 20),
        "TIME_WAIT": random.randint(10, 30),
    }

    return ebpf

def generate_mock_data_for_agents(num_agents=3):
    agents_data = []

    for _ in range(random.randint(2, num_agents)):
        agent_data = {
            "agent_id": generate_agent_id(),
            "metrics": {
                "System Metrics": generate_system_metrics(),
                "eBPF Metrics": generate_ebpf_metrics()
            }
        }
        agents_data.append(agent_data)

    return agents_data

if __name__ == "__main__":
    server_url = "http://localhost:8000/agent-metrics"  # Replace with your server's URL

    while True:
        mock_agents = generate_mock_data_for_agents()

        for agent in mock_agents:
            try:
                response = requests.post(server_url, json=agent)
                if response.status_code == 200:
                    print(f"Successfully sent data for agent {agent['agent_id']}")
                else:
                    print(f"Failed to send data for agent {agent['agent_id']}: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"Error sending data for agent {agent['agent_id']}: {e}")

        print("=" * 80)  # Visual separator between iterations
        time.sleep(5)  # Wait 5 seconds before sending the next batch