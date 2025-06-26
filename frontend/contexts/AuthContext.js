// frontend/contexts/AuthContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/router";
import {
  getAuthToken,
  decodeToken, // This is crucial for consistent user data
  removeAuthToken,
  removeUserData,
  logoutUser as apiLogoutUser, // Renamed to avoid conflict with context's logout
  setUserData, // Keep setUserData for consistency with local storage
  setAuthToken, // Keep setAuthToken for consistency with local storage
} from "../lib/auth"; // Assuming decodeToken, setUserData, setAuthToken are in lib/auth.js

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const isLoggedIn = !!user;

  // Helper to clear local storage and reset user state
  const clearAuthAndState = useCallback(() => {
    removeAuthToken();
    removeUserData();
    setUser(null);
  }, []);

  // Centralized function to set user state from a decoded JWT payload
  // This function is now responsible for getting ALL user data from the token
  const setAuthUserFromToken = useCallback(
    (token) => {
      const decoded = decodeToken(token);
      console.log("🐛 DEBUG: Full decoded token:", decoded); // This line is already there, make sure it's active!

      if (decoded) {
        const userObj = {
          id: decoded.id || decoded.sub?.id,
          fullName:
            decoded.full_name || decoded.sub?.full_name || decoded.fullName,
          email: decoded.email || decoded.sub?.email,
          provider: decoded.provider || decoded.sub?.provider,
          role: decoded.role || decoded.sub?.role, // <--- This is the key line
          interests: decoded.interests || [],
        };

        console.log("🐛 DEBUG: Final userObj being set:", userObj); // <-- ADD/ENSURE THIS LINE

        setUserData(userObj);
        setUser({ ...userObj, token });
        setAuthToken(token);
        return true;
      } else {
        console.error("Decoded token invalid.");
        clearAuthAndState();
        return false;
      }
    },
    [clearAuthAndState]
  );

  // Function to perform login and update context state
  // This now accepts only the token, as all user data is derived from it.
  const login = useCallback(
    (token) => {
      // <--- CHANGE IS HERE: ONLY 'token' parameter
      setLoadingAuth(true); // Indicate loading while processing login
      const success = setAuthUserFromToken(token); // Use the centralized function
      if (success) {
        console.log("AuthContext: User logged in successfully.");
      } else {
        console.error("AuthContext: Login failed due to invalid token.");
        // Optionally, you could handle UI feedback here for failed logins
      }
      setLoadingAuth(false); // Finish loading
    },
    [setAuthUserFromToken]
  ); // Dependency for useCallback

  // Function to perform logout (client-side and optionally backend)
  const logout = useCallback(async () => {
    const result = await apiLogoutUser(); // Call the API logout function (e.g., to blacklist token)
    if (!result.success) {
      console.error("Logout error:", result.message);
      // You might want to display an error to the user here
    }
    clearAuthAndState(); // Always clear client-side state regardless of API result
    router.push("/login"); // Redirect to login page after logout
  }, [apiLogoutUser, clearAuthAndState, router]); // Dependencies for useCallback

  // New function to update the user object in context directly
  // Useful when a user's data (like interests) changes without a full re-login
  const updateUserContext = useCallback((newUserData) => {
    setUser((prevUser) => {
      const updatedUser = { ...prevUser, ...newUserData };
      setUserData(updatedUser); // Also update user data in local storage
      return updatedUser;
    });
  }, []);

  // Effect to run checkAuthStatus once on component mount
  // This ensures the user is logged in if they have a valid token on page load
  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoadingAuth(true); // Start loading
      const token = getAuthToken(); // Retrieve stored token

      if (token) {
        // Attempt to set user data from the stored token
        const success = setAuthUserFromToken(token);
        if (!success) {
          // If setAuthUserFromToken failed (e.g., invalid token), clear state
          console.warn(
            "AuthContext: Token present but invalid/expired during startup. Clearing session."
          );
        }
      } else {
        console.log(
          "AuthContext: No token found during startup. Ensuring clean state."
        );
        clearAuthAndState(); // No token, so ensure state is clean
      }
      setLoadingAuth(false); // Finish loading
    };
    checkAuthStatus();
  }, [clearAuthAndState, setAuthUserFromToken]); // Dependencies for useCallback

  // Effect to handle OAuth redirects: extracts token from URL and logs in
  useEffect(() => {
    const handleOAuthRedirect = () => {
      // Extract only the token and error from the URL query parameters
      // fullName, email, provider are no longer needed here as they come from the token payload
      const { token, error } = router.query;

      if (error) {
        console.error("OAuth Error:", error);
        // Clean up the URL to remove the error parameter
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("error");
        router.replace(cleanUrl.pathname, undefined, { shallow: true });
        return; // Stop execution if there's an error
      }

      if (token) {
        console.log("Processing OAuth redirect with token...");
        login(token); // <--- CHANGE IS HERE: Pass ONLY the token to the context login function

        // Clean up the URL by removing all OAuth-related query parameters
        // These are legacy params from the backend redirect; we no longer use them for state
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("token");
        cleanUrl.searchParams.delete("fullName");
        cleanUrl.searchParams.delete("email");
        cleanUrl.searchParams.delete("provider");
        router.replace(cleanUrl.pathname, undefined, { shallow: true }); // Use replace to avoid browser history issues

        // Redirect to dashboard after successful OAuth login
        // A small delay can help ensure state updates are fully processed before redirect
        setTimeout(() => {
          router.push("/dashboard");
        }, 100);
      }
    };

    // Only run this effect if router is ready, user is not already logged in,
    // and auth state is not currently being loaded (to prevent race conditions/flicker)
    if (router.isReady && !isLoggedIn && !loadingAuth) {
      handleOAuthRedirect();
    }
  }, [router, login, isLoggedIn, loadingAuth]); // Dependencies for useEffect

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        login,
        logout,
        loadingAuth,
        updateUserContext,
      }} // <--- ADDED updateUserContext
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
