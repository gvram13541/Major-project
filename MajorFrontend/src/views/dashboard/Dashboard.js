import React, { useState, useEffect } from 'react'
import classNames from 'classnames'
import { Link } from 'react-router-dom'

import {
  CButton,
  CCard,
  CCardBody,
  CCardFooter,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload } from '@coreui/icons'

import WidgetsDropdown from '../widgets/WidgetsDropdown'
import MainChart from './MainChart'

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    outboundTraffic: 0,
    bandwidthUsage: 0,
    cpuUtilization: 0,
    memoryUsage: 0,
    latency: 0,
  })

  const [systemsData, setSystemsData] = useState([]) // State to store systems data

  // Fetch metrics from the provided data format
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('http://localhost:8000/dashboard-metrics') // Updated endpoint
        const data = await response.json()
        console.log('Fetched dashboard metrics:', data) // Debugging log
  
        setMetrics({
          outboundTraffic: data.outboundTraffic || 0,
          bandwidthUsage: data.bandwidthUsage || 0,
          cpuUtilization: data.cpuUtilization || 0,
          memoryUsage: data.memoryUsage || 0,
          latency: data.latency || 0,
        })
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error)
      }
    }
  
    fetchMetrics()
  
    // Poll the metrics every 5 seconds
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  // // Fetch systems data from /applications endpoint
  // useEffect(() => {
  //   const fetchSystemsData = async () => {
  //     try {
  //       const response = await fetch('http://localhost:8000/applications') // Replace with your backend URL
  //       const data = await response.json()
  //       setSystemsData(data) // Update state with fetched data
  //     } catch (error) {
  //       console.error('Error fetching systems data:', error)
  //     }
  //   }

  //   fetchSystemsData()

  //   // Poll the systems data every 10 seconds
  //   const interval = setInterval(fetchSystemsData, 10000)
  //   return () => clearInterval(interval)
  // }, [])

    // Fetch systems data from /systems-monitoring endpoint
    useEffect(() => {
      const fetchSystemsData = async () => {
        try {
          const response = await fetch('http://localhost:8000/systems-monitoring') // Replace with your backend URL
          const data = await response.json()
          setSystemsData(data) // Update state with fetched data
        } catch (error) {
          console.error('Error fetching systems data:', error)
        }
      }
  
      fetchSystemsData()
  
      // Poll the systems data every 10 seconds
      const interval = setInterval(fetchSystemsData, 10000)
      return () => clearInterval(interval)
    }, [])

  const progressExample = [
    { title: 'OutBound Traffic', value: `${metrics.outboundTraffic}`, percent: metrics.outboundTraffic, color: 'success' },
    { title: 'Bandwidth Usage (%)', value: `${metrics.bandwidthUsage}%`, percent: metrics.bandwidthUsage, color: 'danger' },
    { title: 'CPU Utilization (%)', value: `${metrics.cpuUtilization}%`, percent: metrics.cpuUtilization, color: 'info' },
    { title: 'Memory Usage (%)', value: `${metrics.memoryUsage}%`, percent: metrics.memoryUsage, color: 'warning' },
    { title: 'Latency (ms)', value: `${metrics.latency} ms`, percent: metrics.latency, color: 'primary' },
  ]

  return (
    <>
      <WidgetsDropdown className="mb-4" />
      <CCard className="mb-4">
        <CCardBody>
          <CRow>
            <CCol sm={5}>
              <h4 id="traffic" className="card-title mb-0">
                Network Traffic
              </h4>
              <div className="small text-body-secondary">Real-Time Metrics</div>
            </CCol>
            <CCol sm={7} className="d-none d-md-block">
              <CButton color="primary" className="float-end">
                <CIcon icon={cilCloudDownload} />
              </CButton>
            </CCol>
          </CRow>
          <MainChart />
        </CCardBody>
        <CCardFooter>
          <CRow
            xs={{ cols: 1, gutter: 4 }}
            sm={{ cols: 2 }}
            lg={{ cols: 4 }}
            xl={{ cols: 5 }}
            className="mb-2 text-center"
          >
            {progressExample.map((item, index, items) => (
              <CCol
                className={classNames({
                  'd-none d-xl-block': index + 1 === items.length,
                })}
                key={index}
              >
                <div className="text-body-secondary">{item.title}</div>
                <div className="fw-semibold text-truncate">
                  {item.value}
                </div>
                <CProgress thin className="mt-2" color={item.color} value={item.percent} />
              </CCol>
            ))}
          </CRow>
        </CCardFooter>
      </CCard>
      <CRow>
        <CCol xs>
          <CCard className="mb-4">
            <CCardHeader>System Monitoring</CCardHeader>
            <CCardBody>
              <CTable align="middle" className="mb-0 border" hover responsive>
                <CTableHead className="text-nowrap">
                  <CTableRow>
                    <CTableHeaderCell className="bg-body-tertiary text-center">System ID</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Applications in Use</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary text-center">CPU Usage (%)</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary text-center">Memory Usage (%)</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary text-center">Network Throughput (Mbps)</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary text-center">Packet Drop Rate (%)</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary text-center">Active Connections</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                {systemsData.map((system, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell className="text-center">
                        <Link to={`/system/${system.systemId}`} style={{ textDecoration: 'none', color: 'blue' }}>
                          {system.systemId}
                        </Link>
                      </CTableDataCell>
                      <CTableDataCell>
                        {system.applications.map((app, appIndex) => (
                          <div key={appIndex}>{app}</div>
                        ))}
                      </CTableDataCell>
                      <CTableDataCell className="text-center">{system.cpuUsage}%</CTableDataCell>
                      <CTableDataCell className="text-center">{system.memoryUsage.toFixed(2)}%</CTableDataCell>
                      <CTableDataCell className="text-center">{system.networkThroughput} Mbps</CTableDataCell>
                      <CTableDataCell className="text-center">{system.packetDropRate.toFixed(2)}%</CTableDataCell>
                      <CTableDataCell className="text-center">{system.activeConnections}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard






// import React, { useState, useEffect } from 'react'
// import classNames from 'classnames'
// import { Link } from 'react-router-dom'

// import {
//   CButton,
//   CCard,
//   CCardBody,
//   CCardFooter,
//   CCardHeader,
//   CCol,
//   CProgress,
//   CRow,
//   CTable,
//   CTableBody,
//   CTableDataCell,
//   CTableHead,
//   CTableHeaderCell,
//   CTableRow,
// } from '@coreui/react'
// import CIcon from '@coreui/icons-react'
// import {
//   cilCloudDownload,
// } from '@coreui/icons'

// import WidgetsDropdown from '../widgets/WidgetsDropdown'
// import MainChart from './MainChart'

// const Dashboard = () => {
//   const [metrics, setMetrics] = useState({
//     packetRate: 0,
//     droppedPackets: 0,
//     cpuUtilization: 0,
//     memoryUsage: 0,
//     latency: 0,
//   })

//   const [systemsData, setSystemsData] = useState([]) // State to store systems data

//   // Fetch metrics from /metrics endpoint
//   useEffect(() => {
//     const fetchMetrics = async () => {
//       try {
//         const response = await fetch('http://localhost:8000/metrics') // Replace with your API endpoint
//         const text = await response.text()

//         // Parse the metrics data
//         const cpuUsageMatch = text.match(/cpu_usage\s+([\d.]+)/)
//         const memoryUsageMatch = text.match(/memory_usage\s+([\d.]+)/)
//         const packetRateMatch = text.match(/packet_rate\s+([\d.]+)/)
//         const droppedPacketsMatch = text.match(/dropped_packets\s+([\d.]+)/)
//         const latencyMatch = text.match(/latency\s+([\d.]+)/)

//         setMetrics({
//           cpuUtilization: cpuUsageMatch ? parseFloat(cpuUsageMatch[1]).toFixed(2) : 0,
//           memoryUsage: memoryUsageMatch ? parseFloat(memoryUsageMatch[1]).toFixed(2) : 0,
//           packetRate: packetRateMatch ? parseFloat(packetRateMatch[1]).toFixed(2) : 0,
//           droppedPackets: droppedPacketsMatch ? parseFloat(droppedPacketsMatch[1]).toFixed(2) : 0,
//           latency: latencyMatch ? parseFloat(latencyMatch[1]).toFixed(2) : 0,
//         })
//       } catch (error) {
//         console.error('Error fetching metrics:', error)
//       }
//     }

//     fetchMetrics()

//     // Poll the metrics every 5 seconds
//     const interval = setInterval(fetchMetrics, 5000)
//     return () => clearInterval(interval)
//   }, [])

//   // Fetch systems data from /applications endpoint
//   useEffect(() => {
//     const fetchSystemsData = async () => {
//       try {
//         const response = await fetch('http://localhost:8000/applications') // Replace with your backend URL
//         const data = await response.json()
//         setSystemsData(data) // Update state with fetched data
//       } catch (error) {
//         console.error('Error fetching systems data:', error)
//       }
//     }

//     fetchSystemsData()

//     // Poll the systems data every 10 seconds
//     const interval = setInterval(fetchSystemsData, 10000)
//     return () => clearInterval(interval)
//   }, [])

//   const progressExample = [
//     { title: 'Packet Rate (pps)', value: `${metrics.packetRate} pps`, percent: metrics.packetRate, color: 'success' },
//     { title: 'Dropped Packets (%)', value: `${metrics.droppedPackets}%`, percent: metrics.droppedPackets, color: 'danger' },
//     { title: 'CPU Utilization (%)', value: `${metrics.cpuUtilization}%`, percent: metrics.cpuUtilization, color: 'info' },
//     { title: 'Memory Usage (%)', value: `${metrics.memoryUsage}%`, percent: metrics.memoryUsage, color: 'warning' },
//     { title: 'Latency (ms)', value: `${metrics.latency} ms`, percent: metrics.latency, color: 'primary' },
//   ]

//   return (
//     <>
//       <WidgetsDropdown className="mb-4" />
//       <CCard className="mb-4">
//         <CCardBody>
//           <CRow>
//             <CCol sm={5}>
//               <h4 id="traffic" className="card-title mb-0">
//                 Network Traffic
//               </h4>
//               <div className="small text-body-secondary">Real-Time Metrics</div>
//             </CCol>
//             <CCol sm={7} className="d-none d-md-block">
//               <CButton color="primary" className="float-end">
//                 <CIcon icon={cilCloudDownload} />
//               </CButton>
//             </CCol>
//           </CRow>
//           <MainChart />
//         </CCardBody>
//         <CCardFooter>
//           <CRow
//             xs={{ cols: 1, gutter: 4 }}
//             sm={{ cols: 2 }}
//             lg={{ cols: 4 }}
//             xl={{ cols: 5 }}
//             className="mb-2 text-center"
//           >
//             {progressExample.map((item, index, items) => (
//               <CCol
//                 className={classNames({
//                   'd-none d-xl-block': index + 1 === items.length,
//                 })}
//                 key={index}
//               >
//                 <div className="text-body-secondary">{item.title}</div>
//                 <div className="fw-semibold text-truncate">
//                   {item.value}
//                 </div>
//                 <CProgress thin className="mt-2" color={item.color} value={item.percent} />
//               </CCol>
//             ))}
//           </CRow>
//         </CCardFooter>
//       </CCard>
//       <CRow>
//         <CCol xs>
//           <CCard className="mb-4">
//             <CCardHeader>System Monitoring</CCardHeader>
//             <CCardBody>
//               <CTable align="middle" className="mb-0 border" hover responsive>
//                 <CTableHead className="text-nowrap">
//                   <CTableRow>
//                     <CTableHeaderCell className="bg-body-tertiary text-center">System ID</CTableHeaderCell>
//                     <CTableHeaderCell className="bg-body-tertiary">Applications in Use</CTableHeaderCell>
//                     <CTableHeaderCell className="bg-body-tertiary text-center">CPU Usage (%)</CTableHeaderCell>
//                     <CTableHeaderCell className="bg-body-tertiary text-center">Memory Usage (%)</CTableHeaderCell>
//                     <CTableHeaderCell className="bg-body-tertiary text-center">Network Throughput (Mbps)</CTableHeaderCell>
//                     <CTableHeaderCell className="bg-body-tertiary text-center">Packet Drop Rate (%)</CTableHeaderCell>
//                     <CTableHeaderCell className="bg-body-tertiary text-center">Active Connections</CTableHeaderCell>
//                   </CTableRow>
//                 </CTableHead>
//                 <CTableBody>
//                   {systemsData.map((system, index) => (
//                     <CTableRow key={index}>
//                       <CTableDataCell className="text-center">
//                         <Link to={`/system/${system.systemId}`} style={{ textDecoration: 'none', color: 'blue' }}>
//                           {system.systemId}
//                         </Link>
//                       </CTableDataCell>
//                       <CTableDataCell>
//                         {system.applications.map((app, appIndex) => (
//                           <div key={appIndex}>{app}</div>
//                         ))}
//                       </CTableDataCell>
//                       <CTableDataCell className="text-center">{system.cpuUsage}%</CTableDataCell>
//                       <CTableDataCell className="text-center">{system.memoryUsage}%</CTableDataCell>
//                       <CTableDataCell className="text-center">{system.networkThroughput} Mbps</CTableDataCell>
//                       <CTableDataCell className="text-center">{system.packetDropRate.toFixed(2)}%</CTableDataCell>
//                       <CTableDataCell className="text-center">{system.activeConnections}</CTableDataCell>
//                     </CTableRow>
//                   ))}
//                 </CTableBody>
//               </CTable>
//             </CCardBody>
//           </CCard>
//         </CCol>
//       </CRow>
//     </>
//   )
// }

// export default Dashboard

















// import React, {useState, useEffect} from 'react'
// import classNames from 'classnames'

// import {
//   CAvatar,
//   CButton,
//   CButtonGroup,
//   CCard,
//   CCardBody,
//   CCardFooter,
//   CCardHeader,
//   CCol,
//   CProgress,
//   CRow,
//   CTable,
//   CTableBody,
//   CTableDataCell,
//   CTableHead,
//   CTableHeaderCell,
//   CTableRow,
// } from '@coreui/react'
// import CIcon from '@coreui/icons-react'
// import {
//   cibCcAmex,
//   cibCcApplePay,
//   cibCcMastercard,
//   cibCcPaypal,
//   cibCcStripe,
//   cibCcVisa,
//   cibGoogle,
//   cibFacebook,
//   cibLinkedin,
//   cifBr,
//   cifEs,
//   cifFr,
//   cifIn,
//   cifPl,
//   cifUs,
//   cibTwitter,
//   cilCloudDownload,
//   cilPeople,
//   cilUser,
//   cilUserFemale,
// } from '@coreui/icons'

// import avatar1 from 'src/assets/images/avatars/1.jpg'
// import avatar2 from 'src/assets/images/avatars/2.jpg'
// import avatar3 from 'src/assets/images/avatars/3.jpg'
// import avatar4 from 'src/assets/images/avatars/4.jpg'
// import avatar5 from 'src/assets/images/avatars/5.jpg'
// import avatar6 from 'src/assets/images/avatars/6.jpg'

// import WidgetsBrand from '../widgets/WidgetsBrand'
// import WidgetsDropdown from '../widgets/WidgetsDropdown'
// import MainChart from './MainChart'

// const Dashboard = () => {
//   const [metrics, setMetrics] = useState({
//     packetRate: 0,
//     droppedPackets: 0,
//     cpuUtilization: 0,
//     memoryUsage: 0,
//     latency: 0,
//   })

//   const [systemsData, setSystemsData] = useState([]) // State to store systems data

//   useEffect(() => {
//     const fetchMetrics = async () => {
//       try {
//         const response = await fetch('http://localhost:8000/metrics') // Replace with your API endpoint
//         const text = await response.text()
  
//         // Parse the metrics data
//         const cpuUsageMatch = text.match(/cpu_usage\s+([\d.]+)/)
//         const memoryUsageMatch = text.match(/memory_usage\s+([\d.]+)/)
//         const packetRateMatch = text.match(/packet_rate\s+([\d.]+)/)
//         const droppedPacketsMatch = text.match(/dropped_packets\s+([\d.]+)/)
//         const latencyMatch = text.match(/latency\s+([\d.]+)/)
  
//         setMetrics({
//           cpuUtilization: cpuUsageMatch ? parseFloat(cpuUsageMatch[1]).toFixed(2) : 0,
//           memoryUsage: memoryUsageMatch ? parseFloat(memoryUsageMatch[1]).toFixed(2) : 0,
//           packetRate: packetRateMatch ? parseFloat(packetRateMatch[1]).toFixed(2) : 0,
//           droppedPackets: droppedPacketsMatch ? parseFloat(droppedPacketsMatch[1]).toFixed(2) : 0,
//           latency: latencyMatch ? parseFloat(latencyMatch[1]).toFixed(2) : 0,
//         })
//       } catch (error) {
//         console.error('Error fetching metrics:', error)
//       }
//     }
  
//     fetchMetrics()
  
//     // Poll the metrics every 5 seconds
//     const interval = setInterval(fetchMetrics, 5000)
//     return () => clearInterval(interval)
//   }, [])

//   const tableExample = [
//     {
//       avatar: { src: avatar1, status: 'success' },
//       user: {
//         name: 'Yiorgos Avraamu',
//         new: true,
//         registered: 'Jan 1, 2023',
//       },
//       country: { name: 'USA', flag: cifUs },
//       usage: {
//         value: 50,
//         period: 'Jun 11, 2023 - Jul 10, 2023',
//         color: 'success',
//       },
//       payment: { name: 'Mastercard', icon: cibCcMastercard },
//       activity: '10 sec ago',
//     },
//     {
//       avatar: { src: avatar2, status: 'danger' },
//       user: {
//         name: 'Avram Tarasios',
//         new: false,
//         registered: 'Jan 1, 2023',
//       },
//       country: { name: 'Brazil', flag: cifBr },
//       usage: {
//         value: 22,
//         period: 'Jun 11, 2023 - Jul 10, 2023',
//         color: 'info',
//       },
//       payment: { name: 'Visa', icon: cibCcVisa },
//       activity: '5 minutes ago',
//     },
//     {
//       avatar: { src: avatar3, status: 'warning' },
//       user: { name: 'Quintin Ed', new: true, registered: 'Jan 1, 2023' },
//       country: { name: 'India', flag: cifIn },
//       usage: {
//         value: 74,
//         period: 'Jun 11, 2023 - Jul 10, 2023',
//         color: 'warning',
//       },
//       payment: { name: 'Stripe', icon: cibCcStripe },
//       activity: '1 hour ago',
//     },
//     {
//       avatar: { src: avatar4, status: 'secondary' },
//       user: { name: 'Enéas Kwadwo', new: true, registered: 'Jan 1, 2023' },
//       country: { name: 'France', flag: cifFr },
//       usage: {
//         value: 98,
//         period: 'Jun 11, 2023 - Jul 10, 2023',
//         color: 'danger',
//       },
//       payment: { name: 'PayPal', icon: cibCcPaypal },
//       activity: 'Last month',
//     },
//     {
//       avatar: { src: avatar5, status: 'success' },
//       user: {
//         name: 'Agapetus Tadeáš',
//         new: true,
//         registered: 'Jan 1, 2023',
//       },
//       country: { name: 'Spain', flag: cifEs },
//       usage: {
//         value: 22,
//         period: 'Jun 11, 2023 - Jul 10, 2023',
//         color: 'primary',
//       },
//       payment: { name: 'Google Wallet', icon: cibCcApplePay },
//       activity: 'Last week',
//     },
//     {
//       avatar: { src: avatar6, status: 'danger' },
//       user: {
//         name: 'Friderik Dávid',
//         new: true,
//         registered: 'Jan 1, 2023',
//       },
//       country: { name: 'Poland', flag: cifPl },
//       usage: {
//         value: 43,
//         period: 'Jun 11, 2023 - Jul 10, 2023',
//         color: 'success',
//       },
//       payment: { name: 'Amex', icon: cibCcAmex },
//       activity: 'Last week',
//     },
//   ]

//   const progressExample = [
//     { title: 'Packet Rate (pps)', value: `${metrics.packetRate} pps`, percent: metrics.packetRate, color: 'success' },
//     { title: 'Dropped Packets (%)', value: `${metrics.droppedPackets}%`, percent: metrics.droppedPackets, color: 'danger' },
//     { title: 'CPU Utilization (%)', value: `${metrics.cpuUtilization}%`, percent: metrics.cpuUtilization, color: 'info' },
//     { title: 'Memory Usage (%)', value: `${metrics.memoryUsage}%`, percent: metrics.memoryUsage, color: 'warning' },
//     { title: 'Latency (ms)', value: `${metrics.latency} ms`, percent: metrics.latency, color: 'primary' },
//   ]

//   return (
//     <>
//       <WidgetsDropdown className="mb-4" />
//       <CCard className="mb-4">
//         <CCardBody>
//           <CRow>
//             <CCol sm={5}>
//               <h4 id="traffic" className="card-title mb-0">
//                 Network Traffic
//               </h4>
//               <div className="small text-body-secondary">Real-Time Metrics</div>
//             </CCol>
//             <CCol sm={7} className="d-none d-md-block">
//               <CButton color="primary" className="float-end">
//                 <CIcon icon={cilCloudDownload} />
//               </CButton>
//             </CCol>
//           </CRow>
//           <MainChart />
//         </CCardBody>
//         <CCardFooter>
//           <CRow
//             xs={{ cols: 1, gutter: 4 }}
//             sm={{ cols: 2 }}
//             lg={{ cols: 4 }}
//             xl={{ cols: 5 }}
//             className="mb-2 text-center"
//           >
//             {progressExample.map((item, index, items) => (
//               <CCol
//                 className={classNames({
//                   'd-none d-xl-block': index + 1 === items.length,
//                 })}
//                 key={index}
//               >
//                 <div className="text-body-secondary">{item.title}</div>
//                 <div className="fw-semibold text-truncate">
//                   {item.value}
//                 </div>
//                 <CProgress thin className="mt-2" color={item.color} value={item.percent} />
//               </CCol>
//             ))}
//           </CRow>
//         </CCardFooter>
//       </CCard>
//       <CRow>
//         <CCol xs>
//           <CCard className="mb-4">
//             <CCardHeader>System Monitoring</CCardHeader>
//             <CCardBody>
//               <CTable align="middle" className="mb-0 border" hover responsive>
//                 <CTableHead className="text-nowrap">
//                   <CTableRow>
//                     <CTableHeaderCell className="bg-body-tertiary text-center">System ID</CTableHeaderCell>
//                     <CTableHeaderCell className="bg-body-tertiary">Applications in Use</CTableHeaderCell>
//                     <CTableHeaderCell className="bg-body-tertiary text-center">CPU Usage (%)</CTableHeaderCell>
//                     <CTableHeaderCell className="bg-body-tertiary text-center">Memory Usage (%)</CTableHeaderCell>
//                     <CTableHeaderCell className="bg-body-tertiary text-center">Network Throughput (Mbps)</CTableHeaderCell>
//                     <CTableHeaderCell className="bg-body-tertiary text-center">Packet Drop Rate (%)</CTableHeaderCell>
//                     <CTableHeaderCell className="bg-body-tertiary text-center">Active Connections</CTableHeaderCell>
//                   </CTableRow>
//                 </CTableHead>
//                 <CTableBody>
//                   {tableExample.map((item, index) => (
//                     <CTableRow key={index}>
//                       <CTableDataCell className="text-center">{`System-${index + 1}`}</CTableDataCell>
//                       <CTableDataCell>
//                         <div>{item.user.name}</div>
//                         <div className="small text-body-secondary text-nowrap">
//                           <span>{item.user.new ? 'New' : 'Recurring'}</span> | Registered: {item.user.registered}
//                         </div>
//                       </CTableDataCell>
//                       <CTableDataCell className="text-center">{metrics.cpuUtilization}%</CTableDataCell>
//                       <CTableDataCell className="text-center">{metrics.memoryUsage}%</CTableDataCell>
//                       <CTableDataCell className="text-center">{metrics.packetRate} Mbps</CTableDataCell>
//                       <CTableDataCell className="text-center">{metrics.droppedPackets}%</CTableDataCell>
//                       <CTableDataCell className="text-center">{Math.floor(Math.random() * 100)}</CTableDataCell>
//                     </CTableRow>
//                   ))}
//                 </CTableBody>
//               </CTable>
//             </CCardBody>
//           </CCard>
//         </CCol>
//       </CRow>
//     </>
//   )
// }

// export default Dashboard
