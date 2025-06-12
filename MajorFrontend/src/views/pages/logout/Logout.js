import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Logout = () => {
  const { logout } = useAuth0();

  useEffect(() => {
    // 1. Download agent data
    fetch('http://localhost:8000/download-agent-data', {
      method: 'GET',
      credentials: 'include',
    })
      .then(async (response) => {
        if (response.ok) {
          // Get filename from Content-Disposition header
          const disposition = response.headers.get('Content-Disposition');
          let filename = 'agent_data.xlsx';
          if (disposition && disposition.indexOf('filename=') !== -1) {
            filename = disposition.split('filename=')[1].replace(/"/g, '');
          }
          // Download the file
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        }
        // 2. Proceed with logout after download
        logout({
          logoutParams: {
            returnTo: window.location.origin + "/#/login",
          },
        });
      })
      .catch(() => {
        // If download fails, still logout
        logout({
          logoutParams: {
            returnTo: window.location.origin + "/#/login",
          },
        });
      });
  }, [logout]);

  return <div>Loading...</div>;
};

export default Logout;

// import React, { useEffect } from "react";
// import { useAuth0 } from "@auth0/auth0-react";

// const Logout = () => {
//   const { logout } = useAuth0();

//   useEffect(() => {
//     logout({
//       logoutParams: {
//         returnTo: window.location.origin + "/#/login", // For HashRouter
//       },
//     });
//   }, [logout]);

//   return <div>Loading...</div>;
// };

// export default Logout;