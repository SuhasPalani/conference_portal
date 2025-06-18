// components/Alert.js
import React from 'react';

const Alert = ({ message, type }) => {
  if (!message) return null;

  const getAlertClasses = (alertType) => {
    switch (alertType) {
      case 'success':
        return 'bg-green-900/30 border-green-600 text-green-300';
      case 'error':
        return 'bg-red-900/30 border-red-600 text-red-300';
      case 'info':
        return 'bg-blue-900/30 border-blue-600 text-blue-300';
      default:
        return 'hidden';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${getAlertClasses(type)} shadow-lg flex items-center mb-4 max-w-lg mx-auto`}>
      {/* You can add icons here based on type if you have an icon library */}
      {type === 'success' && (
        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      )}
      {type === 'error' && (
        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      )}
      {type === 'info' && (
        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      )}
      <p className="font-medium text-lg">{message}</p>
    </div>
  );
};

export default Alert;