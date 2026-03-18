/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand:       "#4F46E5",
        achievement: "#F59E0B",
        background:  "#FAFAF8",
        reading:     "#F5F0E8",
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
        sans:  ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
