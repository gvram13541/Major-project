import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { CCard, CCardBody, CCardHeader, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow } from '@coreui/react'

const ChromeTabs = () => {
  const { systemId } = useParams()
  const [tabs, setTabs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChromeTabs = async () => {
      try {
        const response = await fetch(`http://localhost:8000/system/${systemId}/chrome-tabs`)
        const data = await response.json()
        setTabs(data.openTabs || [])
      } catch (error) {
        console.error('Error fetching Chrome tabs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChromeTabs()
  }, [systemId])

  return (
    <CCard>
      <CCardHeader>
        <h4>Chrome Tabs for {systemId}</h4>
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <p>Loading...</p>
        ) : tabs.length > 0 ? (
          <CTable align="middle" className="mb-0 border" hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Title</CTableHeaderCell>
                <CTableHeaderCell>URL</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {tabs.map((tab, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>{tab.Title}</CTableDataCell>
                  <CTableDataCell>
                    <a href={tab.URL} target="_blank" rel="noopener noreferrer">
                      {tab.URL}
                    </a>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        ) : (
          <p>No Chrome tabs found for this system.</p>
        )}
      </CCardBody>
    </CCard>
  )
}

export default ChromeTabs