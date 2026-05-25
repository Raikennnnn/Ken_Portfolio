import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
      },
      colors: {
        ink: {
          DEFAULT: "#111111",
          soft: "#2a2a2a",
        },
        paper: {
          DEFAULT: "#f5f1e8",
          soft: "#ebe5d4",
        },
      },
    },
  },
  plugins: [],
};

export default config;
