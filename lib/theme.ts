// Dark is the site's default ("true") colour; light is opt-in and remembered.

export type Theme = "dark" | "light";

export const THEME_KEY = "ken-theme";

/** Runs inline in <head> before paint so the stored theme never flashes. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}})()`;

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // storage blocked (private mode) — the choice just won't persist
  }
  window.dispatchEvent(new CustomEvent<Theme>("ken:theme", { detail: theme }));
}

export function onThemeChange(handler: (theme: Theme) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<Theme>).detail);
  window.addEventListener("ken:theme", listener);
  return () => window.removeEventListener("ken:theme", listener);
}
