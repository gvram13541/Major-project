import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'
import { Auth0Provider } from "@auth0/auth0-react"; // <-- Add this line

import App from './App'
import store from './store'
import AuthWrapper from './AuthWrapper'; // <-- Import the AuthWrapper

createRoot(document.getElementById('root')).render(
  <Auth0Provider
    domain={import.meta.env.VITE_AUTH0_DOMAIN}
    clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI,
      prompt: 'login',
    }}
  >
    <Provider store={store}>
      <AuthWrapper/>
    </Provider>
  </Auth0Provider>,
)