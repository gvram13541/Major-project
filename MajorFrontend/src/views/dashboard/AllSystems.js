import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  CButtonGroup,
} from '@coreui/react'

const AllSystems = () => {
  const [systems, setSystems] = useState([]) // State to store systems data
  const [currentPage, setCurrentPage] = useState(1) // Current page
  const [itemsPerPage] = useState(5) // Number of items per page
  const navigate = useNavigate() // React Router's navigation hook

  useEffect(() => {
    const fetchSystems = async () => {
      try {
        const response = await fetch('http://localhost:8000/systems-monitoring') // Replace with your backend URL
        const data = await response.json()
        setSystems(data) // Update state with fetched data
      } catch (error) {
        console.error('Error fetching systems:', error)
      }
    }

    fetchSystems()
  }, [])

  // Calculate the current systems to display
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentSystems = systems.slice(indexOfFirstItem, indexOfLastItem)

  // Handle pagination
  const nextPage = () => {
    if (currentPage < Math.ceil(systems.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Example handlers for system actions
  const handleRestartSystem = (systemId) => {
    alert(`Restarting system: ${systemId}`)
  }

  const handleShutdownSystem = (systemId) => {
    alert(`Shutting down system: ${systemId}`)
  }

  return (
    <CCard>
      <CCardHeader>
        <h4>System Monitoring</h4>
      </CCardHeader>
      <CCardBody>
        <CTable align="middle" className="mb-4 border" hover responsive>
          <CTableHead className="text-nowrap">
            <CTableRow>
              <CTableHeaderCell className="bg-body-tertiary text-center">System ID</CTableHeaderCell>
              <CTableHeaderCell className="bg-body-tertiary text-center">Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {currentSystems.map((system, index) => (
              <CTableRow key={index}>
                <CTableDataCell className="text-center">
                  <Link to={`/system/${system.systemId}`} style={{ textDecoration: 'none', color: 'blue' }}>
                    {system.systemId}
                  </Link>
                </CTableDataCell>
                <CTableDataCell className="text-center">
                  <CButtonGroup role="group" aria-label="System Actions">
                    <CButton
                      color="info"
                      size="sm"
                      onClick={() => navigate(`/system/${system.systemId}`)}
                    >
                      View Details
                    </CButton>
                    <CButton
                      color="primary"
                      size="sm"
                      onClick={() => navigate(`/system/${system.systemId}/iprules`)}
                    >
                      IP Rules
                    </CButton>
                    <CButton
                      color="success"
                      size="sm"
                      onClick={() => navigate(`/system/${system.systemId}/chrome-tabs`)}
                    >
                      Chorme Tabs
                    </CButton>
                    <CButton
                      color="secondary"
                      size="sm"
                      onClick={() => navigate(`/system/${system.systemId}/config`)}
                    >
                      Update Config
                    </CButton>
                    <CButton
                        color="dark"
                        size="sm"
                        onClick={() => navigate(`/system/${system.systemId}/logs`)}
                      >
                        View Logs
                      </CButton>
                    <CButton
                      color="warning"
                      size="sm"
                      onClick={() => handleRestartSystem(system.systemId)}
                    >
                      Restart
                    </CButton>
                    <CButton
                      color="danger"
                      size="sm"
                      onClick={() => handleShutdownSystem(system.systemId)}
                    >
                      Shutdown
                    </CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
        <div className="d-flex justify-content-between">
          <CButton onClick={prevPage} disabled={currentPage === 1}>
            Previous
          </CButton>
          <span>
            Page {currentPage} of {Math.ceil(systems.length / itemsPerPage)}
          </span>
          <CButton
            onClick={nextPage}
            disabled={currentPage === Math.ceil(systems.length / itemsPerPage)}
          >
            Next
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  )
}

export default AllSystems