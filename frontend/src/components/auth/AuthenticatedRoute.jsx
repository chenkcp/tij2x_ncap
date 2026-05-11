import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useIsAuthenticated } from '../../contexts/AuthContext';

const AuthenticatedRoute = ({ children }) => {
  const { loading } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ color: '#666', fontSize: '16px' }}>
          Verifying authentication...
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If not authenticated, redirect to auth page with return URL
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?returnUrl=${returnUrl}`} replace />;
  }

  // User is authenticated, render the protected content
  return children;
};

export default AuthenticatedRoute;