/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          600: '#475569',
        },
        // CoinMarketCap-inspired dark mode colors
        dark: {
          bg: '#171924',        // Main background
          surface: '#222531',   // Secondary background  
          card: '#2B2E3D',      // Surface layers/cards
          border: '#53596A',    // Borders and separators
          text: {
            primary: '#FFFFFF',   // Primary text
            secondary: '#A1A7BB', // Secondary text
            muted: '#646B80',     // Muted text
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}