// lib/auth.js

// Backend API URL from environment variables
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Stores the JWT token in local storage.
 * @param {string} token - The JWT token.
 */
export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') { // Check if running in browser
    localStorage.setItem('token', token);
  }
};

/**
 * Retrieves the JWT token from local storage.
 * @returns {string | null} The JWT token or null if not found.
 */
export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

/**
 * Parses the JWT token to get user information.
 * Note: This is client-side parsing and should not be used for security-critical checks.
 * Always verify tokens on the backend.
 * @param {string} token - The JWT token.
 * @returns {object | null} Decoded payload or null if invalid.
 */
export const decodeToken = (token) => {
  if (!token) return null;
  try {
    // JWTs are base64 encoded, split into header, payload, signature
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode token:", e);
    return null;
  }
};

/**
 * Authenticates a user by sending credentials to the backend.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Response data from the API, including token and user info.
 */
export const loginUser = async (email, password) => {
  const response = await fetch(`${BACKEND_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (response.ok && data.token) {
    setAuthToken(data.token);
  }
  return data;
};

/**
 * Registers a new user.
 * @param {string} full_name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Response data from the API, including token.
 */
export const signupUser = async (full_name, email, password) => {
  const response = await fetch(`${BACKEND_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ full_name, email, password }),
  });
  const data = await response.json();
  if (response.ok && data.token) {
    setAuthToken(data.token);
  }
  return data;
};

/**
 * Removes the JWT token from local storage and optionally calls a backend logout endpoint.
 */
export const logoutUser = async () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token'); // Get the token before removing it

    if (token) {
      // --- OPTIONAL: Call backend /logout endpoint if you implement blacklisting ---
      // This helps invalidate the token on the server side immediately,
      // preventing its use even if it hasn't expired.
      /*
      try {
        const response = await fetch(`${BACKEND_URL}/logout`, {
          method: 'POST', // Or 'DELETE', depending on your backend API design
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Send the token to be blacklisted
          },
        });
        if (!response.ok) {
          console.warn('Backend logout (token blacklisting) failed:', await response.json());
        } else {
          console.log('Token successfully sent to backend for blacklisting.');
        }
      } catch (error) {
        console.error('Error contacting backend logout endpoint:', error);
      }
      */
      // --- END OPTIONAL ---

      localStorage.removeItem('token'); // This is the crucial client-side step
      console.log('Token removed from localStorage.');
    } else {
      console.log('No token found in localStorage to remove.');
    }
  }
};