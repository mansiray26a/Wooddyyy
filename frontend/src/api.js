const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getHeaders = () => {
  const token = localStorage.getItem('woody-token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Global 401 handler — clears the stale token and sends the user back to login.
 * This fires whenever ANY API call gets a 401, so the app never gets stuck
 * in a loop of showing errors after a server restart (which wipes the in-memory DB).
 */
const handle401 = () => {
  localStorage.removeItem('woody-token');
  // Only redirect if we are not already on the login page
  if (window.location.hash !== '#login') {
    window.location.hash = '#login';
  }
};

const handleResponse = async (res) => {
  // Auto-logout on expired / invalid token
  if (res.status === 401) {
    let errorMsg = 'Session expired. Please log in again.';
    try {
      const data = await res.json();
      errorMsg = data.message || errorMsg;
    } catch (e) {
      // ignore parse errors
    }
    handle401();
    throw new Error(errorMsg);
  }

  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const data = await res.json();
      errorMsg = data.message || errorMsg;
    } catch (e) {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
};

export const api = {
  get: async (endpoint) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  post: async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  put: async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  patch: async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },

  delete: async (endpoint) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
