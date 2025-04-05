import React from 'react'
import {
  CBadge,
  CSidebar,
  CSidebarBrand,
  CSidebarHeader,
  CSidebarNav,
  CSidebarToggler,
  CNavGroup,
  CNavItem,
  CNavTitle,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilLayers, cilPuzzle, cilSpeedometer } from '@coreui/icons'
import '@coreui/coreui/dist/css/coreui.min.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

const Sidebar = () => {
  return (
    <CSidebar className="border-end" colorScheme="dark">
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand className="sidebar-brand">eBPF-Dashboard</CSidebarBrand>
      </CSidebarHeader>
      
      <CSidebarNav>
        <CNavTitle>Key Dashboards</CNavTitle>
        <CNavItem href="#">
          <CIcon customClassName="nav-icon"  /> RTTA
        </CNavItem>
        <CNavItem href="#">
          <CIcon customClassName="nav-icon" /> CRE
        </CNavItem>
      
        <CNavTitle>Centralized View</CNavTitle>
        <CNavGroup
          toggler={
            <>
              <CIcon customClassName="nav-icon" /> Systems
            </>
          }
        >
          <CNavItem href="#">
            <span className="nav-icon">
              {/* <span className="nav-icon-bullet"></span> */}
            </span>
            CPU Usage
          </CNavItem>
          <CNavItem href="#">
            <span className="nav-icon">
              {/* <span className="nav-icon-bullet"></span> */}
            </span>
            Memory Usage
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
          <CNavItem href="#">
            <span className="nav-icon">
              {/* <span className="nav-icon-bullet"></span> */}
            </span>
            TimeSeries
          </CNavItem>
          <CNavItem href="#">
            <span className="nav-icon">
              {/* <span className="nav-icon-bullet"></span> */}
            </span>
            Gauge
          </CNavItem>
        </CNavGroup>

        <CNavItem href="https://coreui.io">
          <CIcon customClassName="nav-icon" /> Alerts
        </CNavItem>

        <CNavTitle>Log Acitvities</CNavTitle>
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
  )
}

export default Sidebar;