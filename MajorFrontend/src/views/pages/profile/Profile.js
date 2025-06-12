import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in.</div>;

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", textAlign: "center" }}>
      <img src={user.picture} alt="Profile" style={{ borderRadius: "50%", width: 100, height: 100 }} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <span style={{ background: "#e7f3ff", color: "#1976d2", padding: "2px 8px", borderRadius: 4 }}>
        Logged in via Auth0
      </span>
    </div>
  );
};

export default Profile;