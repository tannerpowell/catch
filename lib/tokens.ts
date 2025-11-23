/**
 * Design tokens for The Catch restaurant website.
 * Customize fonts and colors here.
 */
export const tokens = {
  colors: {
    ink: "#0E0E10",              // near-black body text
    paper: "#FFFFFF",
    accent: "#B45309",           // warm amber accent
    accentMuted: "#FDE68A",
    border: "#E5E7EB",
    subtle: "#6B7280"
  },
  radii: {
    sm: "0.5rem",
    md: "1rem",
    xl: "1.25rem",
    pill: "9999px"
  },
  shadow: {
    card: "0 8px 24px rgba(16,24,40,.08)"
  },
  // Typography scale
  type: {
    display: "Playfair Display, ui-serif, Georgia, serif",
    body: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, 'Apple Color Emoji','Segoe UI Emoji'"
  }
} as const;
