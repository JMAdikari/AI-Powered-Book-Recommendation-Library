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
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "scale(0.95) translateY(-4px)" },
          to:   { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
      },
    },
  },
  plugins: [],
}
