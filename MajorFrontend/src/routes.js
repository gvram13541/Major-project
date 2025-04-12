import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))

const Charts = React.lazy(() => import('./views/charts/Charts'))

const Widgets = React.lazy(() => import('./views/widgets/Widgets'))

//Grafana
//const CpuUsage = React.lazy(() => import('./grafana/CpuUsage'))
const MetricCard = React.lazy(() => import('./grafana/MetricCard'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/charts', name: 'Charts', element: Charts },
  { path: '/widgets', name: 'Widgets', element: Widgets },
  // { path: '/grafana/CpuUsage.js', name: 'CPU Usage', element: CpuUsage },
  { path: '/grafana/MetricCard/:metricKey', name: 'Metric Card', element: MetricCard },
]

export default routes
