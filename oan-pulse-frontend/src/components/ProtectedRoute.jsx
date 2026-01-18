import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div style={styles.accessDenied}>
        <div style={styles.accessDeniedIcon}>🔒</div>
        <h2 style={styles.accessDeniedTitle}>Access Denied</h2>
        <p style={styles.accessDeniedText}>
          You don't have permission to view this page.
        </p>
        <p style={styles.accessDeniedHint}>
          Your role: <strong>{user?.role}</strong>
        </p>
      </div>
    );
  }

  // Render children if authenticated and authorized
  return children;
};

const styles = {
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'var(--bg-secondary)',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid var(--border-light)',
    borderTop: '4px solid var(--primary-color)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  accessDenied: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    textAlign: 'center',
  },
  accessDeniedIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  accessDeniedTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: '0 0 16px 0',
  },
  accessDeniedText: {
    fontSize: '16px',
    color: 'var(--text-secondary)',
    margin: '0 0 8px 0',
  },
  accessDeniedHint: {
    fontSize: '14px',
    color: 'var(--text-light)',
    margin: 0,
  },
};

export default ProtectedRoute;

