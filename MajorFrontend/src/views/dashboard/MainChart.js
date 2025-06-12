import React, { useEffect, useRef, useState } from 'react'
import { CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'

const MAX_POINTS = 20 // Show last 20 points

const MainChart = () => {
  const chartRef = useRef(null)
  const [dataPoints, setDataPoints] = useState([])

  useEffect(() => {
    // Poll metrics every 5 seconds
    const fetchMetrics = async () => {
      try {
        const response = await fetch('http://localhost:8000/dashboard-metrics')
        const data = await response.json()
        setDataPoints(prev => {
          const now = new Date()
          const timeLabel = now.toLocaleTimeString()
          const newPoint = {
            time: timeLabel,
            cpu: data.cpuUtilization || 0,
            memory: data.memoryUsage || 0,
            bandwidth: data.bandwidthUsage || 0,
            outbound: data.outboundTraffic || 0,
            latency: data.latency || 0,
          }
          const arr = [...prev, newPoint]
          return arr.length > MAX_POINTS ? arr.slice(arr.length - MAX_POINTS) : arr
        })
      } catch (e) {
        // Optionally handle error
      }
    }
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  // Update chart colors on theme change
  useEffect(() => {
    document.documentElement.addEventListener('ColorSchemeChange', () => {
      if (chartRef.current) {
        setTimeout(() => {
          chartRef.current.options.scales.x.grid.borderColor = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.x.grid.color = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.x.ticks.color = getStyle('--cui-body-color')
          chartRef.current.options.scales.y.grid.borderColor = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.y.grid.color = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.y.ticks.color = getStyle('--cui-body-color')
          chartRef.current.update()
        })
      }
    })
  }, [chartRef])

  const labels = dataPoints.map((pt, idx) => `${idx * 5}s`) // X-axis: time in seconds
  // Or use: const labels = dataPoints.map(pt => pt.time) for actual time labels

  return (
    <CChartLine
      ref={chartRef}
      style={{ height: '300px', marginTop: '40px' }}
      data={{
        labels,
        datasets: [
          {
            label: 'CPU Utilization (%)',
            backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
            borderColor: getStyle('--cui-info'),
            pointHoverBackgroundColor: getStyle('--cui-info'),
            borderWidth: 2,
            data: dataPoints.map(pt => pt.cpu),
            fill: true,
          },
          {
            label: 'Memory Usage (%)',
            backgroundColor: 'transparent',
            borderColor: getStyle('--cui-success'),
            pointHoverBackgroundColor: getStyle('--cui-success'),
            borderWidth: 2,
            data: dataPoints.map(pt => pt.memory),
          },
          {
            label: 'Bandwidth Usage (%)',
            backgroundColor: 'transparent',
            borderColor: getStyle('--cui-danger'),
            pointHoverBackgroundColor: getStyle('--cui-danger'),
            borderWidth: 2,
            data: dataPoints.map(pt => pt.bandwidth),
          },
          {
            label: 'Outbound Traffic',
            backgroundColor: 'transparent',
            borderColor: getStyle('--cui-warning'),
            pointHoverBackgroundColor: getStyle('--cui-warning'),
            borderWidth: 2,
            data: dataPoints.map(pt => pt.outbound),
          },
          {
            label: 'Latency (ms)',
            backgroundColor: 'transparent',
            borderColor: getStyle('--cui-primary'),
            pointHoverBackgroundColor: getStyle('--cui-primary'),
            borderWidth: 2,
            data: dataPoints.map(pt => pt.latency),
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time (seconds)',
            },
            grid: {
              color: getStyle('--cui-border-color-translucent'),
              drawOnChartArea: false,
            },
            ticks: {
              color: getStyle('--cui-body-color'),
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: getStyle('--cui-border-color-translucent'),
            },
            ticks: {
              color: getStyle('--cui-body-color'),
            },
          },
        },
        elements: {
          line: {
            tension: 0.4,
          },
          point: {
            radius: 0,
            hitRadius: 10,
            hoverRadius: 4,
            hoverBorderWidth: 3,
          },
        },
      }}
    />
  )
}

export default MainChart


// import React, { useEffect, useRef } from 'react'

// import { CChartLine } from '@coreui/react-chartjs'
// import { getStyle } from '@coreui/utils'

// const MainChart = () => {
//   const chartRef = useRef(null)

//   useEffect(() => {
//     document.documentElement.addEventListener('ColorSchemeChange', () => {
//       if (chartRef.current) {
//         setTimeout(() => {
//           chartRef.current.options.scales.x.grid.borderColor = getStyle(
//             '--cui-border-color-translucent',
//           )
//           chartRef.current.options.scales.x.grid.color = getStyle('--cui-border-color-translucent')
//           chartRef.current.options.scales.x.ticks.color = getStyle('--cui-body-color')
//           chartRef.current.options.scales.y.grid.borderColor = getStyle(
//             '--cui-border-color-translucent',
//           )
//           chartRef.current.options.scales.y.grid.color = getStyle('--cui-border-color-translucent')
//           chartRef.current.options.scales.y.ticks.color = getStyle('--cui-body-color')
//           chartRef.current.update()
//         })
//       }
//     })
//   }, [chartRef])

//   const random = () => Math.round(Math.random() * 100)

//   return (
//     <>
//       <CChartLine
//         ref={chartRef}
//         style={{ height: '300px', marginTop: '40px' }}
//         data={{
//           labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
//           datasets: [
//             {
//               label: 'My First dataset',
//               backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
//               borderColor: getStyle('--cui-info'),
//               pointHoverBackgroundColor: getStyle('--cui-info'),
//               borderWidth: 2,
//               data: [
//                 random(50, 200),
//                 random(50, 200),
//                 random(50, 200),
//                 random(50, 200),
//                 random(50, 200),
//                 random(50, 200),
//                 random(50, 200),
//               ],
//               fill: true,
//             },
//             {
//               label: 'My Second dataset',
//               backgroundColor: 'transparent',
//               borderColor: getStyle('--cui-success'),
//               pointHoverBackgroundColor: getStyle('--cui-success'),
//               borderWidth: 2,
//               data: [
//                 random(50, 200),
//                 random(50, 200),
//                 random(50, 200),
//                 random(50, 200),
//                 random(50, 200),
//                 random(50, 200),
//                 random(50, 200),
//               ],
//             },
//             {
//               label: 'My Third dataset',
//               backgroundColor: 'transparent',
//               borderColor: getStyle('--cui-danger'),
//               pointHoverBackgroundColor: getStyle('--cui-danger'),
//               borderWidth: 1,
//               borderDash: [8, 5],
//               data: [65, 65, 65, 65, 65, 65, 65],
//             },
//           ],
//         }}
//         options={{
//           maintainAspectRatio: false,
//           plugins: {
//             legend: {
//               display: false,
//             },
//           },
//           scales: {
//             x: {
//               grid: {
//                 color: getStyle('--cui-border-color-translucent'),
//                 drawOnChartArea: false,
//               },
//               ticks: {
//                 color: getStyle('--cui-body-color'),
//               },
//             },
//             y: {
//               beginAtZero: true,
//               border: {
//                 color: getStyle('--cui-border-color-translucent'),
//               },
//               grid: {
//                 color: getStyle('--cui-border-color-translucent'),
//               },
//               max: 250,
//               ticks: {
//                 color: getStyle('--cui-body-color'),
//                 maxTicksLimit: 5,
//                 stepSize: Math.ceil(250 / 5),
//               },
//             },
//           },
//           elements: {
//             line: {
//               tension: 0.4,
//             },
//             point: {
//               radius: 0,
//               hitRadius: 10,
//               hoverRadius: 4,
//               hoverBorderWidth: 3,
//             },
//           },
//         }}
//       />
//     </>
//   )
// }

// export default MainChart
