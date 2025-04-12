import React from "react";
import { CCard, CCardBody, CCardHeader } from "@coreui/react";
import { useParams } from "react-router-dom";

const metrics = {
  cpu: {
    name: "CPU Usage",
    url: "http://localhost:3000/d-solo/aeilsvv55n7r4e/cpu-usage?orgId=1&from=1744390877074&to=1744391177074&timezone=browser&refresh=10s&panelId=1&__feature.dashboardSceneSolo",
  },
  memory: {
    name: "Memory Usage",
    url: "http://localhost:3000/d-solo/beilz2t7mgr9cf/memory-usage?orgId=1&from=1744392133482&to=1744392433482&timezone=browser&refresh=10s&panelId=1&__feature.dashboardSceneSolo",
  },
//   packetRate: {
//     name: "Packet Rate",
//     url: "http://localhost:3000/d-solo/aeilsvv55n7r4e/packet-rate?orgId=1&from=1744390877074&to=1744391177074&timezone=browser&refresh=10s&panelId=3&__feature.dashboardSceneSolo",
//   },
//   droppedPackets: {
//     name: "Dropped Packets",
//     url: "http://localhost:3000/d-solo/aeilsvv55n7r4e/dropped-packets?orgId=1&from=1744390877074&to=1744391177074&timezone=browser&refresh=10s&panelId=4&__feature.dashboardSceneSolo",
//   },
//   latency: {
//     name: "Latency",
//     url: "http://localhost:3000/d-solo/aeilsvv55n7r4e/latency?orgId=1&from=1744390877074&to=1744391177074&timezone=browser&refresh=10s&panelId=5&__feature.dashboardSceneSolo",
//   },
};

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