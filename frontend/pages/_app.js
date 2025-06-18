// pages/_app.js
import '../styles/globals.css';
import Head from 'next/head';
import { AuthProvider } from '../contexts/AuthContext';

// Custom _app.js to apply global styles and layout components
function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>mAIple - AI Conference Portal</title>
      </Head>
      {/* The AuthProvider should wrap your entire application content */}
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <main className="flex-grow">
            <Component {...pageProps} />
          </main>
          {/* Optional: Add a global footer here if it's meant to be global across all pages */}
          {/* For mAIple, the footer is currently in index.js, so not global yet. */}
        </div>
      </AuthProvider>
    </>
  );
}

export default MyApp;