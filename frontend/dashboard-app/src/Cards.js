import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, CardMedia } from '@mui/material';
import './App.css';

const CardGroups = () => {
  const [cpuUsage, setCpuUsage] = useState(null); // State to store CPU usage
  const [memoryUsage, setMemoryUsage] = useState(null); // State to store Memory usage

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('http://localhost:8000/metrics'); // Fetch metrics from backend
        const text = await response.text();

        // Extract CPU usage
        const cpuMatch = text.match(/cpu_usage\s+([\d.]+)/);
        if (cpuMatch) {
          setCpuUsage(parseFloat(cpuMatch[1]).toFixed(2)); // Set CPU usage with 2 decimal places
        }

        // Extract Memory usage
        const memoryMatch = text.match(/memory_usage\s+([\d.]+)/);
        if (memoryMatch) {
          setMemoryUsage(parseFloat(memoryMatch[1]).toFixed(2)); // Set Memory usage with 2 decimal places
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  return (
    <div>
      <div className="cards-container">
        {/* CPU Usage Card */}
        <Card className="card">
          <CardContent className="card-overlay cpu-usage">
            <Typography variant="h5" className="card-title">
              CPU Usage
            </Typography>
            <Typography variant="body1" className="card-text">
              {cpuUsage !== null ? `${cpuUsage}% Usage` : 'Loading...'}
            </Typography>
          </CardContent>
        </Card>

        {/* Memory Usage Card */}
        <Card className="card">
          <CardContent className="card-overlay free-memory">
            <Typography variant="h5" className="card-title">
              Memory Usage
            </Typography>
            <Typography variant="body1" className="card-text">
              {memoryUsage !== null ? `${memoryUsage} MB Used` : 'Loading...'}
            </Typography>
          </CardContent>
        </Card>

        {/* Bandwidth Usage Card */}
        <Card className="card">
          <CardContent className="card-overlay bandwidth-usage">
            <Typography variant="h5" className="card-title">
              Bandwidth Usage
            </Typography>
            <Typography variant="body1" className="card-text">
              60GB Used
            </Typography>
          </CardContent>
        </Card>

        {/* HTTP Requests Card */}
        <Card className="card">
          <CardMedia
            component="img"
            image="/Images/white.avif"
            alt="HTTP Requests"
            className="card-image"
          />
          <CardContent className="card-overlay http-requests">
            <Typography variant="h5" className="card-title">
              HTTP Requests
            </Typography>
            <Typography variant="body1" className="card-text">
              1200 Requests
            </Typography>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CardGroups;