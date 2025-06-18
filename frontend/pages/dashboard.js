// pages/dashboard.js
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import DashboardLayout from "../components/Layout/DashboardLayout";
import DashboardContent from "../components/DashboardContent";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const DashboardPage = () => {
  const router = useRouter();
  const { user, isLoggedIn, loadingAuth, logout } = useAuth(); // Destructure from useAuth

  const [conferenceInfo, setConferenceInfo] = useState(null);
  const [loadingData, setLoadingData] = useState(true); // Loading state for dashboard specific data
  const [error, setError] = useState("");

  useEffect(() => {
    // If AuthContext is still loading, do nothing yet
    if (loadingAuth) {
      return;
    }

    // If AuthContext says not logged in after initial check, redirect
    if (!isLoggedIn) {
      console.log("Not logged in (AuthContext says so), redirecting to login.");
      router.replace("/login"); // Use replace to prevent going back to dashboard via back button
      return;
    }

    // If logged in, fetch dashboard-specific data
    const fetchDashboardData = async () => {
      setLoadingData(true); // Start loading dashboard specific data
      setError(""); // Clear previous errors

      try {
        // Ensure user object and user.token are present before making API call
        if (!user || !user.token) {
          console.error(
            "User or token missing in AuthContext, initiating logout."
          );
          logout(); // Use the logout from context
          router.replace("/");
          return;
        }

        const response = await fetch(`${BACKEND_URL}/dashboard`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`, // Get token from the user object in context
          },
        });

        if (response.ok) {
          const data = await response.json();
          setConferenceInfo(data.conferenceInfo);
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Failed to fetch dashboard data.");
          if (response.status === 401 || response.status === 403) {
            console.log(
              "401/403 Unauthorized for dashboard data, clearing token and redirecting."
            );
            logout(); // Call the consolidated logout function from context
            router.replace("/");
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Network error or server unavailable.");
      } finally {
        setLoadingData(false); // Done loading dashboard specific data
      }
    };

    fetchDashboardData();
  }, [isLoggedIn, loadingAuth, router, user, logout]); // Dependencies updated

  // --- Conditional Rendering for DashboardPage ---

  if (loadingAuth) {
    return <LoadingSpinner message="Verifying authentication..." />;
  }

  if (!isLoggedIn) {
    return null; // Redirect is handled by useEffect
  }

  if (loadingData) {
    return <LoadingSpinner message="Loading your dashboard data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!user || !conferenceInfo) {
    return (
      <ErrorMessage
        message="No dashboard data available. Please try logging in again."
        redirectToLogin={true}
      />
    );
  }

  // If all checks pass, render the main dashboard content within the layout
  return (
    <DashboardLayout
      title="Dashboard - mAIple Conference Portal"
      description="Your personal mAIple AI Conference dashboard."
    >
      <DashboardContent user={user} conferenceInfo={conferenceInfo} />
    </DashboardLayout>
  );
};

export default DashboardPage;
