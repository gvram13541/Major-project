import React, { useState } from 'react';
import './App.css';
import Sidebar from './Sidebar.js';
import Navbar from './Navbar.js';
import CardGroups from './Cards.js';
import Traffic from './Traffic.js';
import Breadcrumb from './Breadcrumb.js';

function App() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); // State to toggle sidebar

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <div className="App">
      <div className="content">
        {isSidebarVisible && <Sidebar />} 
        <div className="main-content">

          <Navbar toggleSidebar={toggleSidebar} />
          <hr className="navbar-divider" /> 
          <Breadcrumb />

          <div className="page-content">
            <CardGroups /> 
            <hr className="navbar-divider" /> 
            <Traffic />
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;