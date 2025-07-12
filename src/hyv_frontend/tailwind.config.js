// filepath: src/hyv_frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hyv-dark-green': '#09391A',
        'hyv-medium-green': '#10692F',
        'hyv-light-green': '#42EE68',
        'hyv-gray': '#829288',
      }
    },
  },
  plugins: [],
}