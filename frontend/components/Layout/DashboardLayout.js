// components/Layout/DashboardLayout.js
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext'; // To access logout

const DashboardLayout = ({ title, description, children }) => {
    const { logout } = useAuth();

    const handleLogout = async () => {
        console.log("Logging out from DashboardLayout...");
        await logout();
        // The AuthContext will handle the redirect to /login after logout
    };

    return (
        <>
            <Head>
                <title>{title || "mAIple Conference Portal"}</title>
                <meta name="description" content={description || "Your personal mAIple AI Conference dashboard."} />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet" />
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

                {/* Main content area will be rendered here */}
                <main className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 relative">
                    {/* Background shapes (consistent with hero/auth pages) */}
                    <div className="absolute inset-0 z-0 opacity-15 overflow-hidden">
                        <svg
                            className="w-full h-full"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="xMidYMid slice"
                            fill="none"
                        >
                            <circle cx="15" cy="80" r="10" fill="url(#gradPurple)" className="animate-float-1"></circle>
                            <circle cx="85" cy="20" r="15" fill="url(#gradBlue)" className="animate-float-2"></circle>
                            <rect x="5" y="50" width="12" height="12" rx="3" fill="url(#gradPink)" className="animate-float-3"></rect>
                            <polygon points="70,90 80,70 60,70" fill="url(#gradGreen)" className="animate-float-4"></polygon>
                            <defs>
                                <radialGradient id="gradPurple" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" stopColor="#A78BFA" /><stop offset="100%" stopColor="#6D28D9" /></radialGradient>
                                <radialGradient id="gradBlue" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" stopColor="#60A5FA" /><stop offset="100%" stopColor="#2563EB" /></radialGradient>
                                <radialGradient id="gradPink" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" stopColor="#F472B6" /><stop offset="100%" stopColor="#BE185D" /></radialGradient>
                                <radialGradient id="gradGreen" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" stopColor="#4ADE80" /><stop offset="100%" stopColor="#16A34A" /></radialGradient>
                            </defs>
                        </svg>
                    </div>
                    {children}
                </main>

                {/* Footer */}
                <footer className="py-12 px-8 lg:px-20 bg-gray-900 border-t border-b border-gray-800 text-center text-gray-400">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
                        <p className="mb-4 md:mb-0">
                            &copy; {new Date().getFullYear()} mAIple Conference. All rights reserved.
                        </p>
                        <div className="flex space-x-6">
                            <a href="mailto:info@maiple.com" className="text-purple-400 hover:text-white transition duration-300">
                                info@maiple.com
                            </a>
                            <a href="#" className="text-purple-400 hover:text-white transition duration-300">
                                Privacy Policy
                            </a>
                            <a href="#" className="text-purple-400 hover:text-white transition duration-300">
                                Terms of Service
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default DashboardLayout;