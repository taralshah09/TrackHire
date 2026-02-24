import React, { createContext, useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode'; // npm install jwt-decode

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if token is expired
    const isTokenExpired = (token) => {
        if (!token) return true;

        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            // Check if token expires in less than 5 minutes
            return decoded.exp < currentTime + 300;
        } catch (error) {
            console.error('Error decoding token:', error);
            return true;
        }
    };

    // Refresh access token using refresh token
    const refreshAccessToken = async () => {
        const refreshToken = Cookies.get('refreshToken');

        if (!refreshToken) {
            console.log('No refresh token available');
            return null;
        }

        try {
            console.log('Attempting to refresh access token...');

            const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Token refreshed successfully');

                // Update the access token cookie
                const cookieOptions = {
                    expires: 7,
                    path: '/',
                    sameSite: 'Lax',
                    secure: window.location.protocol === 'https:'
                };

                Cookies.set('accessToken', data.token || data.accessToken, cookieOptions);
                setAccessToken(data.token || data.accessToken);

                return data.token || data.accessToken;
            } else {
                console.error('❌ Token refresh failed');
                // Refresh token is invalid or expired, logout user
                logout();
                return null;
            }
        } catch (error) {
            console.error('❌ Error refreshing token:', error);
            logout();
            return null;
        }
    };

    // Verify and refresh token if needed
    const verifyAuth = async () => {
        const token = Cookies.get('accessToken');
        const refreshToken = Cookies.get('refreshToken');
        const username = Cookies.get('username');
        const email = Cookies.get('email');

        if (!token && !refreshToken) {
            console.log('No tokens found, user not authenticated');
            setLoading(false);
            return;
        }

        // If access token exists and is not expired
        if (token && !isTokenExpired(token)) {
            console.log('✅ Valid access token found');
            setAccessToken(token);
            setUser({ username, email });
            setLoading(false);
            return;
        }

        // If access token is expired but refresh token exists
        if (refreshToken) {
            console.log('Access token expired, attempting refresh...');
            const newToken = await refreshAccessToken();

            if (newToken) {
                setUser({ username, email });
            }
        } else {
            console.log('No valid tokens, logging out');
            logout();
        }

        setLoading(false);
    };

    // Initialize auth state from cookies on mount
    useEffect(() => {
        verifyAuth();
    }, []);

    // Set up automatic token refresh check every 5 minutes
    useEffect(() => {
        if (!accessToken) return;

        const interval = setInterval(async () => {
            const token = Cookies.get('accessToken');
            if (token && isTokenExpired(token)) {
                console.log('Token expired, refreshing...');
                await refreshAccessToken();
            }
        }, 5 * 60 * 1000); // Check every 5 minutes

        return () => clearInterval(interval);
    }, [accessToken]);

    const login = (authData) => {
        console.log('=== AuthContext login called ===');
        console.log('Raw authData received:', authData);

        const { token, refreshToken, username, email, user: userData } = authData;

        // Handle case where user data might be nested
        const finalUsername = username || userData?.username;
        const finalEmail = email || userData?.email;

        console.log('Extracted values:', {
            token,
            refreshToken,
            username: finalUsername,
            email: finalEmail
        });

        // Validate that we have the required data
        if (!token || !refreshToken) {
            console.error('❌ Missing required authentication data');
            console.error('Token present:', !!token);
            console.error('RefreshToken present:', !!refreshToken);
            return false;
        }

        if (!finalUsername) {
            console.error('❌ Missing username in response');
            return false;
        }

        try {
            // Set cookies with appropriate expiration and options
            const cookieOptions = {
                expires: 7,
                path: '/',
                sameSite: 'Lax',
                secure: window.location.protocol === 'https:'
            };

            Cookies.set('accessToken', token, cookieOptions);
            Cookies.set('refreshToken', refreshToken, { ...cookieOptions, expires: 30 });
            Cookies.set('username', finalUsername, { ...cookieOptions, expires: 30 });
            if (finalEmail) {
                Cookies.set('email', finalEmail, { ...cookieOptions, expires: 30 });
            }

            console.log('✅ Cookies set successfully');
            console.log('Verification - accessToken:', Cookies.get('accessToken')?.substring(0, 20) + '...');
            console.log('Verification - refreshToken:', Cookies.get('refreshToken')?.substring(0, 20) + '...');
            console.log('Verification - username:', Cookies.get('username'));
            console.log('Verification - email:', Cookies.get('email'));

            // Update state
            setAccessToken(token);
            setUser({ username: finalUsername, email: finalEmail });

            return true;
        } catch (error) {
            console.error('❌ Error setting cookies:', error);
            return false;
        }
    };

    const logout = () => {
        console.log('Logging out...');

        // Remove all cookies
        Cookies.remove('accessToken', { path: '/' });
        Cookies.remove('refreshToken', { path: '/' });
        Cookies.remove('username', { path: '/' });
        Cookies.remove('email', { path: '/' });

        // Clear state
        setAccessToken(null);
        setUser(null);

        console.log('Logout complete');
    };

    // Get current valid access token (refresh if needed)
    const getAccessToken = async () => {
        const token = Cookies.get('accessToken');

        if (token && !isTokenExpired(token)) {
            return token;
        }

        // Token expired, try to refresh
        return await refreshAccessToken();
    };

    const value = {
        user,
        accessToken,
        login,
        logout,
        loading,
        isAuthenticated: !!accessToken,
        getAccessToken, // Export this for API calls
        refreshAccessToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};