// frontend/components/InterestsForm.js
import React, { useState, useEffect } from "react";
import { updateUserInterests } from "../lib/auth"; // Import the API call
import { useAuth } from "../contexts/AuthContext"; // To update user context and get user ID
import Notification from "./Notification"; // Import the Notification component

const allInterests = [
  "Machine Learning",
  "Deep Learning",
  "Natural Language Processing",
  "Computer Vision",
  "Robotics",
  "AI Ethics",
  "Reinforcement Learning",
  "Generative AI",
  "Data Science",
  "Neural Networks",
  "Computer Graphics",
  "Big Data",
  "Cloud Computing",
  "Cybersecurity",
  "Biometrics",
  "Quantum Computing",
  "Edge Computing",
  "Virtual Reality",
  "Augmented Reality",
];

const InterestsForm = ({ onInterestsUpdated }) => {
  // Add onInterestsUpdated prop
  const { user, updateUserContext } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationMessageType, setNotificationMessageType] =
    useState("info");
  const [notificationLoading, setNotificationLoading] = useState(false);

  // Initialize selected interests from user context when component mounts or user changes
  useEffect(() => {
    if (user && user.interests) {
      setSelectedInterests(user.interests);
    }
  }, [user]);

  const handleCheckboxChange = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) {
      setNotificationMessage("User not logged in or ID missing.");
      setNotificationMessageType("error");
      return;
    }

    if (selectedInterests.length === 0) {
      setNotificationMessage("Please select at least one interest.");
      setNotificationMessageType("error");
      return;
    }

    setNotificationLoading(true);
    setNotificationMessage("Updating interests...");
    setNotificationMessageType("info");

    const result = await updateUserInterests(user.id, selectedInterests);

    if (result.success) {
      setNotificationMessage(result.message);
      setNotificationMessageType("success");
      // Update the user context immediately after successful update
      updateUserContext({ interests: selectedInterests });
      if (onInterestsUpdated) {
        onInterestsUpdated(); // Call callback to notify parent of update
      }
    } else {
      setNotificationMessage(result.message);
      setNotificationMessageType("error");
    }
    setNotificationLoading(false);
  };

  return (
    <div className="bg-gray-800 bg-opacity-70 p-8 rounded-lg shadow-xl mx-auto border border-gray-700 animate-fade-in-up">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">
        {user?.interests && user.interests.length > 0
          ? "Update Your Interests"
          : "Tell us your interests!"}
      </h2>
      <p className="text-gray-300 text-center mb-8">
        {user?.interests && user.interests.length > 0
          ? "Modify your preferred AI topics."
          : "Select topics that interest you to personalize your conference experience."}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {allInterests.map((interest) => (
            <label
              key={interest}
              className="flex items-center space-x-3 bg-gray-700 hover:bg-gray-600 rounded-md p-3 cursor-pointer transition duration-200 ease-in-out"
            >
              <input
                type="checkbox"
                checked={selectedInterests.includes(interest)}
                onChange={() => handleCheckboxChange(interest)}
                className="form-checkbox h-5 w-5 text-purple-600 rounded focus:ring-purple-500 transition duration-150 ease-in-out"
              />
              <span className="text-gray-200 text-lg">{interest}</span>
            </label>
          ))}
        </div>

        <div className="text-center">
          <button
            type="submit"
            disabled={notificationLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {notificationLoading ? "Saving..." : "Save Interests"}
          </button>
        </div>
      </form>

      <Notification
        message={notificationMessage}
        messageType={notificationMessageType}
        isLoading={notificationLoading}
      />
    </div>
  );
};

export default InterestsForm;
