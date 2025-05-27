import React, { useState, useEffect } from 'react'
import { CCard, CCardBody, CCol, CCardHeader, CRow } from '@coreui/react'
import {
  CChartBar,
  CChartDoughnut,
  CChartLine,
  CChartPie,
  CChartPolarArea,
  CChartRadar,
} from '@coreui/react-chartjs'

const Charts = () => {
  const random = () => Math.round(Math.random() * 100)

  const [polarData, setPolarData] = useState({ labels: [], data: [] })
  const [radarData, setRadarData] = useState({ labels: [], datasets: [] })

  // Fetch Polar Area Chart Data (Packet Drop Rate by Node)
  useEffect(() => {
    const fetchPolarData = async () => {
      try {
        const response = await fetch('http://localhost:8000/charts-data/polar') // Backend endpoint for polar chart
        const data = await response.json()
        setPolarData(data)
      } catch (error) {
        console.error('Error fetching polar chart data:', error)
      }
    }

    fetchPolarData()
  }, [])

  // Fetch Radar Chart Data (Application Resource Usage)
  useEffect(() => {
    const fetchRadarData = async () => {
      try {
        const response = await fetch('http://localhost:8000/charts-data/radar') // Backend endpoint for radar chart
        const data = await response.json()
        setRadarData(data)
      } catch (error) {
        console.error('Error fetching radar chart data:', error)
      }
    }

    fetchRadarData()
  }, [])

  return (
    <CRow>
      <CCol xs={6}>
        <CCard className="mb-4">
          <CCardHeader>Methods</CCardHeader>
          <CCardBody>
            <CChartBar
              data={{
                labels: ['GET', 'PUT', 'PATCH', 'POST', 'TCP', 'HTTP', 'IP'],
                datasets: [
                  {
                    label: 'Methods count',
                    backgroundColor: '#f87979',
                    data: [40, 20, 12, 39, 10, 40, 39, 80, 40],
                  },
                ],
              }}
              labels="Methods"
            />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={6}>
        <CCard className="mb-4">
          <CCardHeader>CPU Usage</CCardHeader>
          <CCardBody>
            <CChartLine
              data={{
                labels: ['1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00'],
                datasets: [
                  {
                    label: 'Node1',
                    backgroundColor: 'rgba(220, 220, 220, 0.2)',
                    borderColor: 'rgba(220, 220, 220, 1)',
                    pointBackgroundColor: 'rgba(220, 220, 220, 1)',
                    pointBorderColor: '#fff',
                    data: [random(), random(), random(), random(), random(), random(), random()],
                  },
                  {
                    label: 'Node2',
                    backgroundColor: 'rgba(151, 187, 205, 0.2)',
                    borderColor: 'rgba(151, 187, 205, 1)',
                    pointBackgroundColor: 'rgba(151, 187, 205, 1)',
                    pointBorderColor: '#fff',
                    data: [random(), random(), random(), random(), random(), random(), random()],
                  },
                  {
                    label: 'Node3',
                    backgroundColor: 'rgba(151, 187, 205, 0.2)',
                    borderColor: 'rgb(151, 161, 205)',
                    pointBackgroundColor: 'rgba(151, 187, 205, 1)',
                    pointBorderColor: '#fff',
                    data: [random(), random(), random(), random(), random(), random(), random()],
                  },
                ],
              }}
            />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={6}>
        <CCard className="mb-4">
          <CCardHeader>Memory Usage</CCardHeader>
          <CCardBody>
            <CChartDoughnut
              data={{
                labels: ['Node1', 'Node2', 'Node3'],
                datasets: [
                  {
                    backgroundColor: ['#41B883', '#E46651', '#00D8FF', '#DD1B16'],
                    data: [40, 20, 80, 10],
                  },
                ],
              }}
            />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={6}>
        <CCard className="mb-4">
          <CCardHeader>Disk Usage</CCardHeader>
          <CCardBody>
            <CChartPie
              data={{
                labels: ['Node1', 'Node2', 'Node3'],
                datasets: [
                  {
                    data: [300, 50, 100],
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                    hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                  },
                ],
              }}
            />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={6}>
        <CCard className="mb-4">
          <CCardHeader>Polar Area Chart (Packet Drop Rate by Node)</CCardHeader>
          <CCardBody>
            <CChartPolarArea
              data={{
                labels: polarData.labels,
                datasets: [
                  {
                    data: polarData.data,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                  },
                ],
              }}
            />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={6}>
        <CCard className="mb-4">
          <CCardHeader>Radar Chart (Application Resource Usage)</CCardHeader>
          <CCardBody>
            <CChartRadar
              data={{
                labels: radarData.labels,
                datasets: radarData.datasets,
              }}
            />
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Charts