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
    to: '/grafana/MetricCard/dashboard',
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
    to: '/grafana/MetricCard/packetRate',
  },
  {
    component: CNavItem,
    name: 'Bandwidth Usage (bps)',
    to: '/grafana/MetricCard/bandwith',
  },
  {
    component: CNavItem,
    name: 'Protocol Distribution',
    to: '/grafana/MetricCard/protocoldistribution',
  },
  {
    component: CNavItem,
    name: 'Flow Duration & Size',
    to: '/grafana/MetricCard/latency',
  },
  {
    component: CNavItem,
    name: 'Top Talkers',
    to: '/grafana/MetricCard/toptalkers',
  },
  {
    component: CNavTitle,
    name: 'Security & Threat Detection Metrics',
  },
  {
    component: CNavItem,
    name: 'Dropped Packets Count',
    to: '/grafana/MetricCard/packetDropRate',
  },
  {
    component: CNavItem,
    name: 'DDoS Indicators',
    to: '/grafana/MetricCard/ddos-indicators',
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
    to: '/grafana/MetricCard/diskiolog',
  },
  {
    component: CNavItem,
    name: 'Kernel Load & Performance',
    to: '/grafana/MetricCard/kernelload',
  },
  {
    component: CNavTitle,
    name: 'Real-Time Monitoring & Observability',
  },
  {
    component: CNavItem,
    name: 'Latency per Flow',
    to: '/grafana/MetricCard/latency',
  },
  {
    component: CNavItem,
    name: 'Charts',
    to: '/charts',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
  },
]

export default _nav