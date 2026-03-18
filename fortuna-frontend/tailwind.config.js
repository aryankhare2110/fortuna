/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        casino: {
          black:            "#0a0a0a",
          darkbg:           "#111111",
          card:             "#1a1a1a",
          border:           "#2a2a2a",
          gold:             "#c9a84c",
          "gold-light":     "#e8c97a",
          "gold-dark":      "#9a7a2e",
          muted:            "#6b6b6b",
          text:             "#e8e8e8",
          "text-secondary": "#a0a0a0",
          success:          "#22c55e",
          danger:           "#ef4444",
          warning:          "#f59e0b",
        }
      },
      fontFamily: {
        sans:  ["Inter", "system-ui", "sans-serif"],
        serif: ["Georgia", "serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #c9a84c 0%, #e8c97a 50%, #c9a84c 100%)",
        "card-gradient": "linear-gradient(180deg, #1e1e1e 0%, #141414 100%)",
      },
      boxShadow: {
        "gold":    "0 0 20px rgba(201, 168, 76, 0.15)",
        "gold-lg": "0 0 40px rgba(201, 168, 76, 0.25)",
        "card":    "0 4px 24px rgba(0, 0, 0, 0.6)",
      },
      animation: {
        "spin-slow":  "spin 3s linear infinite",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "flip":       "flip 0.6s ease-in-out",
        "deal":       "deal 0.3s ease-out",
        "fade-in":    "fadeIn 0.4s ease-out",
        "slide-up":   "slideUp 0.3s ease-out",
      },
      keyframes: {
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(201,168,76,0.2)" },
          "50%":      { boxShadow: "0 0 30px rgba(201,168,76,0.5)" },
        },
        flip: {
          "0%":   { transform: "rotateY(0deg)" },
          "50%":  { transform: "rotateY(90deg)" },
          "100%": { transform: "rotateY(0deg)" },
        },
        deal: {
          "0%":   { transform: "translateY(-20px) rotate(-5deg)", opacity: "0" },
          "100%": { transform: "translateY(0) rotate(0deg)",      opacity: "1" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}