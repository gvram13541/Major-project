import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import App from "./App";

const AuthWrapper = () => {
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect();
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return <App />;
};

export default AuthWrapper;