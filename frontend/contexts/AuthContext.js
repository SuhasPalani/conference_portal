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
      console.log("🐛 DEBUG: Full decoded token:", decoded);

      if (decoded) {
        // Construct the user object from the decoded token payload (sub contains the identity dict)
        const userObj = {   
          id: decoded.sub?.id || decoded.id, // Prefer sub.id, fallback to id
          fullName:
            decoded.sub?.full_name || decoded.full_name || decoded.fullName,
          email: decoded.sub?.email || decoded.email,
          provider: decoded.sub?.provider || decoded.provider,
          role: decoded.sub?.role || decoded.role,
          interests: decoded.sub?.interests || decoded.interests || [],
          status: decoded.sub?.status || decoded.status || "pending", // Ensure status is pulled from token
        };

        console.log("🐛 DEBUG: Final userObj being set:", userObj);

        setUserData(userObj); // Save the full user object to local storage
        setUser({ ...userObj, token }); // Set user in state, including the token
        setAuthToken(token); // Save the token itself to local storage
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
  // Useful when a user's data (like interests, role, status) changes without a full re-login
  const updateUserContext = useCallback((newUserData) => {
    setUser((prevUser) => {
      const updatedUser = { ...prevUser, ...newUserData };
      setUserData(updatedUser); // Update user data in local storage
      // If a new token is part of newUserData, update it in local storage
      if (newUserData.token && newUserData.token !== prevUser?.token) {
        setAuthToken(newUserData.token);
      }
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
      const { token, error } = router.query;

      if (error) {
        console.error("OAuth Error:", error);
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("error");
        router.replace(cleanUrl.pathname, undefined, { shallow: true });
        return;
      }

      if (token) {
        console.log("Processing OAuth redirect with token...");
        login(token); // Pass ONLY the token to the context login function

        // Clean up the URL by removing all OAuth-related query parameters
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("token");
        cleanUrl.searchParams.delete("fullName");
        cleanUrl.searchParams.delete("email");
        cleanUrl.searchParams.delete("provider");
        router.replace(cleanUrl.pathname, undefined, { shallow: true }); // Use replace to avoid browser history issues

        // Redirect to dashboard after successful OAuth login
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
      }} // ADDED updateUserContext
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
