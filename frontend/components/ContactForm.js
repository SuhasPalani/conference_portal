// components/ContactForm.js
import React from 'react';
import Link from 'next/link'; // Keep Link here if you decide to add internal links to other sections within the form component itself later

const ContactForm = () => {
  return (
    <section id="contact-form" className="py-20 px-8 lg:px-20 bg-gray-900 bg-opacity-70 backdrop-filter backdrop-blur-lg border-t border-b border-gray-800">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-5xl font-bold text-white mb-12 animate-fade-in drop-shadow-lg font-montserrat">Get In Touch</h2>
        <p className="text-lg text-gray-300 leading-relaxed mb-12 animate-fade-in delay-100">
          Have questions or want to collaborate? Send us a message and we'll get back to you soon!
        </p>
        <form className="space-y-6 text-left">
          <div>
            <label htmlFor="name" className="block text-lg font-medium text-gray-200 mb-2">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white transition duration-200"
              placeholder="Your Name"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-lg font-medium text-gray-200 mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white transition duration-200"
              placeholder="your.email@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="subject" className="block text-lg font-medium text-gray-200 mb-2">Subject</label>
            <input
              type="text"
              id="subject"
              name="subject"
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white transition duration-200"
              placeholder="Subject of your message"
              required
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-lg font-medium text-gray-200 mb-2">Message</label>
            <textarea
              id="message"
              name="message"
              rows="6"
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white resize-y transition duration-200"
              placeholder="Your message..."
              required
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-xl font-bold rounded-full shadow-lg text-white bg-purple-700 hover:bg-purple-800 transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl cursor-pointer ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900"
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
};

export default ContactForm;