// frontend/src/pages/Auth/RequireAuth.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ComponentLoader from "../../components/ComponentLoader.jsx"

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  
  console.log("🔐 RequireAuth check:", { user: !!user, loading });
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ComponentLoader />
      </div>
    );
  }
  
  if (!user) {
    console.log("❌ No user, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  console.log("✅ User authenticated, showing protected content");
  return children;
}