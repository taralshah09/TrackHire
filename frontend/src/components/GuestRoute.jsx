import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * GuestRoute — the inverse of ProtectedRoute.
 * Wraps public-only pages (/login, /register, /).
 * If the user is already authenticated, redirects them to /dashboard.
 */
const GuestRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <Navigate to="/" replace />; // or a spinner — keep it silent while auth resolves
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default GuestRoute;
