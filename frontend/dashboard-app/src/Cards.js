import React from 'react';
import { Card, CardContent, CardMedia, Typography } from '@mui/material';
import './App.css';

const CardGroups = () => {
  return (
    <div>
      <div className="cards-container">
        {/* CPU Usage Card */}
        <Card className="card">
          {/* <CardMedia
            component="img"
            image="/Images/CPUUsage.webp"
            alt="CPU Usage"
            className="card-image"
          /> */}
          <CardContent className="card-overlay cpu-usage">
            <Typography variant="h5" className="card-title">
              CPU Usage
            </Typography>
            <Typography variant="body1" className="card-text">
              45% Usage
            </Typography>
          </CardContent>
        </Card>

        {/* Free Memory Card */}
        <Card className="card">
          {/* <CardMedia
            component="img"
            image="/Images/FreeMemory.jpg"
            alt="Free Memory"
            className="card-image"
          /> */}
          <CardContent className="card-overlay free-memory">
            <Typography variant="h5" className="card-title">
              Free Memory
            </Typography>
            <Typography variant="body1" className="card-text">
              8GB Free
            </Typography>
          </CardContent>
        </Card>

        {/* Bandwidth Usage Card */}
        <Card className="card">
          {/* <CardMedia
            component="img"
            image="/Images/BandwidthUsage.png"
            alt="Bandwidth Usage"
            className="card-image"
          /> */}
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