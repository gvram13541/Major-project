import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormLabel,
  CFormInput,
  CButton,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CRow,
  CCol,
} from '@coreui/react'

const Settings = () => {
  const [settings, setSettings] = useState({
    real_time_monitoring: true,
    traffic_alert_threshold: 80,
  })
  const [ipRules, setIpRules] = useState([])
  const [newRule, setNewRule] = useState({ source: '', destination: '', port: '', action: 'ALLOW' })

  // Fetch settings and IPTable rules on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsResponse = await fetch('http://localhost:8000/settings')
        const settingsData = await settingsResponse.json()
        setSettings(settingsData)

        const rulesResponse = await fetch('http://localhost:8000/iptable-rules')
        const rulesData = await rulesResponse.json()
        setIpRules(rulesData)
      } catch (error) {
        console.error('Error fetching settings or rules:', error)
      }
    }

    fetchSettings()
  }, [])

  // Update general settings
  const updateSettings = async () => {
    try {
      const response = await fetch('http://localhost:8000/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await response.json()
      alert(data.message)
    } catch (error) {
      console.error('Error updating settings:', error)
    }
  }

  // Add a new IPTable rule
  const addRule = async () => {
    try {
      const response = await fetch('http://localhost:8000/iptable-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      })
      const data = await response.json()
      setIpRules([...ipRules, data.rule])
      setNewRule({ source: '', destination: '', port: '', action: 'ALLOW' })
    } catch (error) {
      console.error('Error adding rule:', error)
    }
  }

  // Delete an IPTable rule
  const deleteRule = async (id) => {
    try {
      await fetch(`http://localhost:8000/iptable-rules/${id}`, { method: 'DELETE' })
      setIpRules(ipRules.filter((rule) => rule.id !== id))
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  return (
    <CCard>
      <CCardHeader>
        <h4>Settings</h4>
        <p>Manage network traffic settings for distributed Linux clusters.</p>
      </CCardHeader>
      <CCardBody>
        <h5>General Settings</h5>
        <CForm>
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="monitoring">Enable Real-Time Monitoring</CFormLabel>
              <CFormInput
                type="checkbox"
                id="monitoring"
                checked={settings.real_time_monitoring}
                onChange={(e) =>
                  setSettings({ ...settings, real_time_monitoring: e.target.checked })
                }
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel htmlFor="threshold">Traffic Alert Threshold (%)</CFormLabel>
              <CFormInput
                type="number"
                id="threshold"
                value={settings.traffic_alert_threshold}
                onChange={(e) =>
                  setSettings({ ...settings, traffic_alert_threshold: e.target.value })
                }
              />
            </CCol>
          </CRow>
          <CButton color="primary" onClick={updateSettings}>
            Save Settings
          </CButton>
        </CForm>

        <h5 className="mt-4">IPTable Rule Management</h5>
        <CTable align="middle" className="mb-4 border" hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Source</CTableHeaderCell>
              <CTableHeaderCell>Destination</CTableHeaderCell>
              <CTableHeaderCell>Port</CTableHeaderCell>
              <CTableHeaderCell>Action</CTableHeaderCell>
              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {ipRules.map((rule) => (
              <CTableRow key={rule.id}>
                <CTableDataCell>{rule.source}</CTableDataCell>
                <CTableDataCell>{rule.destination}</CTableDataCell>
                <CTableDataCell>{rule.port}</CTableDataCell>
                <CTableDataCell>{rule.action}</CTableDataCell>
                <CTableDataCell>
                  <CButton color="danger" size="sm" onClick={() => deleteRule(rule.id)}>
                    Delete
                  </CButton>
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>

        <h6>Add New Rule</h6>
        <CForm>
          <CRow className="mb-3">
            <CCol md={3}>
              <CFormInput
                type="text"
                placeholder="Source"
                value={newRule.source}
                onChange={(e) => setNewRule({ ...newRule, source: e.target.value })}
              />
            </CCol>
            <CCol md={3}>
              <CFormInput
                type="text"
                placeholder="Destination"
                value={newRule.destination}
                onChange={(e) => setNewRule({ ...newRule, destination: e.target.value })}
              />
            </CCol>
            <CCol md={2}>
              <CFormInput
                type="text"
                placeholder="Port"
                value={newRule.port}
                onChange={(e) => setNewRule({ ...newRule, port: e.target.value })}
              />
            </CCol>
            <CCol md={2}>
              <CFormInput
                type="text"
                placeholder="Action (ALLOW/BLOCK)"
                value={newRule.action}
                onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
              />
            </CCol>
            <CCol md={2}>
              <CButton color="primary" onClick={addRule}>
                Add Rule
              </CButton>
            </CCol>
          </CRow>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default Settings