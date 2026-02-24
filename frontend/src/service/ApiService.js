import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper function to get access token from cookies
const getAccessToken = () => {
    return Cookies.get('accessToken');
};

// Helper function to get refresh token from cookies
const getRefreshToken = () => {
    return Cookies.get('refreshToken');
};

// Function to refresh the access token
const refreshAccessToken = async () => {
    try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            const newAccessToken = data.token || data.accessToken;
            Cookies.set('accessToken', newAccessToken, { expires: 1 });
            return newAccessToken;
        } else {
            Cookies.remove('accessToken');
            Cookies.remove('refreshToken');
            Cookies.remove('username');
            Cookies.remove('email');
            window.location.href = '/login';
            throw new Error('Session expired. Please login again.');
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
    }
};

// Main API request function with automatic token refresh
export const apiRequest = async (endpoint, options = {}) => {
    const accessToken = getAccessToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            const newAccessToken = await refreshAccessToken();
            headers['Authorization'] = `Bearer ${newAccessToken}`;

            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });

            return retryResponse;
        }

        return response;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
};

// Convenience methods for common HTTP verbs
export const api = {
    get: (endpoint, options = {}) =>
        apiRequest(endpoint, { ...options, method: 'GET' }),

    post: (endpoint, data, options = {}) =>
        apiRequest(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        }),

    put: (endpoint, data, options = {}) =>
        apiRequest(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    patch: (endpoint, data, options = {}) =>
        apiRequest(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    delete: (endpoint, options = {}) =>
        apiRequest(endpoint, { ...options, method: 'DELETE' }),

    // Public Endpoints
    getFeaturedJobs: (category) =>
        apiRequest(`/public/jobs/featured${category ? `?category=${category}` : ''}`, { method: 'GET' }),

    getPlatformStats: () =>
        apiRequest('/public/stats', { method: 'GET' }),

    // Job Browsing
    getJobs: (params) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/jobs?${query}`, { method: 'GET' });
    },

    getJobById: (id) =>
        apiRequest(`/jobs/${id}`, { method: 'GET' }),

    searchJobs: (params) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/jobs/search?${query}`, { method: 'GET' });
    },

    filterJobs: (params) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/jobs/filter?${query}`, { method: 'GET' });
    },

    getInternJobs: (params) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/jobs/intern?${query}`, { method: 'GET' });
    },

    getFulltimeJobs: (params) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/jobs/fulltime?${query}`, { method: 'GET' });
    },

    getEmploymentTypeCounts: () =>
        apiRequest('/jobs/filter/counts', { method: 'GET' }),

    getJobsByCategory: (category, params) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/jobs/category/${category}?${query}`, { method: 'GET' });
    },

    // Saved Jobs
    saveJob: (id) =>
        apiRequest(`/jobs/${id}/save`, { method: 'POST' }),

    unsaveJob: (id) =>
        apiRequest(`/jobs/${id}/save`, { method: 'DELETE' }),

    checkJobSaved: (id) =>
        apiRequest(`/jobs/${id}/is-saved`, { method: 'GET' }),

    getSavedJobs: (params) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/jobs/saved?${query}`, { method: 'GET' });
    },

    // Application Status Management (Simplified)
    updateJobStatus: (id, status = 'APPLIED') => {
        apiRequest(`/jobs/${id}/status`, {
            method: 'POST',
            body: JSON.stringify({ status })
        })
    },

    withdrawApplication: (id) =>
        apiRequest(`/jobs/${id}/status`, { method: 'DELETE' }),

    getJobStatus: (id) =>
        apiRequest(`/jobs/${id}/status`, { method: 'GET' }),

    getAppliedJobs: (params) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/jobs/applied?${query}`, { method: 'GET' });
    },

    getUserStats: () =>
        apiRequest('/jobs/stats/user', { method: 'GET' }),

    // User Profile
    getUserByUsername: (username) =>
        apiRequest(`/users/username/${username}`, { method: 'GET' }),

    updateUser: (id, data) =>
        apiRequest(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),

    // Job Email Preferences
    getJobPreferences: (userId) =>
        apiRequest(`/preferences/${userId}`, { method: 'GET' }),

    saveJobPreferences: (userId, data) =>
        apiRequest(`/preferences/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    logout: async () => {
        const refreshToken = getRefreshToken();
        try {
            if (refreshToken) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken })
                });
            }
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            Cookies.remove('accessToken');
            Cookies.remove('refreshToken');
            Cookies.remove('username');
            Cookies.remove('email');
            window.location.href = '/login';
        }
    }
};

export default api;