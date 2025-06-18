import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAuthToken, decodeToken, logoutUser } from "../lib/auth"; // Import logoutUser
import Head from "next/head";
import Link from "next/link";
import Alert from "../components/Alert";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const DashboardPage = () => {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [conferenceInfo, setConferenceInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = getAuthToken(); // This now correctly uses 'token'
      if (!token) {
        console.log("No token found, redirecting to login.");
        router.push("/login");
        return;
      }

      const decoded = decodeToken(token);
      // Ensure 'sub' is present and not an error string from backend's decode_auth_token
      if (!decoded || !decoded.sub || typeof decoded === 'string') { // Added typeof decoded === 'string' check
        console.log("Invalid or expired token, clearing and redirecting.");
        localStorage.removeItem("token"); // Correctly removes 'token'
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/dashboard`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
          setConferenceInfo(data.conferenceInfo);
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Failed to fetch dashboard data.");
          if (response.status === 401) {
            console.log("401 Unauthorized, clearing token and redirecting.");
            localStorage.removeItem("token"); // Correctly removes 'token'
            router.push("/login");
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Network error or server unavailable.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleLogout = async () => { // Make this async
    await logoutUser(); // This will now correctly remove 'token' from localStorage
    console.log("Attempting to redirect after logout...");
    router.push("/login"); // This should now redirect the user
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center text-white font-inter">
        <svg
          className="animate-spin h-10 w-10 text-purple-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span className="ml-4 text-xl">Loading your dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex flex-col items-center justify-center text-white font-inter">
        <Alert message={error} type="error" />
        <button
          onClick={() => router.push("/login")}
          className="mt-6 px-6 py-3 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 transition duration-300 transform hover:scale-105 shadow-lg"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (!userData || !conferenceInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center text-gray-400 font-inter">
        <p className="text-xl">
          No dashboard data available. Please try logging in again.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="ml-6 px-6 py-3 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 transition duration-300 transform hover:scale-105 shadow-lg"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - mAIple Conference Portal</title>
        <meta
          name="description"
          content="Your personal mAIple AI Conference dashboard."
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 text-white font-inter flex flex-col overflow-x-hidden">
        {/* Header/Branding and Navigation */}
        <header className="w-full py-6 px-8 lg:px-20 flex justify-between items-center z-20 relative animate-fade-in-down">
          <Link
            href="/"
            className="text-4xl lg:text-5xl font-extrabold text-white tracking-wider font-montserrat drop-shadow-md"
          >
            mAIple
          </Link>
          <nav>
            <ul className="flex items-center space-x-6 md:space-x-8 text-lg font-semibold">
              <li>
                <button
                  onClick={handleLogout}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-5 rounded-full transition duration-200 shadow-md transform hover:scale-105 text-lg"
                >
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </header>

        {/* Dashboard Content Section */}
        <main className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 relative">
          {/* Background shapes (consistent with hero/auth pages) */}
          <div className="absolute inset-0 z-0 opacity-15 overflow-hidden">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
            >
              <circle
                cx="15"
                cy="80"
                r="10"
                fill="url(#gradPurple)"
                className="animate-float-1"
              ></circle>
              <circle
                cx="85"
                cy="20"
                r="15"
                fill="url(#gradBlue)"
                className="animate-float-2"
              ></circle>
              <rect
                x="5"
                y="50"
                width="12"
                height="12"
                rx="3"
                fill="url(#gradPink)"
                className="animate-float-3"
              ></rect>
              <polygon
                points="70,90 80,70 60,70"
                fill="url(#gradGreen)"
                className="animate-float-4"
              ></polygon>
              <defs>
                <radialGradient
                  id="gradPurple"
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx="50%"
                  fy="50%"
                >
                  <stop offset="0%" stopColor="#A78BFA" />
                  <stop offset="100%" stopColor="#6D28D9" />
                </radialGradient>
                <radialGradient
                  id="gradBlue"
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx="50%"
                  fy="50%"
                >
                  <stop offset="0%" stopColor="#60A5FA" />
                  <stop offset="100%" stopColor="#2563EB" />
                </radialGradient>
                <radialGradient
                  id="gradPink"
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx="50%"
                  fy="50%"
                >
                  <stop offset="0%" stopColor="#F472B6" />
                  <stop offset="100%" stopColor="#BE185D" />
                </radialGradient>
                <radialGradient
                  id="gradGreen"
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx="50%"
                  fy="50%"
                >
                  <stop offset="0%" stopColor="#4ADE80" />
                  <stop offset="100%" stopColor="#16A34A" />
                </radialGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 w-full max-w-4xl bg-gray-900 bg-opacity-70 backdrop-filter backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-gray-800 animate-fade-in-up">
            <h1 className="text-5xl font-extrabold text-white mb-6 font-montserrat drop-shadow-lg">
              Welcome,{" "}
              <span className="text-purple-400">
                {userData.full_name.split(" ")[0]}
              </span>
              !
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              Here's your personalized overview for the mAIple AI Conference.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-xl shadow-lg border border-gray-700">
                <h2 className="text-2xl font-semibold text-white mb-3">
                  Your Profile
                </h2>
                <p className="text-lg text-gray-300 mb-2">
                  <span className="font-medium text-purple-300">Name:</span>{" "}
                  {userData.full_name}
                </p>
                <p className="text-lg text-gray-300 mb-2">
                  <span className="font-medium text-purple-300">Email:</span>{" "}
                  {userData.email}
                </p>
                <p className="text-lg text-gray-300">
                  <span className="font-medium text-purple-300">Role:</span>{" "}
                  {userData.role}
                </p>
              </div>

              <div className="bg-gray-800 bg-opacity-60 p-6 rounded-xl shadow-lg border border-gray-700">
                <h2 className="text-2xl font-semibold text-white mb-3">
                  Conference Status
                </h2>
                <p className="text-lg text-gray-300 mb-2">
                  <span className="font-medium text-purple-300">
                    Registration:
                  </span>{" "}
                  Confirmed
                </p>
                <p className="text-lg text-gray-300 mb-2">
                  <span className="font-medium text-purple-300">
                    Ticket Type:
                  </span>{" "}
                  Standard Pass
                </p>
                <p className="text-lg text-gray-300">
                  <span className="font-medium text-purple-300">Access:</span>{" "}
                  All Sessions & Workshops
                </p>
              </div>
            </div>

            <div className="bg-gray-800 bg-opacity-60 p-6 rounded-xl shadow-lg border border-gray-700">
              <h2 className="text-3xl font-bold text-white mb-4 font-montserrat">
                About the Conference
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed mb-4">
                <span className="font-medium text-purple-300">Title:</span>{" "}
                {conferenceInfo.title}
              </p>
              <p className="text-lg text-gray-300 mb-2">
                <span className="font-medium text-purple-300">Date:</span>{" "}
                {conferenceInfo.date}
              </p>
              <p className="text-lg text-gray-300 mb-2">
                <span className="font-medium text-purple-300">Location:</span>{" "}
                {conferenceInfo.location}
              </p>
              <p className="text-lg text-gray-300 leading-relaxed mb-4">
                <span className="font-medium text-purple-300">
                  Description:
                </span>{" "}
                {conferenceInfo.description}
              </p>

              <h3 className="text-2xl font-semibold text-white mb-3">
                Key Tracks:
              </h3>
              <ul className="list-disc list-inside text-gray-300 mb-4 pl-4">
                {conferenceInfo.tracks.map((track, index) => (
                  <li key={index} className="mb-1 text-lg">
                    {track}
                  </li>
                ))}
              </ul>

              <h3 className="text-2xl font-semibold text-white mb-3">
                Participation Timelines:
              </h3>
              <p className="text-lg text-gray-300 mb-4">
                {conferenceInfo.participationTimelines}
              </p>

              <p className="text-gray-500 text-sm italic mt-8">
                This dashboard provides read-only information for regular users.
                For administrative functions or role changes, please contact the
                portal administrator.
              </p>
            </div>
          </div>
        </main>

        {/* Footer (consistent with index.js) */}
        <footer className="py-12 px-8 lg:px-20 bg-gray-900 border-t border-b border-gray-800 text-center text-gray-400">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <p className="mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} mAIple Conference. All rights
              reserved.
            </p>
            <div className="flex space-x-6">
              <a
                href="mailto:info@maiple.com"
                className="text-purple-400 hover:text-white transition duration-300"
              >
                info@maiple.com
              </a>
              <a
                href="#"
                className="text-purple-400 hover:text-white transition duration-300"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-purple-400 hover:text-white transition duration-300"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default DashboardPage;
