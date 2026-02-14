/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        'neon-green': '#00ff88',
        'cyber-black': '#050505',
        'cyber-dark': '#0a0a0a',
        'cyber-green': '#00ff88',
        'cyber-green-dim': 'rgba(0, 255, 136, 0.2)',
        'cyber-border': 'rgba(0, 255, 136, 0.15)',
      },
      fontFamily: {
        'mono': ['"JetBrains Mono"', 'monospace'],
        'sans': ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-green': 'pulse-green 2s infinite',
        'rotate-globe': 'rotate-globe 20s linear infinite',
        'scan-move': 'scan-move 4s linear infinite',
      },
      keyframes: {
        'pulse-green': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.2)' },
        },
        'rotate-globe': {
          'from': { transform: 'rotateY(0deg)' },
          'to': { transform: 'rotateY(360deg)' },
        },
        'scan-move': {
          '0%': { top: '-10%' },
          '100%': { top: '110%' },
        },
      }
    },
  },
  plugins: [],
}
