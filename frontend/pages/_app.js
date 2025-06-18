import '../styles/globals.css';
import Head from 'next/head';

// Custom _app.js to apply global styles and layout components
function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>mAIple - AI Conference Portal</title> {/* Changed title for consistency */}
      </Head>
      {/* The main container now directly holds the page component */}
      <div className="min-h-screen flex flex-col">
        {/* Navbar removed from here */}
        <main className="flex-grow">
          <Component {...pageProps} />
        </main>
        {/* Optional: Add a footer here if it's meant to be global across all pages */}
      </div>
    </>
  );
}

export default MyApp;