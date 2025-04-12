import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilChartPie,
  cilHome,
  cilArrowRight,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Home Page',
    to: '/dashboard',
    icon: <CIcon icon={cilHome} customClassName="nav-icon"/>,
    badge: {
      color: 'info',
      icon: cilArrowRight,
    },
    style: { paddingLeft: '50px'},
  },
  {
    component: CNavTitle,
    name: 'Network Traffic Metrics',
  },
  {
    component: CNavItem,
    name: 'Packet Rate (pps)',
    to: '/theme/colors',
  },
  {
    component: CNavItem,
    name: 'Bandwidth Usage (bps)',
    to: '/theme/typography',
  },
  {
    component: CNavItem,
    name: 'Protocol Distribution',
    to: '/theme/colors',
  },
  {
    component: CNavItem,
    name: 'Flow Duration & Size',
    to: '/theme/typography',
  },
  {
    component: CNavItem,
    name: 'Top Talkers & Connections',
    to: '/theme/typography',
  },
  {
    component: CNavTitle,
    name: 'Security & Threat Detection Metrics',
  },
  {
    component: CNavItem,
    name: 'Dropped Packets Count',
    to: '/theme/colors',
  },
  {
    component: CNavItem,
    name: 'Malicious Traffic Detection',
    to: '/theme/typography',
  },
  {
    component: CNavItem,
    name: 'Port Scanning Attempts',
    to: '/theme/colors',
  },
  {
    component: CNavItem,
    name: 'DDoS Indicators',
    to: '/theme/typography',
  },
  {
    component: CNavItem,
    name: 'Suspicious IPs & Anomalies',
    to: '/theme/typography',
  },
  {
    component: CNavTitle,
    name: 'Rule Enforcement & Policy Metrics',
  },
  {
    component: CNavItem,
    name: 'IPTable Rule Hit Count',
    to: '/theme/colors',
  },
  {
    component: CNavItem,
    name: 'Latency of Rule Processing',
    to: '/theme/typography',
  },
  {
    component: CNavItem,
    name: 'Rule Update Frequency',
    to: '/theme/colors',
  },
  {
    component: CNavItem,
    name: 'Centralized Rule Synchronization',
    to: '/theme/typography',
  },
  {
    component: CNavTitle,
    name: 'System Resource Utilization',
  },
  {
    component: CNavItem,
    name: 'CPU Usage',
    to: '/grafana/MetricCard/cpu',
  },
  {
    component: CNavItem,
    name: 'Memory Usage',
    to: '/grafana/MetricCard/memory',
  },
  {
    component: CNavItem,
    name: 'Disk I/O & Logs Storage',
    to: '/theme/colors',
  },
  {
    component: CNavItem,
    name: 'Kernel Load & Performance',
    to: '/theme/typography',
  },
  {
    component: CNavTitle,
    name: 'Real-Time Monitoring & Observability',
  },
  {
    component: CNavItem,
    name: 'Latency per Flow',
    to: '/theme/colors',
  },
  {
    component: CNavItem,
    name: 'Packet Drop Reasons',
    to: '/theme/typography',
  },
  {
    component: CNavItem,
    name: 'Geolocation of Traffic',
    to: '/theme/colors',
  },
  {
    component: CNavItem,
    name: 'Service Mesh & Application-Level Metrics',
    to: '/theme/typography',
  },
  {
    component: CNavItem,
    name: 'Charts',
    to: '/charts',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
  },
]

export default _nav
