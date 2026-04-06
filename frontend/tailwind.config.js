/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand:       "#6C5CE7",
        achievement: "#F59E0B",
        background:  "#0A0A10",
        reading:     "#13131F",
        surface:     "#13131F",
        "surface-2": "#1A1A2E",
        "border-dark": "#1E1E30",
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
