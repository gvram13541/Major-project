## Problem Statement
Managing and securing network traffic accross distributed linux clusters presents significant challenges, including limited scalability, lack of real time monitoring, and absence of dynamic rule enforcement mechanisms. Existing solutions often fail to effectively handle large scale environements or provide centralized control for managing IPTable rules. This project aims to overcome these limitations by utilizing eBPF for kernel level packet inspection, realtime traffic analysis, and centralized rule enforcement, ensuring enhanced network security and operational efficiency.

## Data to be collected
Project goal is to leverage eBPF for real-time packet inspection, traffic analysis, and centralized rule enforcement for better security and operational efficiency in distributed Linux clusters. The data alredy collected such as CPU usage, memory, disk space, bandwidth, DNS queries, firewall rules, HTTP requests, jitter, latency, and outbound traffic, which are all crucial for network monitoring and security analysis.

However, to fully address the challenges in the problem statement—such as scalability, real-time monitoring, and dynamic rule enforcement—there are a few additional data points that we might want to consider collecting to enhance the overall visibility and control over the network traffic across the clusters:

### 1. **Network Traffic Data:**
   - **Packet Counts per Protocol (TCP, UDP, ICMP, etc.):** Track the number of packets per protocol to identify if there are unusual patterns in the types of traffic.
   - **Packets per Interface (eth0, etc.):** Monitor traffic across different network interfaces to understand how network load is distributed.

   **Example:**
   ```json
   "Network Traffic": {
     "eth0": {
       "TCP": 1200,
       "UDP": 150,
       "ICMP": 50
     }
   }
   ```

   - **Interpretation:** Helps monitor traffic distribution by protocol and identify potential network issues (e.g., high TCP traffic or unusual ICMP activity).

### 2. **IP Traffic Distribution:**
   - **Traffic Distribution per IP:** While you are already collecting data on bandwidth usage, it would help to also have a broader traffic distribution per IP or subnet to identify top talkers (IP addresses with the most traffic) and potential issues with rogue IPs.

   **Example:**
   ```json
   "IP Traffic Distribution": {
     "192.168.1.100": {
       "sent": 5000,
       "received": 7000
     },
     "192.168.1.101": {
       "sent": 3000,
       "received": 4000
     }
   }
   ```

   - **Interpretation:** Identifies which IPs are generating the most traffic, both inbound and outbound, which is important for detecting DDoS attacks or unauthorized access.

### 3. **Connection States:**
   - **Connection Tracking (e.g., SYN, ESTABLISHED):** Track the state of TCP connections (SYN, ESTABLISHED, FIN_WAIT, etc.) to identify potential issues with long-lived or unusual connections that might signify attacks like SYN flooding or port scanning.

   **Example:**
   ```json
   "Connection States": {
     "SYN": 50,
     "ESTABLISHED": 200,
     "FIN_WAIT": 10
   }
   ```

   - **Interpretation:** Helps detect connection anomalies, such as excessive connections in the SYN state, indicating possible SYN flood attacks.

### 4. **Intrusion Detection Data:**
   - **Suspicious or Malicious Traffic:** Use eBPF programs to identify potentially malicious traffic (e.g., unusual patterns of failed login attempts, port scanning, etc.). You might want to track metrics like:
     - Failed login attempts (SSH, RDP, etc.)
     - Rate of invalid packets or connections from the same IP address (indicative of brute force attempts)
     - Port scans or unusual traffic spikes

   **Example:**
   ```json
   "Suspicious Traffic": {
     "failed_login_attempts": 15,
     "port_scans": 5
   }
   ```

   - **Interpretation:** These metrics can alert you to security breaches or attempted intrusions in real time.

### 5. **Flow Data:**
   - **Flow Data (NetFlow/sFlow/Flow Exporter):** Capture network flow data, including source/destination IPs, protocols, port numbers, and flow duration, to track and analyze network traffic patterns more deeply.

   **Example:**
   ```json
   "Flows": [
     {
       "source_ip": "192.168.1.100",
       "dest_ip": "192.168.1.200",
       "protocol": "TCP",
       "src_port": 80,
       "dest_port": 8080,
       "bytes": 5000
     }
   ]
   ```

   - **Interpretation:** Flow data provides a richer view of network communication, enabling the detection of anomalous behavior, such as traffic routing anomalies or suspicious service communications.

### 6. **Network Interface Utilization (Bandwidth per Interface):**
   - **Interface Utilization:** Track bandwidth usage across different network interfaces (e.g., eth0, wlan0) to understand network saturation and bottlenecks.

   **Example:**
   ```json
   "Interface Utilization": {
     "eth0": {
       "in_bytes": 1000000,
       "out_bytes": 500000
     },
     "wlan0": {
       "in_bytes": 2000000,
       "out_bytes": 1000000
     }
   }
   ```

   - **Interpretation:** Helps monitor how traffic is distributed between network interfaces, and identify underutilized or overutilized interfaces.

### 7. **Security Alerts and Event Logging:**
   - **Security Events and Alerts:** Collect and monitor logs for specific security events such as failed logins, firewall rule violations, or unauthorized access attempts.
   - **Example:**
     ```json
     "Security Alerts": {
       "failed_login": 3,
       "unauthorized_access": 1
     }
     ```

   - **Interpretation:** This allows you to track incidents in real-time and take immediate action when necessary.

### Summary of Additional Data to Collect:
1. **Network Traffic by Protocol** (TCP, UDP, ICMP, etc.)
2. **Traffic Distribution per IP or Subnet**
3. **Connection States (SYN, ESTABLISHED, etc.)**
4. **Intrusion Detection Metrics** (Failed login attempts, port scans, brute force attempts)
5. **Flow Data** (NetFlow, sFlow, etc.)
6. **Network Interface Utilization** (inbound/outbound bandwidth per interface)
7. **Security Events and Alerts** (failed logins, unauthorized access attempts)

### Conclusion:
The data you have already outlined (CPU usage, memory, disk usage, etc.) is foundational and will help in monitoring system performance. However, to truly address the problem of network security and real-time traffic analysis across distributed Linux clusters, you will need additional data focused on network traffic, connection states, security events, and flow data. This will allow you to more effectively track, monitor, and respond to security incidents and network performance issues in real-time.


## Steps followed to build dashboards:
Great! I'd be happy to guide you through collecting and visualizing these metrics in **Grafana**. Since you're working on macOS, we can walk through the setup process for **Grafana**, **Prometheus**, and how to integrate your metrics (especially eBPF-based metrics) into the system.

### Steps to Set Up Grafana and Collect Metrics on macOS

### 1. **Install Grafana on macOS**
To begin, you'll need to install **Grafana** on your macOS machine.

#### a. **Install Homebrew** (if not already installed)
Homebrew is a package manager for macOS that simplifies installing software.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### b. **Install Grafana via Homebrew**

Once Homebrew is installed, you can easily install Grafana:

```bash
brew install grafana
```

#### c. **Start Grafana Server**

To start Grafana, run the following command:

```bash
brew services start grafana
```

This will start the Grafana service and it will automatically restart when your computer reboots.

#### d. **Access Grafana UI**
Once Grafana is running, you can access the web interface by navigating to:

```
http://localhost:3000
```

The default login credentials are:
- **Username:** admin
- **Password:** admin (you’ll be prompted to change this after logging in for the first time)

---

### 2. **Install Prometheus (for Metric Collection)**

Prometheus is a time-series database that works great with Grafana for storing and querying metrics.

#### a. **Install Prometheus via Homebrew**

```bash
brew install prometheus
```

#### b. **Start Prometheus Server**

You can start Prometheus with the following command:

```bash
prometheus --config.file=/usr/local/etc/prometheus.yml
```

This will start the Prometheus server and expose the metrics endpoint at `http://localhost:9090`.

---

### 3. **Integrate eBPF Metrics with Prometheus**

Now that you have Prometheus and Grafana running, the next step is to collect **eBPF metrics**.

There are a few ways you can collect eBPF metrics on macOS, but **eBPF** primarily works on **Linux-based systems**. If you're running Linux locally (for testing), you can use eBPF-based tools like **BPFTrace** or **eBPF Exporter**.

For this example, let's assume you're using **BPFTrace** or a similar tool on a Linux machine. If you want to use macOS to collect similar metrics (using mock data or other methods), you can use **mock exporters** or even generate data manually for visualization.

#### a. **Using eBPF Exporter (on Linux)**

On a Linux-based system, you can install the **eBPF Exporter** to collect network, system, and security-related metrics and expose them in a format that Prometheus can scrape.

1. **Clone the eBPF Exporter Repository:**

   ```bash
   git clone https://github.com/cilium/ebpf_exporter.git
   cd ebpf_exporter
   ```

2. **Build and Run the Exporter:**

   Follow the instructions in the repository to build and run the exporter on a Linux machine. This exporter will expose metrics that Prometheus can scrape.

   Once set up, Prometheus can scrape data from `http://localhost:9100/metrics`.

#### b. **Mock Data for Testing (macOS)**

Since eBPF won't work directly on macOS, you can use a **mock exporter** or **mock data generator** for testing purposes. Here’s an example of how you might simulate metrics data (for testing):

1. **Create a custom exporter** using a small Python script or tool that generates **dummy metrics** similar to the eBPF metrics you want to collect (e.g., CPU usage, memory usage, traffic, etc.).
   
2. **Expose the metrics** via an HTTP endpoint that Prometheus can scrape (use Python’s `prometheus_client` library for this).

```python
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
```

3. **Prometheus Scraping Configuration:**

In your Prometheus configuration (`prometheus.yml`), add the following scrape configuration:

```yaml
scrape_configs:
  - job_name: 'mock_metrics'
    static_configs:
      - targets: ['localhost:8000']
```

Prometheus will now scrape the mock metrics from the Python exporter on `localhost:8000`.

### 4. **Configure Grafana to Visualize the Metrics**

Now that you have **Prometheus** collecting metrics, you can configure **Grafana** to visualize the metrics.

#### a. **Add Prometheus as a Data Source in Grafana**

1. Go to **Grafana UI** (`http://localhost:3000`).
2. Log in, and on the left sidebar, click on **"Configuration"** (gear icon).
3. Select **"Data Sources"**.
4. Click **"Add data source"**, and choose **Prometheus**.
5. Set the **URL** of Prometheus to `http://localhost:9090`, then click **Save & Test**.

#### b. **Create a Dashboard**

1. From the **Grafana** home screen, click on **"Create"** and choose **Dashboard**.
2. Add a **Panel** to the dashboard.
3. In the **Panel settings**, select **Prometheus** as the data source and start querying for metrics like `cpu_usage`, `memory_usage`, etc.

#### c. **Visualizations**

- **CPU Usage:** Create a **Gauge** or **Bar chart** to visualize CPU usage over time.
- **Memory Usage:** Use a **Gauge** chart to display memory usage (free, used, total).
- **Network Traffic:** For data like bandwidth, use **Bar charts** or **Time-series** graphs.

You can use **PromQL queries** in Grafana to visualize the data:

```prometheus
cpu_usage
memory_usage
```

These will return the relevant metrics collected by Prometheus, which can then be visualized in various formats.

---

### 5. **Alerting (Optional)**

Grafana supports **alerting** based on metrics thresholds, so you can create alerts when a metric exceeds a predefined threshold (e.g., high CPU usage).

1. Go to your panel in Grafana.
2. Click on **"Alert"** (next to the Query options).
3. Set up your alert conditions (e.g., if `cpu_usage > 80%`).
4. Configure how you want to be alerted (email, Slack, etc.).

### Conclusion

To summarize the steps:

1. Install **Grafana** and **Prometheus** on macOS.
2. Use **eBPF Exporter** (Linux) or **mock exporters** (macOS) to collect eBPF-like metrics.
3. Set up Prometheus to scrape the metrics.
4. Configure **Grafana** to visualize the metrics in dashboards.

With these steps, you'll have a system for monitoring and visualizing system, network, and security metrics in Grafana using Prometheus as the data source.
