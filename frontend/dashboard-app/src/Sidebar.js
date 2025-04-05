import React from 'react';
import { Link } from 'react-router-dom';
import {
  CSidebar,
  CSidebarBrand,
  CSidebarHeader,
  CSidebarNav,
  CSidebarToggler,
  CNavGroup,
  CNavItem,
  CNavTitle,
} from '@coreui/react';

import CIcon from '@coreui/icons-react';
import '@coreui/coreui/dist/css/coreui.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const Sidebar = () => {
  return (
    <CSidebar className="border-end" colorScheme="dark">
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand className="sidebar-brand">eBPF-Dashboard</CSidebarBrand>
      </CSidebarHeader>

      <CSidebarNav>
        <CNavTitle>Key Dashboards</CNavTitle>
        <CNavItem>
          <Link to="/" className="nav-link">
            <CIcon customClassName="nav-icon" /> Home
          </Link>
        </CNavItem>
        <CNavItem>
          <Link to="/cpu-usage" className="nav-link">
            <CIcon customClassName="nav-icon" /> CPU Usage
          </Link>
        </CNavItem>
        <CNavItem>
          <Link to="/traffic" className="nav-link">
            <CIcon customClassName="nav-icon" /> Traffic
          </Link>
        </CNavItem>

        <CNavTitle>Centralized View</CNavTitle>
        <CNavGroup
          toggler={
            <>
              <CIcon customClassName="nav-icon" /> Systems
            </>
          }
        >
          <CNavItem>
            <Link to="/cpu-usage" className="nav-link">
              <span className="nav-icon"></span>
              CPU Usage
            </Link>
          </CNavItem>
          <CNavItem>
            <Link to="/memory-usage" className="nav-link">
              <span className="nav-icon"></span>
              Memory Usage
            </Link>
          </CNavItem>
        </CNavGroup>

        <CNavTitle>Visualization</CNavTitle>
        <CNavGroup
          toggler={
            <>
              <CIcon customClassName="nav-icon" /> Charts
            </>
          }
        >
          <CNavItem>
            <span className="nav-icon"></span>
            TimeSeries
          </CNavItem>
          <CNavItem>
            <span className="nav-icon"></span>
            Gauge
          </CNavItem>
        </CNavGroup>

        <CNavItem href="https://coreui.io">
          <CIcon customClassName="nav-icon" /> Alerts
        </CNavItem>

        <CNavTitle>Log Activities</CNavTitle>
        <CNavItem href="https://coreui.io">
          <CIcon customClassName="nav-icon" /> SignIn
        </CNavItem>
        <CNavItem href="https://coreui.io/pro/">
          <CIcon customClassName="nav-icon" /> SignUp
        </CNavItem>
      </CSidebarNav>

      <CSidebarHeader className="border-top">
        <CSidebarToggler />
      </CSidebarHeader>
    </CSidebar>
  );
};

export default Sidebar;