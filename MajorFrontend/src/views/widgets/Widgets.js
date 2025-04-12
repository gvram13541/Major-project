import React from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
} from '@coreui/react'

const Widgets = () => {
  const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

  return (
    <CCard className="mb-4">
      <CCardHeader>Widgets</CCardHeader>
      <CCardBody>
      </CCardBody>
    </CCard>
  )
}

export default Widgets
