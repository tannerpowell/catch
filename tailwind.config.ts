import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#2f241f",
        paper: "#f8f1e9",
        accent: "#b6402d",
        accentMuted: "#f3d8cc",
        subtle: "#7a6d63",
        border: "#e6d8cc",
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617"
        }
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
