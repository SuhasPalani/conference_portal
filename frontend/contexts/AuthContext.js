// contexts/AuthContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getAuthToken,
  decodeToken,
  removeAuthToken,
  removeUserData,
  logoutUser as apiLogoutUser, // The function that clears localStorage and hits backend if needed
  getUserData,
  setUserData,
  setAuthToken,
} from "../lib/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // user will be null if not logged in, or an object { ..., token: '...' } if logged in
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // True initially while checking auth status

  // Derive isLoggedIn from user existence
  const isLoggedIn = !!user;

  // Function to clear local storage and reset state locally
  const clearAuthAndState = useCallback(() => {
    removeAuthToken();
    removeUserData();
    setUser(null);
    // setIsLoggedIn(false); // Derived, no need to set directly
  }, []);

  // Function to check authentication status on component mount/reload
  const checkAuthStatus = useCallback(async () => {
    // Made async for potential async apiLogoutUser
    setLoadingAuth(true);
    const token = getAuthToken();
    const storedUserData = getUserData(); // This should be the parsed user object from localStorage

    if (token && storedUserData) {
      const decodedToken = decodeToken(token); // This should return null if invalid/expired
      if (decodedToken) {
        // If both token is valid AND user data exists, set user and logged in status
        setUser({ ...storedUserData, token }); // Ensure the token is part of the user object in state
      } else {
        // Token is present but invalid/expired, so log out
        console.warn("Token present but invalid/expired. Logging out.");
        await apiLogoutUser(); // Ensure local storage is cleared through consolidated logout
        clearAuthAndState(); // Clear local state after async operation
      }
    } else {
      // No token or user data found, ensure a clean state
      console.log("No token or user data found. Ensuring clean state.");
      clearAuthAndState(); // Always ensure clean state if token/data is missing
    }
    setLoadingAuth(false); // Auth status check is complete
  }, [clearAuthAndState]); // checkAuthStatus depends on clearAuthAndState

  useEffect(() => {
    checkAuthStatus();
    // No need for window.addEventListener('storage') for now, as it might complicate initial debugging
    // You can add it back later for multi-tab sync if necessary.
  }, [checkAuthStatus]); // Run once on mount and when checkAuthStatus memoized function changes

  // Function to handle login (called from login page)
  const login = useCallback((userData, token) => {
    // Save to localStorage immediately
    setAuthToken(token);
    setUserData(userData);
    // Update React state
    setUser({ ...userData, token }); // Store the token with the user object in state
    setLoadingAuth(false); // Ensure loading is false after login
  }, []);

  // Function to handle logout (called from any component)
  const logout = useCallback(async () => {
    await apiLogoutUser(); // Call the API logout and clear localStorage
    clearAuthAndState(); // Reset local state
  }, [apiLogoutUser, clearAuthAndState]); // Depends on apiLogoutUser and clearAuthAndState

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, login, logout, loadingAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
