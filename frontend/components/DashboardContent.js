// components/DashboardContent.js
import React from 'react';

const DashboardContent = ({ user, conferenceInfo }) => {
    return (
        <div className="relative z-10 w-full max-w-4xl bg-gray-900 bg-opacity-70 backdrop-filter backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-gray-800 animate-fade-in-up">
            <h1 className="text-5xl font-extrabold text-white mb-6 font-montserrat drop-shadow-lg">
                Welcome,
                <span className="text-purple-400">
                    {" "}{user?.full_name?.split(" ")[0] || "User"}
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
                        {user?.fullName || "N/A"}
                    </p>
                    <p className="text-lg text-gray-300 mb-2">
                        <span className="font-medium text-purple-300">Email:</span>{" "}
                        {user?.email || "N/A"}
                    </p>
                    <p className="text-lg text-gray-300">
                        <span className="font-medium text-purple-300">Role:</span>{" "}
                        {user?.role || "N/A"}
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
                    {conferenceInfo.tracks &&
                        conferenceInfo.tracks.map((track, index) => (
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
    );
};

export default DashboardContent;