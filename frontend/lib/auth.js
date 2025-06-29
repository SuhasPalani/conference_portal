// lib/auth.js
import { jwtDecode } from "jwt-decode"; // Correct import for jwt-decode library
import emailjs from "@emailjs/browser"; // Import EmailJS for frontend use

// Backend API URL from environment variables
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const TOKEN_KEY = "token"; // Consistent key for localStorage
const USER_DATA_KEY = "user_data"; // Key for storing user object

// Initialize EmailJS with your public key
// This ensures EmailJS is only initialized once and only in the browser.
if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
) {
  emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
  console.log(
    "EmailJS initialized with public key:",
    process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
  );
} else if (typeof window !== "undefined") {
  console.warn("EmailJS public key is not set. Email sending might not work.");
}

/**
 * Stores the JWT token in local storage.
 * @param {string} token - The JWT token.
 */
export const setAuthToken = (token) => {
  if (typeof window !== "undefined") {
    // Check if running in browser
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Retrieves the JWT token from local storage.
 * @returns {string | null} The JWT token or null if not found.
 */
export const getAuthToken = () => {
  if (typeof window !== "undefined") {
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
  if (typeof window === "undefined") {
    return null;
  }
  if (!token) {
    console.log("No token provided to decode.");
    removeAuthToken(); // Clear any stale data if token was somehow empty
    removeUserData();
    return null;
  }

  try {
    const decoded = jwtDecode(token);
    // The actual user identity is usually under the 'sub' claim in Flask-JWT-Extended
    // The 'sub' field itself contains the dictionary we passed (e.g., {'id': ..., 'full_name': ...})
    const identity = decoded.sub || decoded; // Use 'sub' if present, otherwise the whole decoded object

    const currentTime = Date.now() / 1000;

    if (decoded.exp < currentTime) {
      console.log("Token expired.");
      removeAuthToken();
      removeUserData();
      return null;
    }
    return identity; // Return the identity object which holds user data
  } catch (error) {
    console.error("Failed to decode token:", error);
    removeAuthToken();
    removeUserData();
    return null;
  }
};

/**
 * Stores the user data (e.g., full_name, email, interests) in local storage.
 * This is typically received from the login/signup API response.
 * @param {object} userData - The user object.
 */
export const setUserData = (userData) => {
  if (typeof window !== "undefined") {
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
  if (typeof window !== "undefined") {
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
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
};

/**
 * Removes the user data from local storage.
 */
export const removeUserData = () => {
  if (typeof window !== "undefined") {
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
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    // The 'user' object in data should now contain 'interests' and 'status'.
    if (response.ok && data.token && data.user) {
      return {
        success: true,
        user: data.user,
        token: data.token,
        message: "Login successful!",
      };
    } else {
      return {
        success: false,
        message:
          data.message || "Login failed: Invalid credentials or server error.",
      };
    }
  } catch (error) {
    console.error("Network error during login:", error);
    return { success: false, message: "Network error or server unavailable." };
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
    const response = await fetch(`${BACKEND_URL}/register`, {
      // Endpoint should be '/register' as per backend
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fullName, email, password }), // `fullName` matches backend expectation
    });
    const data = await response.json();
    // The 'user' object in data should now contain 'interests' (likely empty array initially) and 'status' ('pending').
    if (response.ok && data.token && data.user) {
      return {
        success: true,
        user: data.user,
        token: data.token,
        message: "Signup successful!",
      };
    } else {
      return {
        success: false,
        message: data.message || "Signup failed: Please try again.",
      };
    }
  } catch (error) {
    console.error("Network error during signup:", error);
    return { success: false, message: "Network error or server unavailable." };
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
        method: "POST", // Or 'DELETE', depending on your backend API design
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Send the token to be blacklisted
        },
      });
      if (!response.ok) {
        console.warn(
          "Backend logout (token blacklisting) failed:",
          await response.json()
        );
        backendLogoutSuccess = false;
      } else {
        console.log("Token successfully sent to backend for blacklisting.");
      }
    } catch (error) {
      console.error("Error contacting backend logout endpoint:", error);
      backendLogoutSuccess = false;
    }
  }
  // --- END OPTIONAL ---

  // Crucially, always clear client-side storage regardless of backend logout success
  removeAuthToken();
  removeUserData();
  console.log("User token and data removed from localStorage.");

  return {
    success: backendLogoutSuccess,
    message: backendLogoutSuccess
      ? "Logged out successfully."
      : "Logged out client-side, but backend logout failed.",
  };
};

/**
 * Generic API call with authentication.
 * @param {string} endpoint - The API endpoint relative to BACKEND_URL (e.g., '/dashboard').
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE).
 * @param {object} body - Request body for POST/PUT.
 * @returns {Promise<object>} Object with `success` boolean, `data` (if successful), or `message`/`status` (if failed).
 */
export const callApi = async (endpoint, method = "GET", body = null) => {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
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

    // --- NEW DEBUGGING PRINTS (Keep these for now) ---
    console.log(
      `DEBUG FE: API Response Status for ${endpoint}: ${response.status}`
    );
    // Note: response.headers can only be read once from a stream.
    // Convert to array for logging if you need to inspect them.
    console.log(
      `DEBUG FE: API Response Headers for ${endpoint}:`,
      Object.fromEntries(response.headers.entries())
    );
    const responseText = await response.text(); // Read as text first
    console.log(
      `DEBUG FE: API Response Raw Text for ${endpoint}:`,
      responseText
    );

    try {
      const data = JSON.parse(responseText); // Try parsing text as JSON
      console.log(`DEBUG FE: API Response Parsed JSON for ${endpoint}:`, data);
      // --- END NEW DEBUGGING PRINTS ---

      if (!response.ok) {
        if (response.status === 401) {
          console.warn(
            `API call to ${endpoint} received 401 Unauthorized. Token might be expired.`
          );
        }
        return {
          success: false,
          status: response.status,
          message: data.message || `API error: ${response.status}`,
        };
      }

      return { success: true, data };
    } catch (jsonError) {
      console.error(`DEBUG FE: JSON parsing error for ${endpoint}:`, jsonError);
      console.error(
        `DEBUG FE: Raw response text that caused JSON error:`,
        responseText
      );
      return { success: false, message: "Server response was not valid JSON." };
    }
  } catch (networkError) {
    console.error(`DEBUG FE: Network error calling ${endpoint}:`, networkError);
    return { success: false, message: "Network error or server unavailable." };
  }
};

/**
 * Updates a user's interests on the backend.
 * @param {string} userId - The ID of the user to update.
 * @param {string[]} interests - An array of strings representing the user's interests.
 * @returns {Promise<object>} Response data from the API.
 */
export const updateUserInterests = async (userId, interests) => {
  const token = getAuthToken(); // Use the getAuthToken helper for consistency
  if (!token) {
    return { success: false, message: "Authentication token missing." };
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/users/${userId}/interests`, // Corrected template literal for URL
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ interests }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      // Backend now returns error details if any
      return {
        success: false,
        message: data.message || "Failed to update interests.",
        status: response.status,
      };
    }
    return {
      success: true,
      message: data.message || "Interests updated successfully.",
      user: data.user, // The backend now returns the updated user object
      token: data.token, // Ensure the new token is also returned
    };
  } catch (error) {
    console.error("Error updating interests:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
    };
  }
};

/**
 * Fetches all users from the backend (admin only).
 * @returns {Promise<object>} Object with `success` boolean and `users` array (if successful).
 */
export const fetchAllUsers = async () => {
  const result = await callApi("/admin/users", "GET");
  if (result.success) {
    return { success: true, users: result.data.users };
  } else {
    return {
      success: false,
      message: result.message || "Failed to fetch users.",
    };
  }
};

/**
 * Updates a user's role and status on the backend (admin only).
 * @param {string} userId - The ID of the user to update.
 * @param {string} role - The new role (e.g., 'Regular User', 'Mentor', 'Admin').
 * @param {string} status - The new status (e.g., 'pending', 'active', 'inactive').
 * @returns {Promise<object>} Object with `success` boolean, `user` (if successful), or `message`.
 */
export const updateUserRoleStatus = async (userId, role, status) => {
  const token = getAuthToken();
  if (!token) {
    return { success: false, message: "Authentication token missing." };
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/admin/users/${userId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role, status }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to update user role/status.",
        status: response.status,
      };
    }
    return {
      success: true,
      message: data.message || "User role and status updated successfully.",
      user: data.user, // Backend returns the updated user object
      token: data.token, // Return the new token here
    };
  } catch (error) {
    console.error("Error updating user role/status:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
    };
  }
};

/**
 * Submits the contact form data to the backend AND sends email via EmailJS (frontend).
 * @param {object} formData - Object containing name, email, subject, message.
 * @returns {Promise<object>} Object with `success` boolean or `message`.
 */
export const submitContactForm = async (formData) => {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_CONTACT_US_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY; // Used in emailjs.init

  if (!serviceId || !templateId || !publicKey) {
    console.error(
      "EmailJS environment variables (service ID, template ID, or public key) are not set."
    );
    return {
      success: false,
      message:
        "Email service not configured properly. Please check environment variables.",
    };
  }

  try {
    // Step 1: Send data to your backend (for logging/storage, optional but good practice)
    console.log("Sending contact form data to backend...");
    const backendResponse = await fetch(`${BACKEND_URL}/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const backendData = await backendResponse.json();
    if (!backendResponse.ok) {
      console.error(
        "Backend failed to acknowledge contact form data:",
        backendData.message
      );
      // You might still try to send the email if backend acknowledged, but for robustness,
      // if backend fails, we assume something is wrong and stop.
      return {
        success: false,
        message: backendData.message || "Failed to submit form to server.",
      };
    }
    console.log("Backend acknowledged contact form data:", backendData.message);

    // Step 2: Send email via EmailJS from the frontend
    const emailParams = {
      from_name: formData.name,
      from_email: formData.email,
      subject: formData.subject,
      message: formData.message,
      to_name: "mAIple Support Team", // Matches what was expected in backend's old `template_params`
      title: "New Contact Message", // Matches what was expected in backend's old `template_params`
    };

    console.log("Attempting to send email via EmailJS from frontend...");
    // The fourth argument to emailjs.send is the user ID (public key), which was set in emailjs.init
    const emailJsResponse = await emailjs.send(
      serviceId,
      templateId,
      emailParams
    );
    console.log("EmailJS raw response:", emailJsResponse);

    if (emailJsResponse.status === 200) {
      console.log("Email successfully sent via EmailJS!");
      return {
        success: true,
        message: "Your message has been sent successfully!",
      };
    } else {
      console.error("EmailJS sending failed:", emailJsResponse.text);
      return {
        success: false,
        message: emailJsResponse.text || "Failed to send email via EmailJS.",
      };
    }
  } catch (error) {
    console.error(
      "Error during contact form submission or email sending:",
      error
    );
    return {
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    };
  }
};

// --- NEW API CALLS FOR MENTORS AND TEAMS ---

/**
 * Fetches mentors from the backend with optional search and skill filters.
 * @param {string} searchTerm
 * @param {string} skill
 * @returns {Promise<object>} Object with `success` boolean and `mentors` array.
 */
export const fetchMentors = async (searchTerm = "", skill = "") => {
  const queryParams = new URLSearchParams();
  if (searchTerm) queryParams.append("search", searchTerm);
  if (skill) queryParams.append("skill", skill);

  const endpoint = `/mentors?${queryParams.toString()}`;
  const result = await callApi(endpoint, "GET");

  if (result.success) {
    return { success: true, mentors: result.data.mentors };
  } else {
    return {
      success: false,
      message: result.message || "Failed to fetch mentors.",
    };
  }
};

/**
 * Sends a connection request to a mentor.
 * @param {string} mentorId
 * @returns {Promise<object>} Object with `success` boolean and `message`.
 */
export const connectWithMentor = async (mentorId) => {
  const result = await callApi(`/mentors/${mentorId}/connect`, "POST");
  return result; // result already contains success/message
};

/**
 * Fetches teams from the backend with optional search and category filters.
 * @param {string} searchTerm
 * @param {string} category
 * @returns {Promise<object>} Object with `success` boolean and `teams` array.
 */
export const fetchTeams = async (searchTerm = "", category = "") => {
  const queryParams = new URLSearchParams();
  if (searchTerm) queryParams.append("search", searchTerm);
  if (category) queryParams.append("category", category);

  const endpoint = `/teams?${queryParams.toString()}`;
  const result = await callApi(endpoint, "GET");

  if (result.success) {
    return { success: true, teams: result.data.teams };
  } else {
    return {
      success: false,
      message: result.message || "Failed to fetch teams.",
    };
  }
};

/**
 * Creates a new team on the backend.
 * @param {object} teamData - Team details (name, description, category, maxMembers, skillsNeeded).
 * @returns {Promise<object>} Object with `success` boolean, `team` object, `user` object, and `token`.
 */
export const createTeam = async (teamData) => {
  const result = await callApi("/teams", "POST", teamData);
  return result; // result will contain success, message, team, user, and token
};

/**
 * Sends a request to join a team.
 * @param {string} teamId
 * @returns {Promise<object>} Object with `success` boolean, `message`, `user` object, and `token`.
 */
export const joinTeam = async (teamId) => {
  const result = await callApi(`/teams/${teamId}/join`, "POST");
  return result; // result will contain success, message, user, and token
};

/**
 * Sends a request to leave a team.
 * @param {string} teamId
 * @returns {Promise<object>} Object with `success` boolean, `message`, `user` object, and `token`.
 */
export const leaveTeam = async (teamId) => {
  const result = await callApi(`/teams/${teamId}/leave`, "POST");
  return result; // result will contain success, message, user, and token
};

/**
 * Sends a request to disband a team (only for team leader).
 * @param {string} teamId
 * @returns {Promise<object>} Object with `success` boolean, `message`, `user` object, and `token`.
 */
export const disbandTeam = async (teamId) => {
  const result = await callApi(`/teams/${teamId}/disband`, "DELETE");
  return result; // result will contain success, message, user, and token
};
z