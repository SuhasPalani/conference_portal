// frontend/lib/auth.js
import { jwtDecode } from 'jwt-decode'; // Correct import for jwt-decode library

// Backend API URL from environment variables
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
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
    removeAuthToken(); // Clear any stale data if token was somehow empty
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
 * @returns {Promise<object>} Response data from the API, including success status, user info, token, and message.
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
 * @param {string} fullName - The full name of the user (from frontend AuthForm).
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 * @returns {Promise<object>} Response data from the API, including success status, user info, token, and message.
 */
export const signupUser = async (fullName, email, password) => {
  try {
    const response = await fetch(`${BACKEND_URL}/register`, { // Endpoint should be '/register' as per backend
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fullName, email, password }), // `fullName` matches backend expectation
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
 * @returns {Promise<object>} A success/failure object for the logout operation.
 */
export const logoutUser = async () => {
  const token = getAuthToken(); // Get the token before removing it

  // --- OPTIONAL: Call backend /logout endpoint if you implement blacklisting ---
  let backendLogoutSuccess = true; // Assume success if no token or backend call skipped/failed gracefully
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
        backendLogoutSuccess = false;
      } else {
        console.log('Token successfully sent to backend for blacklisting.');
      }
    } catch (error) {
      console.error('Error contacting backend logout endpoint:', error);
      backendLogoutSuccess = false;
    }
  }
  // --- END OPTIONAL ---

  // Crucially, always clear client-side storage regardless of backend logout success
  removeAuthToken();
  removeUserData();
  console.log('User token and data removed from localStorage.');

  return { success: backendLogoutSuccess, message: backendLogoutSuccess ? "Logged out successfully." : "Logged out client-side, but backend logout failed." };
};

/**
 * Generic API call with authentication.
 * @param {string} endpoint - The API endpoint relative to BACKEND_URL (e.g., '/dashboard').
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE).
 * @param {object} body - Request body for POST/PUT.
 * @returns {Promise<object>} Object with `success` boolean, `data` (if successful), or `message`/`status` (if failed).
 */
export const callApi = async (endpoint, method = 'GET', body = null) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // If an API call to a protected endpoint returns 401, it means the token is
        // likely expired or invalid. You might want to trigger a global logout here
        // to ensure the user is redirected and local storage cleared.
        // The AuthContext's checkAuthStatus or logout function would typically handle this.
        console.warn(`API call to ${endpoint} received 401 Unauthorized. Token might be expired.`);
      }
      return { success: false, status: response.status, message: data.message || `API error: ${response.status}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error(`Network error calling ${endpoint}:`, error);
    return { success: false, message: 'Network error or server unavailable.' };
  }
};