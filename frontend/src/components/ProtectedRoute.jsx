import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const ProtectedRoute = ({ children, adminOnly = false, userOnly = false }) => {
  const { user, token, isAdmin } = useContext(AuthContext);
  const location = useLocation();

  if (!token || !user) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (userOnly && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};
