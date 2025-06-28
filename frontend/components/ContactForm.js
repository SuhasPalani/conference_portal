// components/ContactForm.js
import React, { useState } from "react";
import Link from "next/link";
import { submitContactForm } from "../lib/auth"; // Import the new API function
import Notification from "./Notification"; // Assuming you have a Notification component

const ContactForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("info");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setNotificationMessage("");
    setNotificationType("info");

    const result = await submitContactForm({ name, email, subject, message });

    if (result.success) {
      setNotificationMessage(result.message);
      setNotificationType("success");
      // Clear form
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } else {
      setNotificationMessage(result.message);
      setNotificationType("error");
    }
    setIsLoading(false);
  };

  return (
    <section
      id="contact-form"
      className="py-20 px-8 lg:px-20 bg-gray-900 bg-opacity-70 backdrop-filter backdrop-blur-lg border-t border-b border-gray-800"
    >
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-5xl font-bold text-white mb-12 animate-fade-in drop-shadow-lg font-montserrat">
          Get In Touch
        </h2>
        <p className="text-lg text-gray-300 leading-relaxed mb-12 animate-fade-in delay-100">
          Have questions or want to collaborate? Send us a message and we'll get
          back to you soon!
        </p>

        <Notification
          message={notificationMessage}
          messageType={notificationType}
          isLoading={isLoading}
        />

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <label
              htmlFor="name"
              className="block text-lg font-medium text-gray-200 mb-2"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white transition duration-200"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-lg font-medium text-gray-200 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white transition duration-200"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="subject"
              className="block text-lg font-medium text-gray-200 mb-2"
            >
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white transition duration-200"
              placeholder="Subject of your message"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="message"
              className="block text-lg font-medium text-gray-200 mb-2"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows="6"
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white resize-y transition duration-200"
              placeholder="Your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              disabled={isLoading}
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-xl font-bold rounded-full shadow-lg text-white bg-purple-700 hover:bg-purple-800 transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl cursor-pointer ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ContactForm;
