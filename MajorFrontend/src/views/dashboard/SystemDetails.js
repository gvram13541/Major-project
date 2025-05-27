import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CSpinner,
} from '@coreui/react'

const SystemDetails = () => {
  const { systemId } = useParams()
  const [processes, setProcesses] = useState([])
  const [limit] = useState(10)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProcesses = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `http://localhost:8000/system/${systemId}/processes?limit=${limit}&offset=${offset}&detailed=true`
        )
        const data = await response.json()
        console.log('Fetched Processes: ', data)
        setProcesses(data.processes)
        setTotal(data.total)
      } catch (error) {
        console.error('Error fetching processes:', error)
      }
      setLoading(false)
    }

    fetchProcesses()
  }, [systemId, offset])

  const nextPage = () => {
    if (offset + limit < total) setOffset(offset + limit)
  }

  const prevPage = () => {
    if (offset - limit >= 0) setOffset(offset - limit)
  }

  return (
    <CCard>
      <CCardHeader>
        <h4>Processes for {systemId}</h4>
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <CSpinner color="primary" />
        ) : (
          <>
            <h5>Processes</h5>
            <CTable align="middle" className="mb-4 border" hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>PID</CTableHeaderCell>
                  <CTableHeaderCell>Process Name</CTableHeaderCell>
                  <CTableHeaderCell>Username</CTableHeaderCell>
                  <CTableHeaderCell>CPU Usage (%)</CTableHeaderCell>
                  <CTableHeaderCell>Memory Usage (%)</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {processes.map((process, index) => (
                  <CTableRow key={index}>
                    <CTableDataCell>{process.PID}</CTableDataCell>
                    <CTableDataCell>{process.Name}</CTableDataCell>
                    <CTableDataCell>{process.User}</CTableDataCell>
                    <CTableDataCell>{process["CPU (%)"]}</CTableDataCell>
                    <CTableDataCell>{process["Memory (%)"]?.toFixed(2)}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>

            <h5>Connections</h5>
            <CTable align="middle" className="mb-4 border" hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>PID</CTableHeaderCell>
                  <CTableHeaderCell>Local Address</CTableHeaderCell>
                  <CTableHeaderCell>Remote Address</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {processes.flatMap((process) =>
                  process.connections?.map((conn, index) => (
                    <CTableRow key={`${process.PID}-conn-${index}`}>
                      <CTableDataCell>{process.PID}</CTableDataCell>
                      <CTableDataCell>
                        {conn.laddr ? `${conn.laddr.ip}:${conn.laddr.port}` : 'N/A'}
                      </CTableDataCell>
                      <CTableDataCell>
                        {conn.raddr ? `${conn.raddr.ip}:${conn.raddr.port}` : 'N/A'}
                      </CTableDataCell>
                      <CTableDataCell>{conn.status}</CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>

            <h5>Open Files</h5>
            <CTable align="middle" className="mb-0 border" hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>PID</CTableHeaderCell>
                  <CTableHeaderCell>File Path</CTableHeaderCell>
                  <CTableHeaderCell>File Descriptor</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
  {processes.flatMap((process) =>
    process.open_files?.map((file, index) => (
      <CTableRow key={`${process.PID}-file-${index}`}>
        <CTableDataCell>{process.PID}</CTableDataCell>
        <CTableDataCell>{file.path}</CTableDataCell>
        <CTableDataCell>{file.fd}</CTableDataCell>
      </CTableRow>
    ))
  )}
</CTableBody>
            </CTable>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <CButton onClick={prevPage} disabled={offset === 0}>
                Previous
              </CButton>
              <span>
                Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
              </span>
              <CButton onClick={nextPage} disabled={offset + limit >= total}>
                Next
              </CButton>
            </div>
          </>
        )}
      </CCardBody>
    </CCard>
  )
}

export default SystemDetails
