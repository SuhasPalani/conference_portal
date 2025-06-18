// pages/login.js
import React, { useState, useEffect } from "react"; 
import { useRouter } from "next/router";
import AuthForm from "../components/AuthForm";
import { loginUser } from "../lib/auth"; 
import { useAuth } from "../contexts/AuthContext";
import Head from "next/head";
import Link from "next/link";

const LoginPage = () => {
  const router = useRouter();
  const { isLoggedIn, login: contextLogin, loadingAuth } = useAuth(); 
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");


  useEffect(() => {
    if (!loadingAuth && isLoggedIn) {
      router.push("/dashboard");
    }
  }, [isLoggedIn, loadingAuth, router]);

  const handleLogin = async ({ email, password }) => {
    setIsLoading(true);
    setMessage("");
    setMessageType("info");

    try {
      // Call your API login function from lib/auth
      const result = await loginUser(email, password); 

      if (result.success) {
        
        contextLogin(result.user, result.token); 

        setMessage("Logged in successfully! Redirecting...");
        setMessageType("success");
        
      } else {
        setMessage(
          result.message || "Login failed. Please check your credentials."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("An error occurred during login. Please try again later.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  // If auth state is still loading, show nothing or a loading spinner to prevent flicker
  if (loadingAuth) {
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
        <span className="ml-4 text-xl">Loading session...</span>
      </div>
    );
  }

  // Only render the login form if not logged in and not loading
  if (isLoggedIn) {
    return null; 
  }

  return (
    <>
      <Head>
        <title>Login - mAIple Conference Portal</title>
        <meta
          name="description"
          content="Log in to your mAIple AI Conference account."
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

      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 text-white font-inter flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Header/Logo (consistent with index.js) */}
        <header className="absolute top-0 left-0 w-full py-6 px-8 lg:px-20 flex justify-between items-center z-20 animate-fade-in-down">
          <Link
            href="/"
            className="text-4xl lg:text-5xl font-extrabold text-white tracking-wider font-montserrat drop-shadow-md"
          >
            mAIple
          </Link>
         
          <Link
            href="/"
            className="text-gray-300 hover:text-white transition duration-300 transform hover:scale-105 text-lg font-semibold"
          >
            Back to Home
          </Link>
        </header>

        {/* Content Area with background shapes */}
        <div className="relative w-full max-w-md mx-auto z-10 p-8 rounded-xl shadow-2xl bg-gray-900 bg-opacity-70 backdrop-filter backdrop-blur-lg border border-gray-800 animate-fade-in-up">
          {/* Background shapes - subtle, could be more or less complex */}
          <div className="absolute inset-0 z-0 opacity-15 overflow-hidden rounded-xl">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
            >
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="url(#gradPurple)"
                className="animate-float-1"
              ></circle>
              <circle
                cx="90"
                cy="90"
                r="12"
                fill="url(#gradBlue)"
                className="animate-float-2"
              ></circle>
              <rect
                x="30"
                y="70"
                width="10"
                height="10"
                rx="2"
                fill="url(#gradPink)"
                className="animate-float-3"
              ></rect>
              <polygon
                points="50,10 60,30 40,30"
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
          {/* AuthForm component */}
          <AuthForm
            type="login"
            onSubmit={handleLogin}
            isLoading={isLoading}
            message={message}
            messageType={messageType}
          />
        </div>
      </div>
    </>
  );
};

export default LoginPage;
