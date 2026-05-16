import type { Config } from "tailwindcss";

export default {
  content: ["./options.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: {
          900: "#010a18",
          800: "#051228",
          700: "#0b1a38"
        },
        accent: {
          DEFAULT: "#00ff84",
          soft: "#b8ff33",
          vivid: "#00e0ff",
          gold: "#ffb300"
        }
      },
      boxShadow: {
        glass: "0 24px 60px rgba(0, 0, 0, 0.55)",
        neon: "0 0 0 1px rgba(0,255,132,0.30), 0 0 40px rgba(0,255,132,0.22)"
      },
      backgroundImage: {
        "accent-radial":
          "radial-gradient(circle at top right, rgba(0,255,132,0.30), rgba(184,255,51,0.10), transparent 45%)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
} satisfies Config;
