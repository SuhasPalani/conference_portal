import React, { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import ContactForm from "../components/ContactForm";
import SponsorCarousel from "../components/SponsorCarousel";
import { useAuth } from "../contexts/AuthContext"; // Import useAuth hook
import { useRouter } from "next/router"; // Import useRouter for redirection
import LoadingSpinner from "../components/LoadingSpinner"; // Import the LoadingSpinner

const HomePage = () => {
  const { isLoggedIn, user, logout, loadingAuth } = useAuth(); // Get auth state from context
  const router = useRouter();

  useEffect(() => {
    // Basic carousel logic (for demonstration, can be replaced with a robust library)
    const carousel = document.querySelector(".sponsor-carousel");
    if (carousel) {
      let scrollAmount = 0;
      const scrollStep = 200; // Pixels to scroll
      const scrollInterval = 3000; // Milliseconds

      const scrollCarousel = () => {
        scrollAmount += scrollStep;
        // Check if we've reached the end, reset or stop
        if (scrollAmount >= carousel.scrollWidth - carousel.clientWidth + 10) {
          // Add buffer
          scrollAmount = 0; // Reset to start
        }
        carousel.scrollTo({
          left: scrollAmount,
          behavior: "smooth",
        });
      };

      // Start auto-scrolling only if content overflows
      const checkAndScroll = () => {
        if (carousel.scrollWidth > carousel.clientWidth) {
          const intervalId = setInterval(scrollCarousel, scrollInterval);
          return () => clearInterval(intervalId); // Cleanup on unmount
        }
        return null; // No interval if not overflowing
      };

      let cleanupInterval = checkAndScroll();

      const resizeObserver = new ResizeObserver(() => {
        if (cleanupInterval) {
          cleanupInterval(); // Clear old interval
        }
        cleanupInterval = checkAndScroll(); // Set new one
      });
      resizeObserver.observe(carousel);

      return () => {
        if (cleanupInterval) {
          cleanupInterval();
        }
        resizeObserver.disconnect();
      }; // Cleanup on unmount
    }
  }, []);

  const handleLogout = async () => {
    await logout(); // Call the logout function from AuthContext
    router.push("/"); // Redirect to login page after logout
  };

  // If authentication status is still loading, render a loading state or nothing
  if (loadingAuth) {
    return <LoadingSpinner message="Loading session..." />;
  }

  return (
    <>
      <Head>
        <title>mAIple - The Future of AI Conferences</title>
        <meta
          name="description"
          content="Welcome to mAIple: Innovate, Connect, Inspire. Your gateway to the most groundbreaking AI research and discussions."
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

      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 text-white font-inter flex flex-col overflow-x-hidden">
        {/* Header/Branding and Navigation */}
        <header className="w-full py-6 px-8 lg:px-20 flex justify-between items-center z-20 relative animate-fade-in-down">
          <Link
            href="/"
            className="text-4xl lg:text-5xl font-extrabold text-white tracking-wider font-montserrat drop-shadow-md"
          >
            mAIple
          </Link>
          {/* Conditional Navigation Links */}
          <nav>
            <ul className="flex items-center space-x-6 md:space-x-8 text-lg font-semibold">
              <li>
                <Link
                  href="/#about"
                  className="text-gray-300 hover:text-white transition duration-300 transform hover:scale-105"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/#sponsors"
                  className="text-gray-300 hover:text-white transition duration-300 transform hover:scale-105"
                >
                  Sponsors
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact-form"
                  className="text-gray-300 hover:text-white transition duration-300 transform hover:scale-105"
                >
                  Contact
                </Link>
              </li>

              {isLoggedIn && user ? (
                // Display user info and dropdown if logged in
                <li className="relative group ml-4">
                  <button className="text-gray-300 hover:text-white transition duration-200 cursor-pointer text-lg font-medium">
                    Welcome, {user.full_name.split(" ")[0]}!{" "}
                    {/* Display first name */}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-white transition duration-200"
                    >
                      Dashboard
                    </Link>
                    {/* Add other links like Profile here if you have them */}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </li>
              ) : (
                // Display Login/Signup if not logged in
                <>
                  <li className="ml-4">
                    <Link href="/login">
                      <div className="text-gray-300 hover:text-white transition duration-200 cursor-pointer text-lg font-medium">
                        Login
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup">
                      <div className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-5 rounded-full transition duration-200 shadow-md transform hover:scale-105 text-lg">
                        Sign Up
                      </div>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </header>

        {/* Hero Section - Content is centered */}
        <section className="relative flex-grow flex flex-col items-center justify-center py-24 px-4 text-center overflow-hidden">
          {/* Background shapes and animations */}
          <div className="absolute inset-0 z-0 opacity-15">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
            >
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="url(#grad1)"
                className="animate-float-1"
              ></circle>
              <circle
                cx="85"
                cy="75"
                r="28"
                fill="url(#grad2)"
                className="animate-float-2"
              ></circle>
              <circle
                cx="45"
                cy="95"
                r="12"
                fill="url(#grad3)"
                className="animate-float-3"
              ></circle>
              <rect
                x="10"
                y="50"
                width="15"
                height="15"
                rx="3"
                fill="url(#grad4)"
                className="animate-float-4"
              ></rect>
              <rect
                x="70"
                y="10"
                width="20"
                height="20"
                rx="5"
                fill="url(#grad5)"
                className="animate-float-5"
              ></rect>
              <defs>
                <radialGradient
                  id="grad1"
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx="50%"
                  fy="50%"
                >
                  <stop offset="0%" stopColor="#A78BFA" /> {/* Purple-400 */}
                  <stop offset="100%" stopColor="#6D28D9" /> {/* Purple-700 */}
                </radialGradient>
                <radialGradient
                  id="grad2"
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx="50%"
                  fy="50%"
                >
                  <stop offset="0%" stopColor="#F472B6" /> {/* Pink-400 */}
                  <stop offset="100%" stopColor="#BE185D" /> {/* Pink-700 */}
                </radialGradient>
                <radialGradient
                  id="grad3"
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx="50%"
                  fy="50%"
                >
                  <stop offset="0%" stopColor="#60A5FA" /> {/* Blue-400 */}
                  <stop offset="100%" stopColor="#2563EB" /> {/* Blue-700 */}
                </radialGradient>
                <radialGradient
                  id="grad4"
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx="50%"
                  fy="50%"
                >
                  <stop offset="0%" stopColor="#4ADE80" /> {/* Green-400 */}
                  <stop offset="100%" stopColor="#16A34A" /> {/* Green-700 */}
                </radialGradient>
                <radialGradient
                  id="grad5"
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx="50%"
                  fy="50%"
                >
                  <stop offset="0%" stopColor="#FCD34D" /> {/* Yellow-300 */}
                  <stop offset="100%" stopColor="#D97706" /> {/* Yellow-700 */}
                </radialGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 animate-fade-in-up">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-white mb-8 leading-tight tracking-tight drop-shadow-2xl font-montserrat">
              Unlock the Future of{" "}
              <span className="text-purple-400">Artificial Intelligence</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-12 leading-relaxed max-w-3xl mx-auto drop-shadow-lg">
              Join leading experts, innovators, and researchers at the annual
              mAIple Conference. Discover breakthroughs, network, and shape
              tomorrow's AI landscape.
            </p>
            {/* Keeping the login/signup buttons here too, as they are primary CTAs */}
            <div className="space-y-6 sm:space-y-0 sm:space-x-8 flex flex-col sm:flex-row justify-center">
              <Link href="/signup">
                <div className="inline-flex items-center justify-center px-12 py-5 border border-transparent text-xl font-bold rounded-full shadow-lg text-white bg-purple-700 hover:bg-purple-800 transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl cursor-pointer ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900">
                  Register Now
                </div>
              </Link>
              <Link href="/login">
                <div className="inline-flex items-center justify-center px-12 py-5 border-2 border-white text-xl font-bold rounded-full shadow-lg text-white bg-transparent hover:bg-white hover:text-gray-900 transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl cursor-pointer">
                  Login
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* About the Conference Section */}
        <section
          id="about"
          className="py-20 px-8 lg:px-20 bg-gray-900 bg-opacity-70 backdrop-filter backdrop-blur-lg border-t border-b border-gray-800"
        >
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-5xl font-bold text-white mb-12 animate-fade-in drop-shadow-lg font-montserrat">
              About the Conference
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-12 animate-fade-in delay-100 max-w-4xl mx-auto">
              The annual mAIple Conference is the premier gathering for anyone
              interested in artificial intelligence. Dive deep into cutting-edge
              machine learning algorithms, ethical AI development, robotics,
              natural language processing, and much more.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">
              <div className="bg-gray-800 bg-opacity-60 p-10 rounded-2xl shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-3 animate-fade-in delay-200 border border-gray-700">
                <h3 className="text-3xl font-semibold text-purple-400 mb-4">
                  Insightful Keynotes
                </h3>
                <p className="text-gray-300 text-lg">
                  Hear from AI pioneers and visionaries who are shaping the
                  future of technology, delivering thought-provoking sessions.
                </p>
              </div>
              <div className="bg-gray-800 bg-opacity-60 p-10 rounded-2xl shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-3 animate-fade-in delay-300 border border-gray-700">
                <h3 className="text-3xl font-semibold text-blue-400 mb-4">
                  Interactive Workshops
                </h3>
                <p className="text-gray-300 text-lg">
                  Gain practical skills in hands-on sessions and collaborative
                  workshops led by industry experts and researchers.
                </p>
              </div>
              <div className="bg-gray-800 bg-opacity-60 p-10 rounded-2xl shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-3 animate-fade-in delay-400 border border-gray-700">
                <h3 className="text-3xl font-semibold text-green-400 mb-4">
                  Networking Opportunities
                </h3>
                <p className="text-gray-300 text-lg">
                  Connect with peers, mentors, and potential collaborators from
                  around the globe in a dynamic environment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Render the SponsorCarousel component */}
        <SponsorCarousel />

        {/* Render the ContactForm component */}
        <ContactForm />

        {/* Footer */}
        <footer
          id="contact"
          className="py-12 px-8 lg:px-20 bg-gray-900 text-center text-gray-400"
        >
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <p className="mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} mAIple Conference. All rights
              reserved.
            </p>
            <div className="flex space-x-6">
              <a
                href="mailto:info@maiple.com"
                className="text-purple-400 hover:text-white transition duration-300"
              >
                info@maiple.com
              </a>
              <a
                href="#"
                className="text-purple-400 hover:text-white transition duration-300"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-purple-400 hover:text-white transition duration-300"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;
