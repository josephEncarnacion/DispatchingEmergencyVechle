// src/components/RoleProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    // Show a loading spinner or null while checking auth status
    return <div>Loading...</div>;
  }

  // Only allow access if authenticated and the role is allowed
  return isAuthenticated && allowedRoles.includes(role) ? children : <Navigate to="/login" />;
};

export default RoleProtectedRoute;
