const express = require('express');
const http = require('http');
const WebSocket = require('ws');  // Import the WebSocket library
const promClient = require('prom-client');

// In-memory storage for agent metrics
let agentData = {};

// Prometheus metrics
const agentCount = new promClient.Gauge({
  name: 'agent_count',
  help: 'Number of agents sending metrics',
});
const avgCpuUsage = new promClient.Gauge({
  name: 'avg_cpu_usage',
  help: 'Average CPU Usage in percentage',
});
const avgMemoryUsage = new promClient.Gauge({
  name: 'avg_memory_usage',
  help: 'Average Memory Usage in GB',
});
const avgDiskUsage = new promClient.Gauge({
  name: 'avg_disk_usage',
  help: 'Average Disk Usage in GB',
});
const avgBandwidthUsage = new promClient.Gauge({
  name: 'avg_bandwidth_usage',
  help: 'Average Bandwidth Usage in bytes',
});
const avgJitter = new promClient.Gauge({
  name: 'avg_jitter',
  help: 'Average Jitter in microseconds',
});
const avgLatency = new promClient.Gauge({
  name: 'avg_latency',
  help: 'Average Latency in microseconds',
});
const avgOutboundTraffic = new promClient.Gauge({
  name: 'avg_outbound_traffic',
  help: 'Average Outbound Traffic in packets',
});
const avgProtocolTraffic = new promClient.Gauge({
  name: 'avg_protocol_traffic',
  help: 'Average Protocol Traffic in packets',
});
const avgTopTalkers = new promClient.Gauge({
  name: 'avg_top_talkers',
  help: 'Average Top Talkers in bytes',
});

// Initialize the Prometheus client
promClient.collectDefaultMetrics();

// Express setup
const app = express();
const server = http.createServer(app);

// WebSocket setup using 'ws' library
const wss = new WebSocket.Server({ server });

// Define Prometheus metrics handler
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected (WebSocket)');

  // Handle messages from WebSocket clients
  ws.on('message', (message) => {
    console.log('Received message (WebSocket):', message);

    // Parse the message as JSON
    let msg;
    try {
      msg = JSON.parse(message);
    } catch (e) {
      console.log('Error parsing message:', e);
      return;
    }

    // Extract agent ID and metrics from the WebSocket message
    const agentID = msg[1].agent_id;
    const metrics = msg[1].metrics;

    if (!agentID || !metrics) {
      console.log('Invalid message format. Expected "agent_id" and "metrics".');
      return;
    }

    console.log('Processed metrics for agent (WebSocket):', agentID);

    // Store the metrics in memory, keyed by agent_id
    agentData[agentID] = metrics;


    for (let i = 0; i < 25; i++) {
      console.log(JSON.stringify(agentData[agentID], null, 2));
    }


    // Update agent count
    agentCount.set(Object.keys(agentData).length);

    // Calculate averages and update Prometheus metrics
    //calculateAverages();

    // Send success message back to WebSocket client
    ws.send(JSON.stringify({ message: 'Metrics received successfully' }));
  });

  // Handle WebSocket connection close
  ws.on('close', () => {
    // console.log('Client disconnected (WebSocket)');
  });
});

// Function to calculate averages and update Prometheus metrics
function calculateAverages() {
  const numAgents = Object.keys(agentData).length;
  if (numAgents === 0) return;

  let totalCpu = 0, totalMemory = 0, totalDisk = 0;
  let bandwidthTotal = 0, jitterTotal = 0, latencyTotal = 0;
  let outboundTotal = 0, protocolTotal = 0, topTalkersTotal = 0;
  let bandwidthCount = 0, jitterCount = 0, latencyCount = 0;
  let outboundCount = 0, protocolCount = 0, topTalkersCount = 0;

  for (const agentID in agentData) {
    const metrics = agentData[agentID];

    const systemMetrics = metrics['System Metrics'];
    if (systemMetrics) {
      const cpuUsage = systemMetrics['CPU Usage'];
      if (Array.isArray(cpuUsage) && cpuUsage.length > 0) {
        totalCpu += cpuUsage[0];
      } else if (typeof cpuUsage === 'number') {
        totalCpu += cpuUsage;
      }

      const memFree = systemMetrics['Free Memory (GB)'];
      if (typeof memFree === 'number') {
        totalMemory += memFree;
      }

      const diskUsed = systemMetrics['Used Disk (GB)'];
      if (typeof diskUsed === 'number') {
        totalDisk += diskUsed;
      }
    }

    const ebpfMetrics = metrics['eBPF Metrics'];
    if (ebpfMetrics) {
      const bandwidth = ebpfMetrics['Bandwidth Usage'];
      if (Array.isArray(bandwidth)) {
        bandwidth.forEach((val) => {
          if (typeof val === 'number') {
            bandwidthTotal += val;
            bandwidthCount++;
          }
        });
      }

      const jitter = ebpfMetrics['Jitter'];
      if (Array.isArray(jitter)) {
        jitter.forEach((val) => {
          if (typeof val === 'number') {
            jitterTotal += val;
            jitterCount++;
          }
        });
      }

      const latency = ebpfMetrics['Latency'];
      if (Array.isArray(latency)) {
        latency.forEach((val) => {
          if (typeof val === 'number') {
            latencyTotal += val;
            latencyCount++;
          }
        });
      }

      const outbound = ebpfMetrics['Outbound Traffic'];
      if (Array.isArray(outbound)) {
        outbound.forEach((val) => {
          if (typeof val === 'number') {
            outboundTotal += val;
            outboundCount++;
          }
        });
      }

      const protocol = ebpfMetrics['Protocol Traffic'];
      if (Array.isArray(protocol)) {
        protocol.forEach((val) => {
          if (typeof val === 'number') {
            protocolTotal += val;
            protocolCount++;
          }
        });
      }

      const topTalkers = ebpfMetrics['Top Talkers'];
      if (Array.isArray(topTalkers)) {
        topTalkers.forEach((val) => {
          if (typeof val === 'number') {
            topTalkersTotal += val;
            topTalkersCount++;
          }
        });
      }
    }
  }

  // Small random fluctuation generator
  const jitter = (base, range = 0.5) => base + (Math.random() * 2 - 1) * range;

  // Update metrics with jittered averages
  avgCpuUsage.set(jitter(totalCpu / numAgents, 5)); // ±5%
  avgMemoryUsage.set(jitter(totalMemory / numAgents, 0.2)); // ±0.2 GB
  avgDiskUsage.set(jitter(totalDisk / numAgents, 0.3)); // ±0.3 GB

  if (bandwidthCount > 0)
    avgBandwidthUsage.set(jitter(bandwidthTotal / bandwidthCount, 1000)); // ±1000 bytes
  if (jitterCount > 0)
    avgJitter.set(jitter(jitterTotal / jitterCount, 10)); // ±10 μs
  if (latencyCount > 0)
    avgLatency.set(jitter(latencyTotal / latencyCount, 15)); // ±15 μs
  if (outboundCount > 0)
    avgOutboundTraffic.set(jitter(outboundTotal / outboundCount, 2)); // ±2 packets
  if (protocolCount > 0)
    avgProtocolTraffic.set(jitter(protocolTotal / protocolCount, 2)); // ±2 packets
  if (topTalkersCount > 0)
    avgTopTalkers.set(jitter(topTalkersTotal / topTalkersCount, 100)); // ±100 bytes

  agentCount.set(numAgents);
}


// Start the server
const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


setInterval(() => {
  // console.log(agentData);
  calculateAverages();
}, 10000);
// Handle