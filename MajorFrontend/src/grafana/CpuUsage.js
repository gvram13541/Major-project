import React from "react";
import { CCard, CCardBody, CCardHeader } from "@coreui/react";

const CpuUsage = () => {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "30px", padding: "20px" }}>
      <CCard
        style={{
          width: "100%", // Increased width
          maxWidth: "1800px", // Increased max width
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", // Card shadow for better appearance
          borderRadius: "10px", // Rounded corners
          backgroundColor: "#f8f9fa", // Light background color
        }}
      >
        <CCardHeader
          style={{
            backgroundColor: "#343a40", // Dark header background
            color: "#fff", // White text
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          CPU Usage
        </CCardHeader>
        <CCardBody style={{ padding: "10px" }}>
          <iframe
            src="http://localhost:3000/d-solo/aeilsvv55n7r4e/cpu-usage?orgId=1&from=1744390877074&to=1744391177074&timezone=browser&refresh=10s&panelId=1&__feature.dashboardSceneSolo"
            width="100%"
            height="700px" // Adjusted height
            frameBorder="0"
            style={{ border: "none", borderRadius: "5px" }} // Rounded iframe corners
          ></iframe>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default CpuUsage;