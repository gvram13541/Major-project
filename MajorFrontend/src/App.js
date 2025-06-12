import React, { Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAuth0 } from '@auth0/auth0-react';

import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'

// We use those styles to show code examples, you should remove them in your application.
import './scss/examples.scss'
import SystemDetails from './views/dashboard/SystemDetails'
import AllSystems from './views/dashboard/AllSystems'
import ChromeTabs from './views/dashboard/ChromeTabs'
import MonitoringAlerts from './views/notifications/MonitoringAlerts'
import Settings from './views/pages/settings/Settings'
import Mail from "./views/pages/mail/mail";
import { NotificationProvider } from './views/notifications/NotificationContext'
import Notifications from './views/notifications/Notifications'
import Tasks from './views/pages/tasks/Tasks'
import Comments from './views/pages/comments/Comments'
import Profile from './views/pages/profile/Profile'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))
const Logout = React.lazy(() => import('./views/pages/logout/Logout'))


// Private Route Component
// const PrivateRoute = ({ children }) => {
//   const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
//   return isAuthenticated ? children : <Navigate to="/login" />
// }
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();
  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
  // const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     loginWithRedirect();
  //   }
  // }, [isLoading, isAuthenticated, loginWithRedirect]);

  // if (isLoading) return <div>Loading...</div>;
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <HashRouter>
      <NotificationProvider>
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
    <Routes>
      <Route exact path="/login" name="Login Page" element={<Login />} />
      <Route exact path="/register" name="Register Page" element={<Register />} />
      <Route exact path="/logout" name="Logout Page" element={<Logout />} />
      <Route exact path="/404" name="Page 404" element={<Page404 />} />
      <Route exact path="/500" name="Page 500" element={<Page500 />} />
      <Route exact path="/all-systems" name="All Systems" element={<AllSystems />} />
      <Route exact path="/system/:systemId" name="System Details" element={<SystemDetails />} />
      <Route exact path="/settings" name="Settings" element={<Settings />} />
      <Route path="/system/:systemId/chrome-tabs" element={<ChromeTabs />} />
      <Route path="/system/:systemId/alerts" element={<MonitoringAlerts />} />
      <Route path="/mail" name="Mail" element={<Mail />} />
      <Route path="/notifications" name="Notifications" element={<Notifications />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/comments" element={<Comments />} />
      <Route path="/profile" element={<Profile />} />
      {/* Private Routes */}
      <Route
        path="*"
        name="Home"
        element={
          <PrivateRoute>
            <DefaultLayout />
          </PrivateRoute>
        }
      />
    </Routes>
      </Suspense>
      </NotificationProvider>
    </HashRouter>
  )
}

export default App

// import React, { Suspense, useEffect } from 'react'
// import { HashRouter, Route, Routes } from 'react-router-dom'
// import { useSelector } from 'react-redux'

// import { CSpinner, useColorModes } from '@coreui/react'
// import './scss/style.scss'

// // We use those styles to show code examples, you should remove them in your application.
// import './scss/examples.scss'

// // Containers
// const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// // Pages
// const Login = React.lazy(() => import('./views/pages/login/Login'))
// const Register = React.lazy(() => import('./views/pages/register/Register'))
// const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
// const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

// const App = () => {
//   const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
//   const storedTheme = useSelector((state) => state.theme)

//   useEffect(() => {
//     const urlParams = new URLSearchParams(window.location.href.split('?')[1])
//     const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
//     if (theme) {
//       setColorMode(theme)
//     }

//     if (isColorModeSet()) {
//       return
//     }

//     setColorMode(storedTheme)
//   }, []) // eslint-disable-line react-hooks/exhaustive-deps

//   return (
//     <HashRouter>
//       <Suspense
//         fallback={
//           <div className="pt-3 text-center">
//             <CSpinner color="primary" variant="grow" />
//           </div>
//         }
//       >
//         <Routes>
//           <Route exact path="/login" name="Login Page" element={<Login />} />
//           <Route exact path="/register" name="Register Page" element={<Register />} />
//           <Route exact path="/404" name="Page 404" element={<Page404 />} />
//           <Route exact path="/500" name="Page 500" element={<Page500 />} />
//           <Route path="*" name="Home" element={<DefaultLayout />} />
//         </Routes>
//       </Suspense>
//     </HashRouter>
//   )
// }

// export default App
