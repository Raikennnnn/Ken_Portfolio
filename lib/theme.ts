// Dark is the site's default ("true") colour; light is opt-in and remembered.

export type Theme = "dark" | "light";

export const THEME_KEY = "ken-theme";

/** Runs inline in <head> before paint so the stored theme never flashes. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}})()`;

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // storage blocked (private mode) — the choice just won't persist
  }
  window.dispatchEvent(new CustomEvent<Theme>("ken:theme", { detail: theme }));
}

/**
 * Switch theme with a top-to-bottom "scan": the new theme is revealed behind a red
 * line (see .theme-scan in globals.css). Falls back to an instant switch where View
 * Transitions aren't supported or motion is reduced.
 */
// View Transitions aren't in this TypeScript version's DOM types yet.
type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

export function setTheme(theme: Theme) {
  const root = document.documentElement;
  const doc = document as ViewTransitionDocument;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (theme === getTheme() || reduced || !doc.startViewTransition) {
    applyTheme(theme);
    return;
  }
  root.classList.add("theme-switching");
  doc
    .startViewTransition(() => applyTheme(theme))
    .finished.finally(() => root.classList.remove("theme-switching"));
}

export function onThemeChange(handler: (theme: Theme) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<Theme>).detail);
  window.addEventListener("ken:theme", listener);
  return () => window.removeEventListener("ken:theme", listener);
}
