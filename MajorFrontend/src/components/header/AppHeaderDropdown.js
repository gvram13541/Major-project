import React from 'react'
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import {
  cilBell,
  cilCommentSquare,
  cilEnvelopeOpen,
  cilLockLocked,
  cilSettings,
  cilTask,
  cilUser,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { useNavigate } from 'react-router-dom'

import avatar10 from './../../assets/images/avatars/10.avif'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar src={avatar10} size="md" />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">Account</CDropdownHeader>
        <CDropdownItem onClick={() => navigate('/notifications')}>
          <CIcon icon={cilBell} className="me-2" />
          Updates
        </CDropdownItem>
        <CDropdownItem onClick={() => navigate('/mail')}>
          <CIcon icon={cilEnvelopeOpen} className="me-2" />
          Mails
        </CDropdownItem>
        <CDropdownItem onClick={() => navigate('/tasks')}>
          <CIcon icon={cilTask} className="me-2" />
          Tasks
        </CDropdownItem>
        <CDropdownItem onClick={() => navigate('/comments')}>
          <CIcon icon={cilCommentSquare} className="me-2" />
          Comments
        </CDropdownItem>
        <CDropdownItem onClick={() => navigate('/profile')}>
          <CIcon icon={cilUser} className="me-2" />
          Profile
        </CDropdownItem>
        <CDropdownItem onClick={() => navigate('/settings')}>
          <CIcon icon={cilTask} className="me-2" />
          Settings
        </CDropdownItem>
        <CDropdownDivider />
        <CDropdownItem onClick={() => {
            localStorage.removeItem('isAuthenticated') // Clear authentication state
            window.location.href = '/#/login' // Redirect to login page
          }}>
            <CIcon icon={cilLockLocked} className="me-2" />
            Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
