// frontend/pages/find-teams.js
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import { callApi } from "../lib/auth"; // Assuming callApi handles token inclusion
import DashboardLayout from "../components/Layout/DashboardLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const FindTeamsPage = () => {
  const router = useRouter();
  const { user, isLoggedIn, loadingAuth, logout, setUser } = useAuth(); // Destructure setUser if available

  const [teams, setTeams] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    category: "",
    skillsNeeded: [],
    maxMembers: 5,
  });

  const categories = [
    "Healthcare",
    "Finance",
    "Education",
    "Environment",
    "Smart Cities",
    "Entertainment",
    "Security",
  ];
  const availableSkills = [
    "Machine Learning",
    "Computer Vision",
    "NLP",
    "Python",
    "JavaScript",
    "React",
    "Node.js",
    "TensorFlow",
    "PyTorch",
    "Data Science",
    "UI/UX",
    "DevOps",
    "Cloud Computing",
  ];

  // Helper function to fetch teams (called from useEffect and after team creation/joining)
  // Update the fetchTeams function in your find-teams.js file
  const fetchTeams = async () => {
    setLoadingData(true);
    setError("");

    try {
      if (!user) {
        console.error("User missing in AuthContext during fetchTeams.");
        logout(); // Or handle redirection more gracefully
        router.replace("/");
        return;
      }

      // Construct query parameters
      const queryParams = new URLSearchParams();
      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }
      if (selectedCategory) {
        queryParams.append("category", selectedCategory);
      }

      const queryString = queryParams.toString();
      const url = queryString ? `/teams?${queryString}` : "/teams";

      const response = await callApi(url, "GET");

      if (response.success) {
        // Fix: Access the nested data property
        const teamsData = response.data?.data || response.data;

        if (Array.isArray(teamsData)) {
          setTeams(teamsData);
        } else {
          console.warn("API returned non-array data for teams:", response.data);
          setTeams([]); // Ensure it's always an array
          setError("Received unexpected data format from the server.");
        }
      } else {
        setError(response.message || "Failed to fetch teams.");
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
      setError("Network error or server unavailable.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (loadingAuth) return;

    if (!isLoggedIn) {
      console.log("Not logged in, redirecting to login.");
      router.replace("/login");
      return;
    }

    // Call fetchTeams when isLoggedIn, searchTerm, or selectedCategory changes
    fetchTeams();
  }, [
    isLoggedIn,
    loadingAuth,
    router,
    user,
    logout,
    searchTerm,
    selectedCategory,
  ]);
  const debugButtonState = (team) => {
    console.log("🔍 DEBUG: Button state for team", team.name);
    console.log("🔍 DEBUG: user.team_id:", user?.team_id);
    console.log("🔍 DEBUG: team.id:", team.id);
    console.log("🔍 DEBUG: team.status:", team.status);
    console.log("🔍 DEBUG: team.currentMembers:", team.currentMembers);
    console.log("🔍 DEBUG: team.maxMembers:", team.maxMembers);
  };
  const handleJoinTeam = async (teamId) => {
    console.log("🔍 DEBUG: handleJoinTeam called with teamId:", teamId);
    console.log("🔍 DEBUG: Current user:", user);

    setError("");
    try {
      console.log("🔍 DEBUG: About to call API for joining team");
      const response = await callApi(`/teams/${teamId}/join`, "POST");

      console.log("🔍 DEBUG: API response:", response);

      if (response.success) {
        alert(response.message || "Connection request sent!");
        console.log("🔍 DEBUG: About to refresh teams");
        fetchTeams(); // Refresh the list of teams

        if (response.user && response.token && setUser) {
          console.log("🔍 DEBUG: Updating user context");
          setUser(response.user);
        }
      } else {
        console.log("🔍 DEBUG: API returned error:", response.message);
        setError(response.message || "Failed to send join request.");
      }
    } catch (err) {
      console.error("🔍 DEBUG: Error in handleJoinTeam:", err);
      setError("Failed to send join request due to network error.");
    }
  };

  const handleCreateTeam = async (e) => {
    console.log("🔍 DEBUG: handleCreateTeam called");
    e.preventDefault();

    console.log("🔍 DEBUG: New team data:", newTeam);

    setError("");
    try {
      const teamToCreate = {
        ...newTeam,
      };

      console.log(
        "🔍 DEBUG: About to send team creation request:",
        teamToCreate
      );
      const response = await callApi("/teams", "POST", teamToCreate);

      console.log("🔍 DEBUG: Create team API response:", response);

      if (response.success) {
        alert(response.message || "Team created successfully!");
        setShowCreateModal(false);
        setNewTeam({
          name: "",
          description: "",
          category: "",
          skillsNeeded: [],
          maxMembers: 5,
        });
        console.log("🔍 DEBUG: About to refresh teams after creation");
        fetchTeams();

        if (response.user && response.token && setUser) {
          console.log("🔍 DEBUG: Updating user context after team creation");
          setUser(response.user);
        }
      } else {
        console.log(
          "🔍 DEBUG: Create team API returned error:",
          response.message
        );
        setError(response.message || "Failed to create team.");
      }
    } catch (err) {
      console.error("🔍 DEBUG: Error in handleCreateTeam:", err);
      setError("Failed to create team due to network error.");
    }
  };

  const handleSkillToggle = (skill) => {
    setNewTeam((prev) => ({
      ...prev,
      skillsNeeded: prev.skillsNeeded.includes(skill)
        ? prev.skillsNeeded.filter((s) => s !== skill)
        : [...prev.skillsNeeded, skill],
    }));
  };

  const filteredTeams = teams.filter((team) => {
    const leaderName = team.leader?.full_name || ""; // Ensure leader is not null

    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leaderName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "" || team.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (loadingAuth) {
    return <LoadingSpinner message="Verifying authentication..." />;
  }

  if (!isLoggedIn) {
    return null; // Don't render anything if not logged in and redirecting
  }

  if (loadingData) {
    return <LoadingSpinner message="Loading teams..." />;
  }

  // Display error message if there is one
  if (error) {
    return (
      <DashboardLayout title="Find Teams - mAIple Conference Portal">
        <ErrorMessage message={error} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Find Teams - mAIple Conference Portal"
      description="Join or create teams for hackathons and collaborative projects."
    >
      <div className="max-w-6xl mx-auto p-6 text-white">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Find Teams</h1>
            <p className="text-gray-300">
              Join existing teams or create your own for hackathons and
              collaborative projects.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Create Team
          </button>
        </div>
        {/* Search and Filter Section */}
        <div className="bg-gray-800 bg-opacity-70 rounded-lg shadow-md p-6 mb-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-200 mb-2"
              >
                Search Teams
              </label>
              <input
                type="text"
                id="search"
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Search by team name, description, or leader..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-200 mb-2"
              >
                Filter by Category
              </label>
              <select
                id="category"
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {/* Teams Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="bg-gray-800 bg-opacity-70 rounded-lg shadow-md p-6 border border-gray-700"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {team.name}
                  </h3>
                  <p className="text-sm text-purple-400">{team.category}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    team.status === "Looking for members"
                      ? "bg-green-700 text-green-100"
                      : team.status === "Almost full"
                      ? "bg-yellow-700 text-yellow-100"
                      : "bg-red-700 text-red-100"
                  }`}
                >
                  {team.status}
                </span>
              </div>

              <p className="text-gray-300 mb-4">{team.description}</p>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>
                    Team Leader:{" "}
                    <span className="font-medium text-white">
                      {team.leader?.full_name || "N/A"}
                    </span>
                  </span>
                  {/* Assuming team.created is a string like "YYYY-MM-DD" */}
                  <span>Created: {team.created || "N/A"}</span>
                </div>
                <div className="text-sm text-gray-400">
                  Members: {team.currentMembers || 0}/
                  {team.maxMembers || newTeam.maxMembers}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${
                        ((team.currentMembers || 0) / (team.maxMembers || 1)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              {team.skillsNeeded?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-white mb-2">
                    Skills Needed:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {team.skillsNeeded.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-gray-700 text-gray-100 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Conditional rendering for Join/Your Team/Already in a Team */}
              {user?.team_id ? ( // Check if the current user is already in ANY team
                user.team_id === team.id ? ( // Check if the current team IS the user's team
                  <button
                    className="w-full py-2 rounded-md text-sm font-medium bg-purple-800 text-white cursor-default"
                    disabled
                  >
                    Your Team
                  </button>
                ) : (
                  // User is in a different team
                  <button
                    className="w-full py-2 rounded-md text-sm font-medium bg-gray-600 text-gray-300 cursor-not-allowed"
                    disabled
                  >
                    Already in a Team
                  </button>
                )
              ) : (
                // User is not in any team, allow joining
                <button
                  onClick={() => handleJoinTeam(team.id)}
                  className={`w-full py-2 rounded-md text-sm font-medium transition-colors ${
                    team.status === "Team full" ||
                    team.currentMembers >= team.maxMembers
                      ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                  disabled={
                    team.status === "Team full" ||
                    team.currentMembers >= team.maxMembers
                  }
                >
                  {team.status === "Team full" ||
                  team.currentMembers >= team.maxMembers
                    ? "Team Full"
                    : "Request to Join"}
                </button>
              )}
            </div>
          ))}
        </div>
        {filteredTeams.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No teams found matching your criteria.
            </p>
          </div>
        )}
        {/* Create Team Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">
                    Create New Team
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-200 text-xl"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateTeam}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={newTeam.name}
                      onChange={(e) =>
                        setNewTeam({ ...newTeam, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white resize-y focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={newTeam.description}
                      onChange={(e) =>
                        setNewTeam({ ...newTeam, description: e.target.value })
                      }
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={newTeam.category}
                      onChange={(e) =>
                        setNewTeam({ ...newTeam, category: e.target.value })
                      }
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Maximum Members
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={newTeam.maxMembers}
                      onChange={(e) =>
                        setNewTeam({
                          ...newTeam,
                          maxMembers: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Skills Needed
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableSkills.map((skill) => (
                        <label
                          key={skill}
                          className="flex items-center text-gray-300"
                        >
                          <input
                            type="checkbox"
                            className="mr-2 form-checkbox h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                            checked={newTeam.skillsNeeded.includes(skill)}
                            onChange={() => handleSkillToggle(skill)}
                          />
                          <span className="text-sm">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-2 px-4 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Create Team
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FindTeamsPage;
