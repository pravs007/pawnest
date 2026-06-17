import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-brand-light">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-orange border-t-transparent"></div>
          <p className="text-lg font-medium text-brand-dark">Loading your PawNest profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    // Redirect non-admins trying to access admin pages
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
