import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2f241f",
        paper: "#f8f1e9",
        accent: "#b6402d",
        accentMuted: "#f3d8cc",
        subtle: "#7a6d63",
        border: "#e6d8cc"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      borderRadius: {
        xl: "var(--radius-large)"
      },
      boxShadow: {
        card: "0 20px 45px rgba(32, 22, 16, 0.12)",
        soft: "0 12px 32px rgba(32, 22, 16, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
