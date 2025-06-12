import React, { useEffect } from 'react'
import { useAuth0 } from "@auth0/auth0-react"

const Login = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (!isAuthenticated) {
      loginWithRedirect();
    }
  }, [isAuthenticated, loginWithRedirect]);

  return (
    <div>Loading...</div>
  )
}

export default Login