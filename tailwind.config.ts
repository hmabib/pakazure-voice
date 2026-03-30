import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0a0f1e",
          navy: "#1A3C6E",
          blue: "#2E6DB4",
          light: "#4A90D9",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      animation: {
        "orb-idle": "orb-idle 4s ease-in-out infinite",
        "orb-listening": "orb-listening 1.5s ease-in-out infinite",
        "orb-thinking": "orb-thinking 2s linear infinite",
        "orb-speaking": "orb-speaking 0.8s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
      },
      keyframes: {
        "orb-idle": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
        },
        "orb-listening": {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 30px rgba(74,144,217,0.4)" },
          "50%": { transform: "scale(1.12)", boxShadow: "0 0 60px rgba(74,144,217,0.8)" },
        },
        "orb-thinking": {
          "0%": { filter: "hue-rotate(0deg) brightness(1)" },
          "50%": { filter: "hue-rotate(30deg) brightness(1.2)" },
          "100%": { filter: "hue-rotate(0deg) brightness(1)" },
        },
        "orb-speaking": {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 40px rgba(46,109,180,0.6)" },
          "25%": { transform: "scale(1.15)", boxShadow: "0 0 80px rgba(46,109,180,0.9)" },
          "75%": { transform: "scale(0.95)", boxShadow: "0 0 20px rgba(46,109,180,0.4)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
