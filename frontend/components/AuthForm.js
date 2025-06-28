// components/AuthForm.js
import React, { useState } from "react";
import Link from "next/link";

const AuthForm = ({ type, onSubmit, isLoading, message, messageType }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localMessage, setLocalMessage] = useState("");
  const [localMessageType, setLocalMessageType] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalMessage(""); // Clear local message on new submission

    if (type === "signup" && password !== confirmPassword) {
      setLocalMessage("Passwords do not match.");
      setLocalMessageType("error");
      return;
    }

    // Call the onSubmit prop from the parent page (signup.js or login.js)
    onSubmit({ fullName, email, password });
  };

  // Effect to sync messages from parent component
  React.useEffect(() => {
    if (message) {
      setLocalMessage(message);
      setLocalMessageType(messageType);
      // Clear message after some time if it's a success/error, but not loading
      if (messageType !== "info") {
        const timer = setTimeout(() => {
          setLocalMessage("");
        }, 5000); // Message disappears after 5 seconds
        return () => clearTimeout(timer);
      }
    }
  }, [message, messageType]);

  const isSignUp = type === "signup";
  const title = isSignUp ? "Create Your Account" : "Welcome Back";
  const buttonText = isSignUp
    ? isLoading
      ? "Signing Up..."
      : "Sign Up"
    : isLoading
    ? "Logging In..."
    : "Login";
  const switchText = isSignUp ? "Already have an account?" : "Need an account?";
  const switchLinkText = isSignUp ? "Login Here" : "Sign Up Here";
  const switchHref = isSignUp ? "/login" : "/signup";

  const getMessageClasses = (msgType) => {
    switch (msgType) {
      case "success":
        return "text-green-400 bg-green-900/20 border-green-500";
      case "error":
        return "text-red-400 bg-red-900/20 border-red-500";
      case "info":
        return "text-blue-400 bg-blue-900/20 border-blue-500";
      default:
        return "hidden"; // Hide if no message or unknown type
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center relative z-20">
      {" "}
      {/* Ensure content is above background shapes */}
      <h2 className="text-4xl font-bold text-white mb-6 font-montserrat drop-shadow-md animate-fade-in-down">
        {title}
      </h2>
      <p className="text-lg text-gray-300 mb-8 animate-fade-in delay-100">
        {isSignUp
          ? "Join mAIple today and unlock exclusive access to AI conference content."
          : "Access your conference portal."}
      </p>
      {(localMessage || isLoading) && (
        <div
          className={`p-4 mb-6 rounded-lg border text-sm ${getMessageClasses(
            localMessageType
          )} animate-fade-in`}
        >
          {localMessage}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {isSignUp && (
          <div>
            <label htmlFor="fullName" className="sr-only">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white transition duration-200 placeholder-gray-500 text-lg"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white transition duration-200 placeholder-gray-500 text-lg"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white transition duration-200 placeholder-gray-500 text-lg"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        {isSignUp && (
          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white transition duration-200 placeholder-gray-500 text-lg"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}

        <div>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-xl font-bold rounded-full shadow-lg text-white bg-purple-700 hover:bg-purple-800 transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl cursor-pointer ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900"
            disabled={isLoading}
          >
            {buttonText}
          </button>
        </div>
      </form>
      <div className="mt-8 text-center text-lg">
        <p className="text-gray-400">
          {switchText}{" "}
          <Link
            href={switchHref}
            className="font-semibold text-purple-400 hover:text-purple-300 hover:underline transition duration-200"
          >
            {switchLinkText}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
