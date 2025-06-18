// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

// _document.js is rendered only on the server, so event handlers like onClick won't work here.
// This is primarily for adding HTML structure around your Next.js app.
export default function Document() {
  return (
    <Html lang="en" className="h-full bg-gray-50">
      <Head>
        {/* Google Fonts - Inter - Fixed URL */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        <meta name="description" content="AI Conference Portal - Register and login to explore the conference." />
      </Head>
      <body className="h-full antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}