
# Network Monitoring and Visualization Report

## Overview

This document explains how the system and eBPF metrics, collected using eBPF programs, are interpreted and how they can be visualized on a dashboard. These metrics offer insights into network traffic, bandwidth usage, system resource consumption, and more. 

The sample data provided will be used to demonstrate how to interpret the metrics and create visualizations for the dashboard.

---

## 1. System Metrics

### a. CPU Usage
- **Key:** `"System Metrics" -> "CPU Usage"`
- **Data Format:** List of percentages representing CPU usage across multiple cores.
  
#### Example:
```json
"CPU Usage": [
  2.0100502512565113,
  1.0050251256282556
]
```

- **Interpretation:** The CPU usage for each core is represented by a percentage. Here, Core 1 is using 2.01%, and Core 2 is using 1.00% of its total capacity.
- **Visualization:** 
  - **Pie Chart** or **Bar Graph** to show CPU usage per core.
  - **Line Graph** for trend analysis of CPU usage over time.

### b. Free Disk
- **Key:** `"System Metrics" -> "Free Disk"`
- **Data Format:** Disk space available (in GB).

#### Example:
```json
"Free Disk": 54.425323486328125
```

- **Interpretation:** The system has 54.42 GB of free disk space.
- **Visualization:** 
  - **Gauge Chart** to show available disk space relative to the total capacity.
  - **Bar Chart** comparing total disk space, used space, and free space.

### c. Free Memory
- **Key:** `"System Metrics" -> "Free Memory"`
- **Data Format:** Available memory (in GB).

#### Example:
```json
"Free Memory": 0.4799346923828125
```

- **Interpretation:** The system has approximately 0.48 GB of free memory.
- **Visualization:** 
  - **Gauge Chart** to show available memory.
  - **Bar Chart** showing free, used, and total memory.

### d. Total Disk and Memory
- **Key:** `"System Metrics" -> "Total Disk" / "Total Memory"`
- **Data Format:** Total disk or memory capacity (in GB).

#### Example:
```json
"Total Disk": 97.86907196044922,
"Total Memory": 3.7775192260742188
```

- **Interpretation:** The system has a total disk space of 97.87 GB and a total memory of 3.78 GB.
- **Visualization:** 
  - **Bar Chart** showing the total disk and memory along with free and used space.
  - **Pie Chart** showing the distribution of used vs. free space.

### e. Used Disk and Memory
- **Key:** `"System Metrics" -> "Used Disk" / "Used Memory"`
- **Data Format:** Used disk or memory (in GB).

#### Example:
```json
"Used Disk": 38.42827224731445,
"Used Memory": 1.6742362976074219
```

- **Interpretation:** The system is using 38.43 GB of disk space and 1.67 GB of memory.
- **Visualization:** 
  - **Bar Chart** showing the used disk and memory along with free space.
  - **Stacked Bar Chart** with used, free, and total metrics.

---

## 2. eBPF Metrics

### a. Bandwidth Usage
- **Key:** `"eBPF Metrics" -> "Bandwidth Usage"`
- **Data Format:** A map of IP addresses to packet counts (in bytes).

#### Example:
```json
"Bandwidth Usage": {
  "25864384": 160,
  "426857100": 140,
  "985562553": 90
}
```

- **Interpretation:** The system tracked traffic for three different IP addresses. The first IP (25864384) has used 160 bytes, the second (426857100) has used 140 bytes, and the third (985562553) has used 90 bytes.
- **Visualization:** 
  - **Bar Chart** for bandwidth usage per IP.
  - **Pie Chart** to show the percentage of total bandwidth used by each IP.

### b. DNS Queries
- **Key:** `"eBPF Metrics" -> "DNS Queries"`
- **Data Format:** A map of IP addresses to DNS query counts.

#### Example:
```json
"DNS Queries": {}
```

- **Interpretation:** There are no DNS queries logged for the tracked IPs.
- **Visualization:** 
  - **Bar Chart** showing the number of DNS queries per IP (if any).
  - **Pie Chart** for total vs. zero queries.

### c. Firewall Rules
- **Key:** `"eBPF Metrics" -> "Firewall Rules"`
- **Data Format:** A map of IP addresses flagged by firewall.

#### Example:
```json
"Firewall Rules": {}
```

- **Interpretation:** No firewall rules are triggered.
- **Visualization:** 
  - **Bar Chart** showing IP addresses flagged by the firewall (if any).

### d. HTTP Requests
- **Key:** `"eBPF Metrics" -> "HTTP Requests"`
- **Data Format:** A map of IP addresses to HTTP request counts.

#### Example:
```json
"HTTP Requests": {}
```

- **Interpretation:** No HTTP requests were logged.
- **Visualization:** 
  - **Bar Chart** showing HTTP request counts per IP (if any).

### e. Jitter and Latency
- **Key:** `"eBPF Metrics" -> "Jitter" / "Latency"`
- **Data Format:** A map of IP addresses to jitter or latency values (in microseconds).

#### Example:
```json
"Jitter": {
  "426857100": 604169
},
"Latency": {
  "426857100": 604169
}
```

- **Interpretation:** The system measures jitter and latency for the IP address 426857100, both being 604169 microseconds.
- **Visualization:** 
  - **Line Graph** to show latency and jitter over time.
  - **Bar Chart** showing latency/jitter per IP.

### f. Outbound Traffic
- **Key:** `"eBPF Metrics" -> "Outbound Traffic"`
- **Data Format:** A map of IP addresses to outbound traffic counts.

#### Example:
```json
"Outbound Traffic": {
  "25864384": 1,
  "426857100": 2,
  "985562553": 1
}
```

- **Interpretation:** The system tracked the number of outbound traffic packets. IP address 25864384 sent 1 packet, 426857100 sent 2 packets, and 985562553 sent 1 packet.
- **Visualization:** 
  - **Bar Chart** for outbound traffic per IP.
  - **Pie Chart** showing the distribution of outbound traffic by IP.

---

## Conclusion: Visualization Guidelines

1. **CPU Usage:** Use **Bar Charts** or **Line Graphs** to show the usage of each CPU core over time. For real-time updates, use **Line Graphs**.
2. **Disk and Memory Metrics:** Use **Gauge Charts** for current available/free values and **Bar Charts** or **Pie Charts** for total, used, and free space.
3. **Bandwidth Usage:** **Bar Charts** are ideal for visualizing bandwidth usage per IP.
4. **DNS Queries, Firewall Rules, HTTP Requests:** **Bar Charts** for the number of queries/requests/firewall triggers per IP.
5. **Latency and Jitter:** **Line Graphs** for trends over time and **Bar Charts** for individual IP measurements.
6. **Outbound Traffic:** Use **Bar Charts** for outbound traffic per IP and **Pie Charts** for relative comparison.

By following these guidelines, you can effectively display and monitor the performance of your network and system resources using the collected metrics.

