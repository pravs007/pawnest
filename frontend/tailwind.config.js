/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#FAF6F0',      // Soft warm cream background
          cream: '#F4F1DE',      // Medium warm beige
          orange: '#E07A5F',     // Terracotta/soft orange accent
          dark: '#3D405B',       // Deep navy/brown text
          green: '#81B29A',      // Soft health green
          yellow: '#F2CC8F',     // Warm yellow highlight
          brown: '#5D4037',      // Rich chocolate brown
          sand: '#E6CCB2',       // Sandy beige
        }
      },
      fontFamily: {
        sans: ['"Outfit"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
