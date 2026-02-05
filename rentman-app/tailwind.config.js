/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#00ff88",
        background: "#050505",
        surface: "#0a0a0a",
        border: "rgba(255, 255, 255, 0.1)",
      },
      fontFamily: {
        mono: ["System"], // Will eventually use JetBrains Mono
        sans: ["System"], // Will eventually use Inter
      }
    },
  },
  plugins: [],
}
