import React, { createContext, useContext, useEffect, useState } from "react";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [hasNew, setHasNew] = useState(false);

useEffect(() => {
  const ws = new WebSocket("ws://localhost:8000/ws");
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Accept both {event: "alert", ...} and {alert_type: ...}
      if (data.event === "alert" || data.alert_type) {
        setNotifications((prev) => [
          {
            ...data,
            timestamp: new Date().toLocaleString(),
          },
          ...prev,
        ]);
        setHasNew(true);
      }
    } catch (e) {
      // Ignore parse errors
    }
  };
  return () => ws.close();
}, []);

  const clearNew = () => setHasNew(false);

  return (
    <NotificationContext.Provider value={{ notifications, hasNew, clearNew }}>
      {children}
    </NotificationContext.Provider>
  );
};