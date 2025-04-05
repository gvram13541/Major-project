import React, { useState } from 'react';
import {
  CButton,
  CCollapse,
  CContainer,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CNavbar,
  CNavbarNav,
  CNavbarToggler,
  CNavItem,
  CNavLink,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilBell, cilEnvelopeOpen, cilMenu, cilMoon, cilSun, cilUser} from '@coreui/icons';
import './App.css';
import '@coreui/coreui/dist/css/coreui.min.css'
import 'bootstrap/dist/css/bootstrap.min.css'

const Navbar = ({ toggleSidebar }) => {
  const [visible, setVisible] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    document.body.className = isDarkTheme ? 'light-theme' : 'dark-theme';
  };

  return (
    <CNavbar
      expand="lg"
      colorScheme={isDarkTheme ? 'dark' : 'light'}
      className={`${isDarkTheme ? 'bg-dark text-white' : 'bg-light text-dark'}`}
      style={{ padding: '0.7rem' }} // Inline padding style
    >
      <CContainer fluid>
        {/* <CNavbarToggler
          aria-label="Toggle navigation"
          aria-expanded={visible}
          onClick={() => setVisible(!visible)}
        >
          <CIcon icon={cilMenu}/>
        </CNavbarToggler> */}
        <CNavbarNav>
          <CNavItem>
            <CButton onClick={toggleSidebar} className={isDarkTheme ? 'text-white' : 'text-dark'}>
              <CIcon icon={cilMenu} size="xl"/>
            </CButton>
          </CNavItem>
          <CNavItem>
            <CButton  className={isDarkTheme ? 'text-white' : 'text-dark'}>
              Dashboards
            </CButton>
          </CNavItem>
          <CNavItem>
            <CButton  className={isDarkTheme ? 'text-white' : 'text-dark'}>
              Systems
            </CButton>
          </CNavItem>
          <CNavItem>
            <CButton  className={isDarkTheme ? 'text-white' : 'text-dark'}>
              Settings
            </CButton>
          </CNavItem>
        </CNavbarNav>

        <CCollapse className="navbar-collapse" visible={visible}>
          <CNavbarNav />
          <CNavbarNav>
            <CNavItem>
              <CNavLink href="#" className={isDarkTheme ? 'text-white' : 'text-dark'}>
                <CIcon icon={cilBell} size="xl"/>
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink href="#" className={isDarkTheme ? 'text-white' : 'text-dark'}>
                <CIcon icon={cilEnvelopeOpen} size="xl"/>
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CButton onClick={toggleTheme} className={isDarkTheme ? 'text-white' : 'text-dark'}>
                <CIcon icon={isDarkTheme ? cilSun : cilMoon} size="xl"/>
              </CButton>
            </CNavItem>
            <CDropdown variant="nav-item">
              <CDropdownToggle className={isDarkTheme ? 'text-white' : 'text-dark'}>
                <CIcon icon={cilUser} size="xl"/>
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem href="#">Settings</CDropdownItem>
                <CDropdownItem href="#">Logout</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </CNavbarNav>
        </CCollapse>
      </CContainer>
    </CNavbar>
  );
};

export default Navbar;