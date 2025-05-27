import React, { useEffect } from 'react'

const MonitoringAlerts = () => {
  const CPU_THRESHOLD = 50 // CPU usage threshold in percentage
  const MEMORY_THRESHOLD = 50 // Memory usage threshold in percentage

  const fetchMetrics = async () => {
    try {
      const response = await fetch('http://localhost:8000/dashboard-metrics') // Replace with your API endpoint
      const data = await response.json()

      const { cpuUtilization, memoryUsage } = data

      if (cpuUtilization > CPU_THRESHOLD) {
        alert(`High CPU Usage Alert: ${cpuUtilization}%`)
      }

      if (memoryUsage > MEMORY_THRESHOLD) {
        alert(`High Memory Usage Alert: ${memoryUsage}%`)
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }

  useEffect(() => {
    const interval = setInterval(fetchMetrics, 5000) // Check every 5 seconds
    return () => clearInterval(interval) // Cleanup interval on component unmount
  }, [])

  return null // This component doesn't render anything
}

export default MonitoringAlerts