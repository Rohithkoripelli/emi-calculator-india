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
        // Improved dark mode colors with better contrast
        dark: {
          bg: '#0B0E14',        // Main background - darker for better contrast
          surface: '#1A1D29',   // Secondary background - lighter contrast
          card: '#252A3A',      // Surface layers/cards - better visibility
          border: '#3B4259',    // Borders and separators - more visible
          text: {
            primary: '#FFFFFF',   // Primary text - high contrast white
            secondary: '#E2E8F0', // Secondary text - much lighter for visibility
            muted: '#94A3B8',     // Muted text - lighter but still readable
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