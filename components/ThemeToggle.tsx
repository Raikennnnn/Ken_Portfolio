"use client";

import { useEffect, useState } from "react";
import { getTheme, onThemeChange, setTheme, type Theme } from "@/lib/theme";
import { initThemeScan } from "@/lib/themeTransition";

export function ThemeToggle() {
  const [theme, setLocal] = useState<Theme>("dark");

  useEffect(() => {
    setLocal(getTheme());
    return onThemeChange(setLocal);
  }, []);

  // Get the "screen breaks" frames ready in idle time, so the switch starts instantly.
  useEffect(() => initThemeScan(), []);

  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      data-sound="none"
      onClick={() => setTheme(next)}
      className="btn w-9 justify-center px-0"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {theme === "dark" ? (
        // Sun: offer light mode
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // Moon: back to dark
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      )}
    </button>
  );
}
