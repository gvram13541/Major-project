// filepath: /home/Ubuntu/Desktop/Major-project/frontend/dashboard-app/src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Sidebar from './Sidebar.js';
import Navbar from './Navbar.js';
import CardGroups from './Cards.js';
import Traffic from './Traffic.js';
import Breadcrumb from './Breadcrumb.js';
import CPUUsage from './CPUUsage.js';
import MemoryUsage from './MemoryUsage.js'; // Import MemoryUsage component

function App() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <Router>
      <div className="App">
        <div className="content">
          {isSidebarVisible && <Sidebar />}
          <div className="main-content">
            <Navbar toggleSidebar={toggleSidebar} />
            <hr className="navbar-divider" />
            <Breadcrumb />

            <div className="page-content">
              <Routes>
                <Route path="/" element={<CardGroups />} /> {/* Default route */}
                <Route path="/cpu-usage" element={<CPUUsage />} /> {/* CPU Usage route */}
                <Route path="/memory-usage" element={<MemoryUsage />} /> {/* Memory Usage route */}
                <Route path="/traffic" element={<Traffic />} /> {/* Traffic route */}
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;