// frontend/pages/_app.js
import "../styles/globals.css";
import Head from "next/head";
import { AuthProvider } from "../contexts/AuthContext";
import { useEffect } from "react";
import emailjs from "@emailjs/browser"; // Import emailjs

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Initialize EmailJS with your public key
    if (process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
      console.log(
        "EmailJS initialized with public key:",
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
      );
    } else {
      console.warn(
        "EmailJS public key not found. EmailJS will not be initialized."
      );
    }
  }, []); // Run once on component mount

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>mAIple - AI Conference Portal</title>
      </Head>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <main className="flex-grow">
            <Component {...pageProps} />
          </main>
        </div>
      </AuthProvider>
    </>
  );
}

export default MyApp;
