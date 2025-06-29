import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext"; // Adjust path as needed
import Head from "next/head";
import { useRouter } from "next/router"; // Import useRouter for navigation

const FindMentorsPage = () => {
  const { user, isLoggedIn, loadingAuth } = useAuth();
  const router = useRouter();

  // State for Mentors
  const [mentors, setMentors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch Mentors Logic ---
  const fetchMentors = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = user?.token;
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams();
      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }
      if (skillFilter) {
        queryParams.append("skill", skillFilter);
      }

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL
        }/mentors?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMentors(result.mentors);
      } else {
        setError(result.message || "Failed to fetch mentors.");
      }
    } catch (err) {
      console.error("Error fetching mentors:", err);
      setError("An unexpected error occurred while fetching mentors.");
    } finally {
      setLoading(false);
    }
  };

  // --- Connect with Mentor Logic ---
  const handleConnectWithMentor = async (mentorId) => {
    if (!user) {
      alert("You must be logged in to connect with a mentor.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/mentors/${mentorId}/connect`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      const result = await response.json();
      if (response.ok) {
        alert(result.message || "Connection request sent successfully!");
      } else {
        alert(result.message || "Failed to send connection request.");
      }
    } catch (err) {
      console.error("Error connecting with mentor:", err);
      alert("An error occurred while trying to connect with the mentor.");
    }
  };

  // --- Contact Mentor via Email ---
  const handleContactMentor = (mentor) => {
    const subject = encodeURIComponent(
      "Mentorship Request - Conference Portal"
    );
    const body = encodeURIComponent(
      `Hi ${
        mentor.full_name
      },\n\nI found your profile on the Conference Portal and would like to discuss potential mentorship opportunities.\n\nI'm particularly interested in your expertise in: ${
        mentor.skills ? mentor.skills.join(", ") : "your field"
      }\n\nBest regards,\n${user.full_name}`
    );
    window.location.href = `mailto:${mentor.email}?subject=${subject}&body=${body}`;
  };

  // --- Effects to trigger fetches based on search terms ---
  useEffect(() => {
    if (!loadingAuth && isLoggedIn) {
      fetchMentors();
    } else if (!loadingAuth && !isLoggedIn) {
      setError("Please log in to view mentors.");
      setLoading(false);
    }
  }, [isLoggedIn, loadingAuth, searchTerm, skillFilter]);

  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        Loading authentication...
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-yellow-400">
        You need to be logged in to access mentor features.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-inter">
      <Head>
        <title>Find Mentors - Conference Portal</title>
      </Head>
      <div className="container mx-auto bg-gray-800 p-6 rounded-lg shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.back()}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition duration-200 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-montserrat font-extrabold text-purple-400 text-center flex-grow">
            Find Mentors
          </h1>
          <div className="w-20"></div> {/* Spacer for alignment */}
        </div>

        <div className="animate-fade-in-down">
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">
            Connect with Expert Mentors
          </h2>
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by name, expertise, or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow p-3 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
            />
            <input
              type="text"
              placeholder="Filter by specific skill..."
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="p-3 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
            />
            <button
              onClick={fetchMentors}
              className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-200"
            >
              Search
            </button>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 p-8">
              <div className="animate-pulse">
                <div className="text-lg mb-2">Searching for mentors...</div>
                <div className="text-sm">Finding expert mentors for you</div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center text-red-400 p-8">
              <p className="text-lg font-semibold mb-2">Error</p>
              <p>{error}</p>
            </div>
          ) : mentors.length === 0 ? (
            <div className="text-center text-gray-400 p-8">
              <p className="text-lg mb-2">No mentors found.</p>
              <p className="text-sm">
                Try adjusting your search terms or check back later as more
                mentors join.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className="bg-gray-700 p-6 rounded-lg shadow-lg border border-gray-600 mentor-card animate-fade-in-up"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-xl">
                        {mentor.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-purple-300">
                        {mentor.full_name}
                      </h3>
                      <p className="text-gray-400 text-sm">{mentor.email}</p>
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-700 text-green-100 mt-1">
                        {mentor.role}
                      </span>
                    </div>
                  </div>

                  {/* Bio/Description */}
                  {mentor.bio && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-300 mb-1">About:</h4>
                      <p className="text-gray-400 text-sm">{mentor.bio}</p>
                    </div>
                  )}

                  {/* Company/Organization */}
                  {mentor.company && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-300 mb-1">
                        Organization:
                      </h4>
                      <p className="text-gray-400 text-sm">{mentor.company}</p>
                    </div>
                  )}

                  {/* Years of Experience */}
                  {mentor.years_of_experience && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-300 mb-1">
                        Experience:
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {mentor.years_of_experience} years
                      </p>
                    </div>
                  )}

                  {/* Skills/Expertise */}
                  {mentor.skills && mentor.skills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-300 mb-2">
                        Expertise:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {mentor.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-800 text-blue-200 text-xs px-2.5 py-0.5 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specializations */}
                  {mentor.specializations &&
                    mentor.specializations.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-300 mb-2">
                          Specializations:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {mentor.specializations.map((spec, idx) => (
                            <span
                              key={idx}
                              className="bg-purple-800 text-purple-200 text-xs px-2.5 py-0.5 rounded-full"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* LinkedIn Profile */}
                  {mentor.linkedin_profile && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-300 mb-1">
                        LinkedIn:
                      </h4>
                      <a
                        href={mentor.linkedin_profile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm underline"
                      >
                        View Profile
                      </a>
                    </div>
                  )}

                  {/* Availability Status */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-300 mb-1">Status:</h4>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                        mentor.availability_status === "Available"
                          ? "bg-green-700 text-green-100"
                          : mentor.availability_status === "Limited"
                          ? "bg-yellow-700 text-yellow-100"
                          : "bg-red-700 text-red-100"
                      }`}
                    >
                      {mentor.availability_status || "Available"}
                    </span>
                  </div>

                  {/* Mentorship Areas */}
                  {mentor.mentorship_areas &&
                    mentor.mentorship_areas.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-300 mb-2">
                          Mentorship Areas:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {mentor.mentorship_areas.map((area, idx) => (
                            <span
                              key={idx}
                              className="bg-green-800 text-green-200 text-xs px-2.5 py-0.5 rounded-full"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleContactMentor(mentor)}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-200"
                    >
                      Contact via Email
                    </button>
                    <button
                      onClick={() => handleConnectWithMentor(mentor.id)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
                    >
                      Send Connection
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindMentorsPage;
