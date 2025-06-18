/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'], // Define Inter font
      },
      colors: {
        'primary-dark': '#1a202c',
        'secondary-gray': '#e2e8f0',
        'accent-blue': '#4299e1',
        'accent-dark-blue': '#2b6cb0',
      },
      boxShadow: {
        'custom-light': '0 4px 10px rgba(0, 0, 0, 0.05)',
        'custom-dark': '0 10px 15px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}

