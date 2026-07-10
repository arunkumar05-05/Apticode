/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#05070f',
          900: '#090d1a',
          800: '#0e1428',
          700: '#141c38',
          600: '#1d274e',
        },
        brand: {
          purple: '#8b5cf6', // primary accent HSL 263 90% 64% -> rgb
          cyan: '#06b6d4',   // secondary accent HSL 188 86% 53% -> rgb
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
