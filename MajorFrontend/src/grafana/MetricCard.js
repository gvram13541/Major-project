import React from "react";
import { CCard, CCardBody, CCardHeader } from "@coreui/react";
import { useParams } from "react-router-dom";
const metrics = {
  dashboard: {
    name: "Dashboard",
    url: "/dashboard",
  },
  cpu: {
    name: "CPU Usage",
    url: "http://localhost:3000/d-solo/dejuili10v8cga/cpu-usage?orgId=1&from=1748284702706&to=1748285002706&timezone=browser&refresh=10s&panelId=1&__feature.dashboardSceneSolo",
  },
  memory: {
    name: "Memory Usage",
    url: "http://localhost:3000/d-solo/aek1quja2603ka/memory-usage?orgId=1&from=1747364906296&to=1747386506296&timezone=browser&refresh=5s&panelId=1&__feature.dashboardSceneSolo",
  },
  packetRate: {
    name: "Packet Rate",
    url: "http://localhost:3000/d-solo/04e90790-6a10-40ac-9d98-76a5fe3e0688/packetrate?orgId=1&from=1747365109342&to=1747386709342&timezone=browser&refresh=5s&panelId=1&__feature.dashboardSceneSolo",
  },
  PacketDropRate: {
    name: "Dropped Packets",
    url: "http://localhost:3000/d-solo/dejuili10v8cga/cpu-usage?orgId=1&from=1745471253811&to=1745471553811&timezone=browser&refresh=10s&panelId=1&__feature.dashboardSceneSolo",
  },
  latency: {
    name: "Latency",
    url: "http://localhost:3000/d-solo/fek1pnvrpp62oe/latency?orgId=1&from=1747365952438&to=1747387552438&timezone=browser&refresh=5s&panelId=1&__feature.dashboardSceneSolo",
  },
bandwith: {
    name: "Bandwidth",
    url: "http://localhost:3000/d-solo/fek1od4ns84cgf/bandwidth-usage?orgId=1&from=1747365155124&to=1747386755124&timezone=browser&refresh=5s&panelId=1&__feature.dashboardSceneSolo",
  },
  packetDropRate: {
    name: "Packet Drop Rate",
    url: "http://localhost:3000/d-solo/fek1pqf0eof0gf/outboound-traffic?orgId=1&from=1747366045204&to=1747387645204&timezone=browser&panelId=1&__feature.dashboardSceneSolo",
  },
  protocoldistribution: {
    name: "Protocol Distribution",
    url: "http://localhost:3000/d-solo/eek1p9swlxlhcd/protocolo-dis?orgId=1&from=1747365191788&to=1747386791788&timezone=browser&panelId=1&__feature.dashboardSceneSolo",
  },
  malicioustraffic: {
    name: "Malicious Traffic",
    url: "http://localhost:3000/d-solo/aeilsvv55n7r4e/malicious-traffic?orgId=1&from=1744390877074&to=1744391177074&timezone=browser&refresh=10s&panelId=8&__feature.dashboardSceneSolo",
  },
  networkUsage: {
    name: "Network Usage",
    url: "http://localhost:3000/d-solo/aeilsvv55n7r4e/network-usage?orgId=1&from=1744390877074&to=1744391177074&timezone=browser&refresh=10s&panelId=9&__feature.dashboardSceneSolo",
  },
  networkLatency: {
    name: "Network Latency",
    url: "http://localhost:3000/d-solo/aeilsvv55n7r4e/network-latency?orgId=1&from=1744390877074&to=1744391177074&timezone=browser&refresh=10s&panelId=10&__feature.dashboardSceneSolo",
  },
  diskiolog: {
    name: "Disk I/O Log",
    url: "http://localhost:3000/d-solo/aek1sws4xrh1cd/disk?orgId=1&from=1747364948987&to=1747386548987&timezone=browser&refresh=5s&panelId=1&__feature.dashboardSceneSolo",
  networkPacketDropRate: {
    name: "Network Packet Drop Rate",
    url: "http://localhost:3000/d-solo/fek1pqf0eof0gf/outboound-traffic?orgId=1&from=1745623653879&to=1745645253879&timezone=browser&panelId=1&__feature.dashboardSceneSolo",
  },
  networkBandwidth: {
    name: "Network Bandwidth",
    url: "http://localhost:3000/d-solo/aeilsvv55n7r4e/network-bandwidth?orgId=1&from=1744390877074&to=1744391177074&timezone=browser&refresh=10s&panelId=12&__feature.dashboardSceneSolo",
  },
  networkPacketRate: {
    name: "Network Packet Rate",
    url: "http://localhost:3000/d-solo/aeilsvv55n7r4e/network-packet-rate?orgId=1&from=1744390877074&to=1744391177074&timezone=browser&refresh=10s&panelId=13&__feature.dashboardSceneSolo",
  },
  networkDroppedPackets: {
    name: "Network Dropped Packets",
    url: "http://localhost:3000/d-solo/fek1pqf0eof0gf/outboound-traffic?orgId=1&from=1745623653879&to=1745645253879&timezone=browser&panelId=1&__feature.dashboardSceneSolo",
  },
  kernelload: {
    name: "Kernel Load & Performance",
    url: "http://localhost:3000/d-solo/aek1sws4xrh1cd/disk?orgId=1&from=1745625790673&to=1745647390673&timezone=browser&refresh=5s&panelId=1&__feature.dashboardSceneSolo",
  },
  toptalkers: {
    name: "Top Talkers",
    url: "http://localhost:3000/d-solo/39ff070c-543c-4f8d-8961-c97ec79a89b7/top-talkers?orgId=1&from=1747365321112&to=1747386921112&timezone=browser&panelId=1&__feature.dashboardSceneSolo",
  },
  // Add more metrics as needed
}};

const MetricCard = () => {
  const { metricKey } = useParams(); 
  const metric = metrics[metricKey]; 

  if (!metric) {
    return <div>Metric not found</div>; 
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "30px", padding: "20px" }}>
      <CCard
        style={{
          width: "100%",
          maxWidth: "1800px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          borderRadius: "10px",
          backgroundColor: "#f8f9fa",
        }}
      >
        <CCardHeader
          style={{
            backgroundColor: "#343a40",
            color: "#fff",
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          {metric.name}
        </CCardHeader>
        <CCardBody style={{ padding: "10px" }}>
          <iframe
            src={metric.url}
            width="100%"
            height="700px"
            frameBorder="0"
            style={{ border: "none", borderRadius: "5px" }}
            title={metric.name}
          ></iframe>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default MetricCard;