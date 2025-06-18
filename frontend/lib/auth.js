// lib/auth.js
import {jwt_decode} from 'jwt-decode'; // Import jwt_decode for decoding JWT tokens
// Backend API URL from environment variables
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const TOKEN_KEY = "token"; // Consistent key for localStorage
const USER_DATA_KEY = "user_data"; // Key for storing user object

/**
 * Stores the JWT token in local storage.
 * @param {string} token - The JWT token.
 */
export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') { // Check if running in browser
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Retrieves the JWT token from local storage.
 * @returns {string | null} The JWT token or null if not found.
 */
export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

/**
 * Parses the JWT token to get user information and checks for expiration.
 * Note: This is client-side parsing and should not be used for security-critical checks.
 * Always verify tokens on the backend for sensitive operations.
 * @param {string} token - The JWT token.
 * @returns {object | null} Decoded payload or null if invalid or expired.
 */
export const decodeToken = (token) => {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!token) {
    console.log("No token provided to decode.");
    removeAuthToken(); // Clear any stale data
    removeUserData();
    return null;
  }

  try {
    const decoded = jwtDecode(token); // Use jwtDecode directly
    const currentTime = Date.now() / 1000;

    if (decoded.exp < currentTime) {
      console.log('Token expired.');
      removeAuthToken();
      removeUserData();
      return null;
    }
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    removeAuthToken(); // Clear on decoding error as well
    removeUserData();
    return null;
  }
};

/**
 * Stores the user data (e.g., full_name, email) in local storage.
 * This is typically received from the login/signup API response.
 * @param {object} userData - The user object.
 */
export const setUserData = (userData) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch (e) {
      console.error("Error saving user data to localStorage:", e);
    }
  }
};

/**
 * Retrieves the user data from local storage.
 * @returns {object | null} The user object or null if not found.
 */
export const getUserData = () => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Error parsing user data from localStorage:", e);
      return null;
    }
  }
  return null;
};

/**
 * Removes the JWT token from local storage.
 */
export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
};

/**
 * Removes the user data from local storage.
 */
export const removeUserData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_DATA_KEY);
  }
};


/**
 * Authenticates a user by sending credentials to the backend.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Response data from the API, including token and user info.
 * Does NOT store token/user data itself.
 */
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${BACKEND_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok && data.token && data.user) { // Ensure user data is also returned
      return { success: true, user: data.user, token: data.token, message: "Login successful!" };
    } else {
      // If response not ok or missing token/user, it's a login failure
      return { success: false, message: data.message || 'Login failed: Invalid credentials or server error.' };
    }
  } catch (error) {
    console.error("Network error during login:", error);
    return { success: false, message: 'Network error or server unavailable.' };
  }
};

/**
 * Registers a new user.
 * @param {string} full_name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Response data from the API, including token and user info.
 * Does NOT store token/user data itself.
 */
export const signupUser = async (full_name, email, password) => {
  try {
    const response = await fetch(`${BACKEND_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ full_name, email, password }),
    });
    const data = await response.json();
    if (response.ok && data.token && data.user) { // Ensure user data is also returned
      return { success: true, user: data.user, token: data.token, message: "Signup successful!" };
    } else {
      return { success: false, message: data.message || 'Signup failed: Please try again.' };
    }
  } catch (error) {
    console.error("Network error during signup:", error);
    return { success: false, message: 'Network error or server unavailable.' };
  }
};

/**
 * Removes the JWT token and user data from local storage and optionally calls a backend logout endpoint.
 */
export const logoutUser = async () => {
  const token = getAuthToken(); // Get the token before removing it

  // --- OPTIONAL: Call backend /logout endpoint if you implement blacklisting ---
  if (token) {
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
  }
  // --- END OPTIONAL ---

  // Crucially, always clear client-side storage regardless of backend logout success
  removeAuthToken();
  removeUserData();
  console.log('User token and data removed from localStorage.');
};