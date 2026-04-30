import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm dark — lighter than before, editorial midnight rather than basement noir
        ink: {
          950: "#231C14",
          900: "#2A2118",
          800: "#352A1F",
          700: "#403428",
          600: "#544535",
        },
        // Parchment / aged paper — high-contrast foreground
        cream: {
          50: "#FAF3DE",
          100: "#F4ECD2",
          200: "#E5D6B5",
          300: "#C8B58F",
          400: "#A39579",
          500: "#807461",
        },
        // Vermillion seal — Cafe Hanoi flag red softened toward terracotta
        vermillion: {
          DEFAULT: "#D85436",
          light: "#EB7253",
          dark: "#A33820",
          ink: "#5C2418",
        },
        // Bamboo green — herb tones from Vietnamese cuisine
        bamboo: {
          DEFAULT: "#8DA468",
          dark: "#5F6F46",
        },
        // Lantern amber — warning / caution
        amber: {
          warm: "#E2AE5A",
          deep: "#B5852F",
        },
        // Functional aliases (used by existing components)
        bg: "#2A2118",
        panel: "#352A1F",
        border: "#544535",
        muted: "#A39579",
        text: "#F4ECD2",
        accent: "#D85436",
        warn: "#E2AE5A",
        bad: "#D14B2E",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: {
        eyebrow: "0.18em",
      },
      boxShadow: {
        plate: "0 1px 0 rgba(244, 236, 210, 0.04) inset, 0 0 0 1px rgba(244, 236, 210, 0.04)",
        seal: "0 0 0 1px rgba(216, 84, 54, 0.4), 0 1px 0 rgba(216, 84, 54, 0.15)",
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.05 0 0 0 0 0.04 0 0 0 0 0.03 0 0 0 0.4 0'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.4'/></svg>\")",
      },
    },
  },
  plugins: [],
};

export default config;
