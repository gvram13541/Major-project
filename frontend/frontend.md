# eBPF Dashboard Frontend

This project provides a frontend dashboard for monitoring system and network metrics using Grafana, Prometheus, and mock data.

---

## Prerequisites

Before starting, ensure you have the following installed on your system:
- **Python 3.8+**
- **Node.js 16+**
- **npm** (Node Package Manager)
- **Prometheus**
- **Grafana**

---

## Steps to Set Up and Run the Frontend Directory

### 1. **Set Up Grafana**

Grafana is used to visualize the metrics collected by Prometheus.

#### Install Grafana:
1. Update and install dependencies:
   ```bash
   sudo apt update && sudo apt install -y software-properties-common
   sudo apt-get install -y adduser libfontconfig1
   ```

2. Add the official Grafana APT repository:
   ```bash
   echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
   ```

3. Add the GPG key:
   ```bash
   wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
   ```

4. Update the package list and install Grafana:
   ```bash
   sudo apt update && sudo apt install -y grafana
   ```

#### Start and Enable Grafana:
1. Start the Grafana service:
   ```bash
   sudo systemctl start grafana-server
   ```

2. Enable Grafana to start on boot:
   ```bash
   sudo systemctl enable grafana-server
   ```

3. Verify Grafana is running:
   ```bash
   sudo systemctl status grafana-server
   ```

#### Modify `grafana.ini` for Embedding:
1. Open the Grafana configuration file:
   ```bash
   sudo nano /etc/grafana/grafana.ini
   ```

2. Update the following settings:
   ```ini
   [security]
   allow_embedding = true

   [auth]
   disable_login_form = false
   ```

3. Save the file and restart Grafana:
   ```bash
   sudo systemctl restart grafana-server
   ```

4. For more details on modifying `grafana.ini`, refer to this [guide](https://www.google.com/search?client=ubuntu-sn&channel=fs&q=allow+embeding+in+grafana#fpstate=ive&vld=cid:f792639c,vid:Ct9PjmrExzo,st:0).

#### Access Grafana:
- Open a browser and go to: **`http://localhost:3000`**
- Default credentials:
  - **Username:** `admin`
  - **Password:** `admin` (you will be asked to change it)

---

### 2. **Set Up Prometheus**

Prometheus is used to scrape and store metrics from the mock data exporter.

#### Install Prometheus:
For better Prometheus installation, follow the steps in this [guide](https://www.cherryservers.com/blog/install-prometheus-ubuntu).

#### Configure Prometheus to Scrape Mock Data:
1. Edit the `prometheus.yml` file:
   ```yaml
   scrape_configs:
     - job_name: 'mock_metrics'
       static_configs:
         - targets: ['localhost:8000']
   ```

2. Restart Prometheus to apply the changes:
   ```bash
   sudo systemctl restart prometheus
   ```

---

### 3. **Run `mock_data.py`**

The `mock_data.py` script generates mock metrics for CPU and memory usage and exposes them on `http://localhost:8000`.

#### Install Dependencies:
1. Create a virtual environment (optional):
   ```bash
   python3 -m venv myenv
   source myenv/bin/activate
   ```

2. Install the required Python libraries:
   ```bash
   pip install flask flask-cors prometheus-client
   ```

#### Run the Script:
1. Navigate to the `frontend` directory:
   ```bash
   cd /home/Ubuntu/Desktop/Major-project/frontend
   ```

2. Run the `mock_data.py` script:
   ```bash
   python3 mock_data.py
   ```

3. Verify the metrics are exposed:
   - Open a browser and go to: **`http://localhost:8000/metrics`**
   - You should see metrics like `cpu_usage` and `memory_usage`.

---

### 4. **Run the Frontend React App**

The React app provides the user interface for the dashboard.

#### Install Dependencies:
1. Navigate to the `dashboard-app` directory:
   ```bash
   cd /home/Ubuntu/Desktop/Major-project/frontend/dashboard-app
   ```

2. Install the required npm packages:
   ```bash
   npm install
   ```

#### Start the React App:
1. Run the app:
   ```bash
   npm start
   ```

2. Open the app in your browser:
   - Go to: **`http://localhost:3001`**

---

### 5. **Integrate Grafana with Prometheus**

To visualize the metrics in Grafana:

1. Add Prometheus as a Data Source:
   - Go to **`http://localhost:3000`** (Grafana UI).
   - Click on **"Configuration"** (gear icon) > **"Data Sources"**.
   - Click **"Add data source"**, and select **Prometheus**.
   - Set the URL to **`http://localhost:9090`** and click **Save & Test**.

2. Create Dashboards:
   - Create a new dashboard in Grafana.
   - Add panels for metrics like `cpu_usage` and `memory_usage`.
   - Use PromQL queries to fetch data:
     ```prometheus
     cpu_usage
     memory_usage
     ```

---

### 6. **Navigate the Frontend**

- **Home Page**: Displays an overview of the system.
- **CPU Usage**: Click on "CPU Usage" in the sidebar to view the CPU usage dashboard.
- **Memory Usage**: Click on "Memory Usage" in the sidebar to view the memory usage dashboard.
- **Traffic**: Click on "Traffic" in the sidebar to view network traffic metrics.

---

### Summary of Commands

1. **Start Grafana**:
   ```bash
   sudo systemctl start grafana-server
   ```

2. **Start Prometheus**:
   ```bash
   ./prometheus --config.file=prometheus.yml
   ```

3. **Run Mock Data Exporter**:
   ```bash
   python3 mock_data.py
   ```

4. **Start React App**:
   ```bash
   npm start
   ```

---

### Troubleshooting

- **CORS Issues**: Ensure `flask-cors` is installed and enabled in `mock_data.py`.
- **Grafana Embedding**: Ensure `allow_embedding = true` is set in the `grafana.ini` file under the `[security]` section.
- **Prometheus Scraping**: Verify the `prometheus.yml` configuration and ensure Prometheus is running.

---