import React, { useState, useEffect } from 'react';
import {
  CButton,
  CCard,
  CCardBody,
  CCardFooter,
  CCardHeader,
  CCardTitle,
  CCardText,
  CProgress,
  CProgressBar,
} from '@coreui/react';
import TrafficGraph from './TrafficGraph.js';

const Traffic = () => {
  // Progress state for each metric
  const [progress, setProgress] = useState({
    httpRequests: 0,
    bandwidthUsage: 0,
    activeConnections: 0,
    errors: 0,
    avgResponseTime: 0,
  });

  // Simulate progress change for each metric (you can update this with real data)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => ({
        httpRequests: Math.min(prevProgress.httpRequests + 5, 100),
        bandwidthUsage: Math.min(prevProgress.bandwidthUsage + 4, 100),
        activeConnections: Math.min(prevProgress.activeConnections + 3, 100),
        errors: Math.min(prevProgress.errors + 2, 100),
        avgResponseTime: Math.min(prevProgress.avgResponseTime + 3, 100),
      }));
    }, 1000); // Update progress every 1 second

    return () => clearInterval(interval); // Cleanup the interval on unmount
  }, []);

  return (
    <CCard className="text-center custom-card">
      <CCardHeader>Traffic Overview</CCardHeader>
      <CCardBody>
        <CCardTitle>Traffic Data</CCardTitle>
        <CCardText>
          <div className="chart">
            <TrafficGraph />
          </div>
        </CCardText>
        <CButton color="primary" href="#">
          Take Action
        </CButton>
      </CCardBody>
      <CCardFooter className="text-body-secondary custom-card-footer">
        <div className="metrics-container">
          <div className="metric">
            <strong>HTTP Requests</strong>
            <div className="metric-value">{progress.httpRequests * 12}</div> {/* Value based on progress */}
            <CProgress className="metric-progress">
              <CProgressBar color="primary" value={progress.httpRequests} />
            </CProgress>
          </div>
          <div className="metric">
            <strong>Bandwidth Usage</strong>
            <div className="metric-value">{progress.bandwidthUsage * 1}GB</div> {/* Value based on progress */}
            <CProgress className="metric-progress">
              <CProgressBar color="warning" value={progress.bandwidthUsage} />
            </CProgress>
          </div>
          <div className="metric">
            <strong>Active Connections</strong>
            <div className="metric-value">{progress.activeConnections}</div> {/* Value based on progress */}
            <CProgress className="metric-progress">
              <CProgressBar color="info" value={progress.activeConnections} />
            </CProgress>
          </div>
          <div className="metric">
            <strong>Errors</strong>
            <div className="metric-value">{progress.errors}</div> {/* Value based on progress */}
            <CProgress className="metric-progress">
              <CProgressBar color="danger" value={progress.errors} />
            </CProgress>
          </div>
          <div className="metric">
            <strong>Average Response Time</strong>
            <div className="metric-value">{progress.avgResponseTime * 2}ms</div> {/* Value based on progress */}
            <CProgress className="metric-progress">
              <CProgressBar color="success" value={progress.avgResponseTime} />
            </CProgress>
          </div>
        </div>
      </CCardFooter>
    </CCard>
  );
};

export default Traffic;
