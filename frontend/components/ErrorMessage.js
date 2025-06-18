// components/ErrorMessage.js
import React from 'react';
import Alert from './Alert'; // Assuming Alert component exists
import { useRouter } from 'next/router';

const ErrorMessage = ({ message, redirectToLogin = true }) => {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex flex-col items-center justify-center text-white font-inter">
            <Alert message={message} type="error" />
            {redirectToLogin && (
                <button
                    onClick={() => router.push("/login")}
                    className="mt-6 px-6 py-3 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 transition duration-300 transform hover:scale-105 shadow-lg"
                >
                    Go to Login
                </button>
            )}
        </div>
    );
};

export default ErrorMessage;