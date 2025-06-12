import React, { useEffect, useState } from "react";

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  // Try to parse ISO or fallback to original
  const date = new Date(timestamp);
  if (!isNaN(date.getTime())) {
    return date.toLocaleString();
  }
  return timestamp;
};

const Notifications = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/alerts")
      .then((res) => res.json())
      .then(setAlerts);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Notifications</h2>
      {alerts.length === 0 ? (
        <p>No notifications.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 8 }}>Agent ID</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 8 }}>Time</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 8 }}>Type</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 8 }}>Message</th>
            </tr>
          </thead>
          <tbody>
            {alerts
              .slice()
              .reverse()
              .map((alert, idx) => (
                <tr key={idx}>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{alert.agent_id}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{formatTime(alert.timestamp)}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{alert.alert_type}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{alert.message}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Notifications;