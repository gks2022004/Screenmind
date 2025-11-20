/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./types.ts",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'neo': '4px 4px 0 0 rgba(0,0,0,1)',
        'neo-lg': '8px 8px 0 0 rgba(0,0,0,1)',
        'neo-sm': '2px 2px 0 0 rgba(0,0,0,1)',
        'neo-white': '4px 4px 0 0 rgba(255,255,255,1)',
      },
      colors: {
        neo: {
          bg: '#f0f0f0',
          dark: '#121212',
          primary: '#8b5cf6', // Violet
          secondary: '#10b981', // Emerald
          accent: '#f43f5e', // Rose
          yellow: '#fbbf24', // Amber
        }
      },
      animation: {
        'slide-up': 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'pop': 'pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
