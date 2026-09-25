import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        surface: {
          DEFAULT: "var(--bg)",
          soft: "var(--bg-soft)",
          raised: "var(--bg-raised)",
          terminal: "var(--bg-terminal)",
        },
        text: {
          DEFAULT: "var(--fg)",
          soft: "var(--fg-soft)",
          muted: "var(--fg-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          glow: "var(--accent-glow)",
        },
        accent2: {
          DEFAULT: "var(--accent2)",
          glow: "var(--accent2-glow)",
        },
        border: "var(--border)",
        "border-active": "var(--border-active)",
        sec: {
          green: "var(--green)",
          red: "var(--red)",
          amber: "var(--amber)",
        },
      },
      animation: {
        blink: "blink 2s ease-in-out infinite",
        "cursor-blink": "cursorBlink 1s step-end infinite",
        "scroll-pulse": "scrollPulse 2s ease-in-out infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        cursorBlink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        scrollPulse: {
          "0%, 100%": { opacity: "0.3", transform: "scaleX(1)" },
          "50%": { opacity: "1", transform: "scaleX(1.2)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
