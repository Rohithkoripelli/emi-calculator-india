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
        // Enhanced dark mode colors inspired by CoinMarketCap
        dark: {
          // Background layers with proper contrast ratios
          bg: '#171924',           // Main background - matches CMC
          surface: '#222531',      // Secondary surface - card backgrounds
          card: '#2B2E3D',         // Elevated surfaces - better layering
          border: '#3B4259',       // Borders and separators
          
          // Text colors with optimal contrast
          text: {
            primary: '#FFFFFF',    // Primary text - pure white for maximum contrast
            secondary: '#A1A7BB',  // Secondary text - CMC inspired
            muted: '#646B80',      // Muted text - CMC caption color
            accent: '#6188FF',     // Accent/link color
          },
          
          // Financial value colors
          value: {
            positive: '#16C784',   // Green for gains - CMC green
            negative: '#EA3943',   // Red for losses - CMC red
            neutral: '#A1A7BB',    // Neutral values
          },
          
          // Enhanced background variations
          highlight: {
            blue: '#1E3A8A',       // Blue highlight background
            green: '#065F46',      // Green highlight background  
            red: '#7F1D1D',        // Red highlight background
            yellow: '#78350F',     // Yellow/warning highlight
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