"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="group flex items-center gap-2 font-mono text-xs uppercase tracking-widest opacity-70 hover:opacity-100 transition"
    >
      <span className="relative inline-flex h-4 w-8 items-center rounded-full border border-current">
        <span
          className="absolute h-3 w-3 rounded-full bg-current transition-transform duration-300"
          style={{ transform: isDark ? "translateX(16px)" : "translateX(2px)" }}
        />
      </span>
      <span>{isDark ? "dark" : "light"}</span>
    </button>
  );
}
