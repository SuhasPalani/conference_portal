// frontend/components/Notification.js
import React, { useState, useEffect } from "react";

const Notification = ({
  message,
  messageType,
  isLoading, // This isLoading now refers to a loading state related to the message itself
}) => {
  // We'll use local state to control the visibility of the notification
  // It will appear when a message is provided and disappear after a timeout.
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer;
    if (message) {
      setIsVisible(true);
      // Automatically hide the notification after 5 seconds, unless it's a loading state
      if (!isLoading) {
        timer = setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      }
    } else {
      setIsVisible(false); // Hide if message is empty
    }
    return () => clearTimeout(timer); // Clean up the timer
  }, [message, isLoading]); // Re-run effect when the message or isLoading changes

  // Only render if a message is present OR it's loading, AND it's set to be visible
  if (!message && !isLoading && !isVisible) return null;

  const bgColor =
    messageType === "success"
      ? "bg-green-600"
      : messageType === "error"
      ? "bg-red-600"
      : "bg-blue-600"; // Default for info or general messages

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl text-white z-50 max-w-sm transition-all duration-300 transform ${bgColor}
        ${
          isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
    >
      <div className="flex items-center">
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
        )}
        <p className="text-lg font-medium">{message}</p>
      </div>
    </div>
  );
};

export default Notification;
