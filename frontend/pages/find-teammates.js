import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext"; // Adjust path as needed
import Head from "next/head";
import { useRouter } from "next/router"; // Import useRouter for navigation

// Modal component for creating a team
const CreateTeamModal = ({ isOpen, onClose, onCreateTeam, isLoading }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [maxMembers, setMaxMembers] = useState(5); // Default to 5
  const [skillsNeeded, setSkillsNeeded] = useState(""); // Comma-separated string

  const handleSubmit = (e) => {
    e.preventDefault();
    const skillsArray = skillsNeeded
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean); // Split, trim, remove empty strings

    onCreateTeam({
      name,
      description,
      category,
      maxMembers: parseInt(maxMembers, 10),
      skillsNeeded: skillsArray,
    });
    // Reset form after submission attempt
    setName("");
    setDescription("");
    setCategory("");
    setMaxMembers(5);
    setSkillsNeeded("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 font-inter modal-overlay">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md modal-content animate-fade-in">
        <h2 className="text-2xl font-bold text-purple-400 mb-6 text-center">
          Create New Team
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
              Team Name:
            </label>
            <input
              type="text"
              id="name"
              className="shadow appearance-none border border-gray-600 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
              Description:
            </label>
            <textarea
              id="description"
              rows="3"
              className="shadow appearance-none border border-gray-600 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={isLoading}
            ></textarea>
          </div>
          <div className="mb-4">
            <label
              htmlFor="category"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
              Category:
            </label>
            <select
              id="category"
              className="shadow border border-gray-600 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={isLoading}
            >
              <option value="">Select a Category</option>
              <option value="Web Development">Web Development</option>
              <option value="Mobile Development">Mobile Development</option>
              <option value="Data Science">Data Science</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Game Development">Game Development</option>
              <option value="UI/UX Design">UI/UX Design</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="mb-4">
            <label
              htmlFor="maxMembers"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
              Max Members:
            </label>
            <input
              type="number"
              id="maxMembers"
              min="2"
              max="10"
              className="shadow appearance-none border border-gray-600 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="skillsNeeded"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
              Skills Needed (comma-separated):
            </label>
            <input
              type="text"
              id="skillsNeeded"
              className="shadow appearance-none border border-gray-600 rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
              value={skillsNeeded}
              onChange={(e) => setSkillsNeeded(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Team"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200"
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FindTeammatesPage = () => {
  // Renamed from FindTeamsPage for clarity
  const { user, isLoggedIn, loadingAuth, updateUserContext } = useAuth();
  const router = useRouter();
  const [currentView, setCurrentView] = useState("teams"); // 'teams' or 'teammates'

  // State for Teams
  const [teams, setTeams] = useState([]);
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [teamCategory, setTeamCategory] = useState("");
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // State for Teammates
  const [teammates, setTeammates] = useState([]);
  const [teammateSearchTerm, setTeammateSearchTerm] = useState("");
  const [teammateLoading, setTeammateLoading] = useState(true);
  const [teammateError, setTeammateError] = useState(null);

  // --- Fetch Teams Logic ---
  const fetchTeams = async () => {
    setTeamLoading(true);
    setTeamError(null);
    try {
      const token = user?.token;
      if (!token) {
        setTeamError("Authentication token not found. Please log in.");
        setTeamLoading(false);
        return;
      }

      const queryParams = new URLSearchParams();
      if (teamSearchTerm) {
        queryParams.append("search", teamSearchTerm);
      }
      if (teamCategory) {
        queryParams.append("category", teamCategory);
      }

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL
        }/teams?${queryParams.toString()}`,
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
        setTeams(result.data);
      } else {
        setTeamError(result.message || "Failed to fetch teams.");
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
      setTeamError("An unexpected error occurred while fetching teams.");
    } finally {
      setTeamLoading(false);
    }
  };

  // --- Fetch Teammates Logic ---
  const fetchTeammates = async () => {
    setTeammateLoading(true);
    setTeammateError(null);
    try {
      const token = user?.token;
      console.log("DEBUG: Teammate Fetch - Current user object:", user);
      if (!token) {
        setTeammateError("Authentication token not found. Please log in.");
        setTeammateLoading(false);
        return;
      }

      if (user?.role !== "Regular User") {
        setTeammateError(
          "Access Denied: Only 'Regular Users' can search for teammates."
        );
        setTeammateLoading(false);
        setTeammates([]); // Clear any previous results if role changes
        return;
      }

      const queryParams = new URLSearchParams();
      if (teammateSearchTerm) {
        queryParams.append("search", teammateSearchTerm);
      }
      // If user has interests, append them to the query for the backend to filter
      // Note: Backend's `find_potential_teammates` already uses `current_user_interests`
      // so explicitly sending it from frontend query params might be redundant if the backend
      // pulls it from the JWT. However, if the backend `interests` parameter is directly used,
      // sending it is useful. Let's log it for debugging.
      if (user?.interests && user.interests.length > 0) {
        console.log(
          "DEBUG: Teammate Fetch - User interests being considered:",
          user.interests
        );
        // This is primarily for backend debugging visibility if you need it.
        // For actual filtering, the backend `get_jwt_identity` already retrieves `interests`.
        // queryParams.append("interests", JSON.stringify(user.interests)); // Don't do this unless backend expects JSON string
      }

      const apiUrl = `${
        process.env.NEXT_PUBLIC_API_BASE_URL
      }/teammates?${queryParams.toString()}`;
      console.log("DEBUG: Teammate Fetch - API URL:", apiUrl);
      console.log(
        "DEBUG: Teammate Fetch - Authorization Token (first 10 chars):",
        token.substring(0, 10)
      );

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log(
        "DEBUG: Teammate Fetch - API Response Status:",
        response.status
      );
      console.log("DEBUG: Teammate Fetch - API Response Data:", result);

      if (response.ok) {
        setTeammates(result.teammates);
      } else {
        setTeammateError(result.message || "Failed to fetch teammates.");
      }
    } catch (err) {
      console.error("Error fetching teammates:", err);
      setTeammateError(
        "An unexpected error occurred while fetching teammates: " + err.message
      );
    } finally {
      setTeammateLoading(false);
    }
  };

  // --- Effects to trigger fetches based on current view and search terms ---
  useEffect(() => {
    if (!loadingAuth && isLoggedIn) {
      if (currentView === "teams") {
        fetchTeams();
      } else {
        fetchTeammates();
      }
    } else if (!loadingAuth && !isLoggedIn) {
      setTeamError("Please log in to view teams.");
      setTeammateError("Please log in to view potential teammates.");
      setTeamLoading(false);
      setTeammateLoading(false);
    }
  }, [
    isLoggedIn,
    loadingAuth,
    currentView,
    teamSearchTerm,
    teamCategory,
    teammateSearchTerm,
  ]);

  // --- Team-specific Handlers ---
  const handleJoinTeam = async (teamId) => {
    if (!user) {
      alert("You must be logged in to join a team.");
      return;
    }
    if (user.role !== "Regular User") {
      alert("Only 'Regular Users' can join teams.");
      return;
    }
    if (user.team_id) {
      alert(
        `You are already part of a team: ${user.team_name}. Please leave it before joining a new one.`
      );
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/teams/${teamId}/join`,
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
        alert(result.message);
        if (result.user && result.token) {
          updateUserContext({ ...result.user, token: result.token });
        }
        fetchTeams(); // Re-fetch teams to update statuses
      } else {
        alert(result.message || "Failed to join team.");
      }
    } catch (err) {
      console.error("Error joining team:", err);
      alert("An error occurred while trying to join the team.");
    }
  };

  const handleLeaveTeam = async (teamId) => {
    // Add confirmation for leaving the team
    if (!confirm("Are you sure you want to leave this team?")) {
      return; // User cancelled
    }

    if (!user) {
      alert("You must be logged in to leave a team.");
      return;
    }

    // Check if the user is actually a member of this team
    if (user.team_id !== teamId) {
      alert("You are not a member of this team.");
      return;
    }

    // Find the team to check if user is the leader
    const team = teams.find((t) => t.id === teamId);
    if (team && team.leader_id === user.id) {
      alert(
        "As a team leader, you cannot leave the team directly. You must either disband the team or transfer leadership to another member first."
      );
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/teams/${teamId}/leave`,
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
        alert(result.message || "Successfully left the team!");
        if (result.user && result.token) {
          // Backend should return user with team_id=None, team_name=None
          updateUserContext({ ...result.user, token: result.token });
        } else {
          // If backend doesn't return updated user, update locally
          updateUserContext({
            ...user,
            team_id: null,
            team_name: null,
          });
        }
        fetchTeams(); // Re-fetch teams to update statuses
      } else {
        alert(result.message || "Failed to leave team.");
      }
    } catch (err) {
      console.error("Error leaving team:", err);
      alert("An error occurred while trying to leave the team.");
    }
  };

  const handleCreateTeam = async (teamData) => {
    setIsCreatingTeam(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/teams`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(teamData),
        }
      );
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        if (result.user && result.token) {
          updateUserContext({ ...result.user, token: result.token });
        }
        fetchTeams(); // Re-fetch teams to show the newly created one
        setIsModalOpen(false); // Close modal on success
      } else {
        alert(result.message || "Failed to create team.");
      }
    } catch (err) {
      console.error("Error creating team:", err);
      alert("An error occurred while trying to create the team.");
    } finally {
      setIsCreatingTeam(false);
    }
  };

  // Helper function to determine if user is member of a team
  const isUserMemberOfTeam = (team) => {
    return user?.team_id === team.id;
  };

  // Helper function to determine if user is leader of a team
  const isUserLeaderOfTeam = (team) => {
    return team.leader_id === user?.id;
  };

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
        You need to be logged in to access community features.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-inter">
      <Head>
        <title>Community - Conference Portal</title>
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
            Community Hub
          </h1>
          {user?.role === "Regular User" &&
            !user?.team_id &&
            currentView === "teams" && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
              >
                Create Team
              </button>
            )}
          {user?.role === "Regular User" &&
            user?.team_id &&
            currentView === "teams" && (
              <button
                disabled
                className="bg-gray-600 text-gray-400 font-bold py-2 px-4 rounded-md cursor-not-allowed"
              >
                Already in a Team
              </button>
            )}
        </div>

        {/* Display current team info if user is in a team */}
        {user?.team_id && user?.team_name && (
          <div className="mb-6 p-4 bg-blue-900 bg-opacity-50 border border-blue-600 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-blue-300">
                  Current Team: {user.team_name}
                </h3>
                <p className="text-blue-200 text-sm">
                  You are currently a member of this team
                </p>
              </div>
              <button
                onClick={() => handleLeaveTeam(user.team_id)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
              >
                Leave Team
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex mb-6 border-b border-gray-600">
          <button
            onClick={() => setCurrentView("teams")}
            className={`px-4 py-2 text-lg font-medium ${
              currentView === "teams"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-200"
            } focus:outline-none transition duration-200`}
          >
            Find Teams
          </button>
          <button
            onClick={() => setCurrentView("teammates")}
            className={`ml-4 px-4 py-2 text-lg font-medium ${
              currentView === "teammates"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-200"
            } focus:outline-none transition duration-200`}
          >
            Find Teammates
          </button>
        </div>

        {currentView === "teams" && (
          <div className="animate-fade-in-down">
            <h2 className="text-2xl font-semibold text-gray-200 mb-4">
              Search Teams
            </h2>
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search by team name or description..."
                value={teamSearchTerm}
                onChange={(e) => setTeamSearchTerm(e.target.value)}
                className="flex-grow p-3 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
              />
              <select
                value={teamCategory}
                onChange={(e) => setTeamCategory(e.target.value)}
                className="p-3 border border-gray-600 rounded-md bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Categories</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="Data Science">Data Science</option>
                <option value="AI/ML">AI/ML</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Game Development">Game Development</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Other">Other</option>
              </select>
              <button
                onClick={fetchTeams}
                className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-200"
              >
                Search
              </button>
            </div>

            {teamLoading ? (
              <div className="text-center text-gray-400 p-8">
                Loading teams...
              </div>
            ) : teamError ? (
              <div className="text-center text-red-400">{teamError}</div>
            ) : teams.length === 0 ? (
              <div className="text-center text-gray-400 p-8">
                No teams found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="bg-gray-700 p-6 rounded-lg shadow-lg border border-gray-600 flex flex-col justify-between team-card animate-fade-in-up"
                  >
                    <div>
                      <h2 className="text-2xl font-semibold text-purple-300 mb-2">
                        {team.name}
                      </h2>
                      <p className="text-gray-300 mb-4">{team.description}</p>
                      <p className="text-sm text-gray-400 mb-1">
                        <span className="font-medium text-gray-200">
                          Category:
                        </span>{" "}
                        {team.category}
                      </p>
                      <p className="text-sm text-gray-400 mb-1">
                        <span className="font-medium text-gray-200">
                          Leader:
                        </span>{" "}
                        {team.leader ? team.leader.full_name : "N/A"}
                      </p>
                      <p className="text-sm text-gray-400 mb-4">
                        <span className="font-medium text-gray-200">
                          Members:
                        </span>{" "}
                        {team.current_members} / {team.max_members}
                      </p>
                      <div className="mb-4">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                            team.status === "Team full"
                              ? "bg-red-700 text-red-100"
                              : team.status === "Almost full"
                              ? "bg-yellow-700 text-yellow-100"
                              : "bg-green-700 text-green-100"
                          }`}
                        >
                          {team.status}
                        </span>
                      </div>
                      {team.skills_needed && team.skills_needed.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-300 mb-1">
                            Skills Needed:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {team.skills_needed.map((skill, idx) => (
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
                    </div>

                    {/* Conditional Join/Leave/Status Buttons */}
                    {user?.role === "Regular User" && (
                      <>
                        {/* User is a member of this team but not the leader */}
                        {isUserMemberOfTeam(team) &&
                          !isUserLeaderOfTeam(team) && (
                            <button
                              onClick={() => handleLeaveTeam(team.id)}
                              className="mt-4 w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200"
                            >
                              Leave Team
                            </button>
                          )}

                        {/* User is the leader of this team */}
                        {isUserLeaderOfTeam(team) && (
                          <button
                            disabled
                            className="mt-4 w-full bg-gray-600 text-gray-400 px-4 py-2 rounded-md cursor-not-allowed"
                          >
                            Team Leader
                          </button>
                        )}

                        {/* User is not a member and can join */}
                        {!isUserMemberOfTeam(team) &&
                          !user?.team_id &&
                          team.status !== "Team full" && (
                            <button
                              onClick={() => handleJoinTeam(team.id)}
                              className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200"
                            >
                              Join Team
                            </button>
                          )}

                        {/* User is in a different team */}
                        {!isUserMemberOfTeam(team) && user?.team_id && (
                          <button
                            disabled
                            className="mt-4 w-full bg-gray-600 text-gray-400 px-4 py-2 rounded-md cursor-not-allowed"
                          >
                            Leave current team to join
                          </button>
                        )}

                        {/* Team is full */}
                        {team.status === "Team full" &&
                          !isUserMemberOfTeam(team) && (
                            <button
                              disabled
                              className="mt-4 w-full bg-gray-600 text-gray-400 px-4 py-2 rounded-md cursor-not-allowed"
                            >
                              Team Full
                            </button>
                          )}
                      </>
                    )}

                    {/* Non-regular users cannot join */}
                    {user?.role !== "Regular User" && (
                      <button
                        disabled
                        className="mt-4 w-full bg-gray-600 text-gray-400 px-4 py-2 rounded-md cursor-not-allowed"
                      >
                        Only Regular Users can join
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === "teammates" && (
          <div className="animate-fade-in-down">
            {user?.role !== "Regular User" ? (
              <div className="text-center text-red-400 p-8">
                <p className="text-lg font-semibold mb-2">Access Denied</p>
                <p>Only 'Regular Users' can search for teammates.</p>
                <p className="text-sm mt-2">Your current role: {user?.role}</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-gray-200 mb-4">
                  Find Potential Teammates
                </h2>
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Search by name, skills, or interests..."
                    value={teammateSearchTerm}
                    onChange={(e) => setTeammateSearchTerm(e.target.value)}
                    className="flex-grow p-3 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-200"
                  />
                  <button
                    onClick={fetchTeammates}
                    className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-200"
                  >
                    Search
                  </button>
                </div>

                {/* Display user's interests for context */}
                {user?.interests && user.interests.length > 0 && (
                  <div className="mb-6 p-4 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-300 mb-2">
                      Your Interests (used for matching):
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.map((interest, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-800 text-blue-200 text-xs px-2.5 py-0.5 rounded-full"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {teammateLoading ? (
                  <div className="text-center text-gray-400 p-8">
                    <div className="animate-pulse">
                      <div className="text-lg mb-2">
                        Searching for teammates...
                      </div>
                      <div className="text-sm">
                        Finding users with similar interests
                      </div>
                    </div>
                  </div>
                ) : teammateError ? (
                  <div className="text-center text-red-400 p-8">
                    <p className="text-lg font-semibold mb-2">Error</p>
                    <p>{teammateError}</p>
                  </div>
                ) : teammates.length === 0 ? (
                  <div className="text-center text-gray-400 p-8">
                    <p className="text-lg mb-2">
                      No potential teammates found.
                    </p>
                    <p className="text-sm">
                      Try adjusting your search terms or check back later as
                      more users join.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teammates.map((teammate) => (
                      <div
                        key={teammate.id}
                        className="bg-gray-700 p-6 rounded-lg shadow-lg border border-gray-600 teammate-card animate-fade-in-up"
                      >
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mr-4">
                            <span className="text-white font-bold text-lg">
                              {teammate.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-purple-300">
                              {teammate.full_name}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {teammate.email}
                            </p>
                          </div>
                        </div>

                        {/* Bio/Description */}
                        {teammate.bio && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-300 mb-1">
                              About:
                            </h4>
                            <p className="text-gray-400 text-sm">
                              {teammate.bio}
                            </p>
                          </div>
                        )}

                        {/* Skills */}
                        {teammate.skills && teammate.skills.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-300 mb-2">
                              Skills:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {teammate.skills.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="bg-green-800 text-green-200 text-xs px-2.5 py-0.5 rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interests */}
                        {teammate.interests &&
                          teammate.interests.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-300 mb-2">
                                Interests:
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {teammate.interests.map((interest, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-blue-800 text-blue-200 text-xs px-2.5 py-0.5 rounded-full"
                                  >
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Team Status */}
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-300 mb-1">
                            Team Status:
                          </h4>
                          {teammate.team_name ? (
                            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-700 text-red-100">
                              Already in team: {teammate.team_name}
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-green-700 text-green-100">
                              Available for team
                            </span>
                          )}
                        </div>

                        {/* Compatibility Score */}
                        {teammate.compatibility_score !== undefined && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-300 mb-1">
                              Compatibility:
                            </h4>
                            <div className="flex items-center">
                              <div className="w-full bg-gray-600 rounded-full h-2 mr-2">
                                <div
                                  className="bg-purple-600 h-2 rounded-full"
                                  style={{
                                    width: `${teammate.compatibility_score}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-300">
                                {teammate.compatibility_score}%
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Contact Button */}
                        <div className="mt-4">
                          <button
                            onClick={() => {
                              // Create mailto link
                              const subject = encodeURIComponent(
                                "Team Collaboration - Conference Portal"
                              );
                              const body = encodeURIComponent(
                                `Hi ${teammate.full_name},\n\nI found your profile on the Conference Portal and would like to discuss potential collaboration opportunities.\n\nBest regards,\n${user.full_name}`
                              );
                              window.location.href = `mailto:${teammate.email}?subject=${subject}&body=${body}`;
                            }}
                            className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-200"
                          >
                            Contact
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateTeam={handleCreateTeam}
        isLoading={isCreatingTeam}
      />
    </div>
  );
};

export default FindTeammatesPage;
