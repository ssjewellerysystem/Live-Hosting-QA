/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#111827',
        darkCard: '#1F2937',
        darkBorder: '#374151',
      }
    },
  },
  plugins: [],
}
