// frontend/pages/find-mentors.js
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import { callApi } from "../lib/auth";
import DashboardLayout from "../components/Layout/DashboardLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const FindMentorsPage = () => {
  const router = useRouter();
  const { user, isLoggedIn, loadingAuth, logout } = useAuth();

  const [mentors, setMentors] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");

  // Dummy data for placeholder
  const dummyMentors = [
    {
      id: 1,
      name: "Dr. Sarah Chen",
      title: "Senior AI Research Scientist",
      company: "Google DeepMind",
      expertise: ["Machine Learning", "Computer Vision", "Neural Networks"],
      bio: "10+ years in AI research with focus on computer vision and deep learning applications.",
      availability: "Available",
      profileImage: "/api/placeholder/150/150"
    },
    {
      id: 2,
      name: "Michael Rodriguez",
      title: "Head of AI Product",
      company: "OpenAI",
      expertise: ["Natural Language Processing", "Product Strategy", "AI Ethics"],
      bio: "Leading AI product development and ensuring responsible AI deployment.",
      availability: "Limited",
      profileImage: "/api/placeholder/150/150"
    },
    {
      id: 3,
      name: "Dr. Priya Patel",
      title: "AI Startup Founder",
      company: "VisionAI Inc.",
      expertise: ["Entrepreneurship", "Computer Vision", "Startup Strategy"],
      bio: "Founded 3 AI startups, specializing in computer vision for healthcare applications.",
      availability: "Available",
      profileImage: "/api/placeholder/150/150"
    },
    {
      id: 4,
      name: "James Kim",
      title: "Senior ML Engineer",
      company: "Tesla",
      expertise: ["Autonomous Vehicles", "Deep Learning", "Robotics"],
      bio: "Working on self-driving car technology and robotics applications.",
      availability: "Available",
      profileImage: "/api/placeholder/150/150"
    }
  ];

  const skills = [
    "Machine Learning",
    "Computer Vision",
    "Natural Language Processing",
    "Robotics",
    "AI Ethics",
    "Product Strategy",
    "Entrepreneurship",
    "Deep Learning"
  ];

  useEffect(() => {
    if (loadingAuth) return;

    if (!isLoggedIn) {
      console.log("Not logged in, redirecting to login.");
      router.replace("/login");
      return;
    }

    const fetchMentors = async () => {
      setLoadingData(true);
      setError("");

      try {
        if (!user) {
          console.error("User missing in AuthContext, initiating logout.");
          logout();
          router.replace("/");
          return;
        }

        // In a real application, you would call your API here
        // const response = await callApi("/mentors", "GET");
        
        // For now, using dummy data
        setTimeout(() => {
          setMentors(dummyMentors);
          setLoadingData(false);
        }, 1000);

      } catch (err) {
        console.error("Error fetching mentors:", err);
        setError("Network error or server unavailable.");
        setLoadingData(false);
      }
    };

    fetchMentors();
  }, [isLoggedIn, loadingAuth, router, user, logout]);

  const handleConnectMentor = async (mentorId) => {
    try {
      // In a real application, you would call your API here
      // const response = await callApi(`/mentors/${mentorId}/connect`, "POST");
      
      // For now, just show an alert
      alert(`Connection request sent to mentor ${mentorId}!`);
    } catch (err) {
      console.error("Error connecting to mentor:", err);
      setError("Failed to send connection request.");
    }
  };

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSkill = selectedSkill === "" || mentor.expertise.includes(selectedSkill);
    
    return matchesSearch && matchesSkill;
  });

  if (loadingAuth) {
    return <LoadingSpinner message="Verifying authentication..." />;
  }

  if (!isLoggedIn) {
    return null;
  }

  if (loadingData) {
    return <LoadingSpinner message="Loading mentors..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <DashboardLayout
      title="Find Mentors - mAIple Conference Portal"
      description="Connect with AI industry experts and mentors."
    >
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Mentors</h1>
          <p className="text-gray-600">
            Connect with industry experts and experienced professionals who can guide your AI journey.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Mentors
              </label>
              <input
                type="text"
                id="search"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by name, company, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="skill" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Expertise
              </label>
              <select
                id="skill"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
              >
                <option value="">All Skills</option>
                {skills.map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mentors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map(mentor => (
            <div key={mentor.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                    <span className="text-gray-600 text-xl font-semibold">
                      {mentor.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{mentor.name}</h3>
                    <p className="text-sm text-gray-600">{mentor.title}</p>
                    <p className="text-sm text-blue-600 font-medium">{mentor.company}</p>
                  </div>
                </div>

                <p className="text-gray-700 text-sm mb-4 line-clamp-3">{mentor.bio}</p>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Expertise:</h4>
                  <div className="flex flex-wrap gap-1">
                    {mentor.expertise.map(skill => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    mentor.availability === 'Available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {mentor.availability}
                  </span>
                  
                  <button
                    onClick={() => handleConnectMentor(mentor.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      mentor.availability === 'Available'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={mentor.availability !== 'Available'}
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMentors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No mentors found matching your criteria.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FindMentorsPage;