// A made-up identity for this visit: a random handle and the kind of device. Never a location.
// Kept for the tab's session so the name stays the same while you browse.

export type Visitor = { name: string; device: "desktop" | "mobile" };

const WORDS = ["ronin", "shade", "kunai", "cipher", "packet", "vector", "ghost", "byte", "relay", "shell", "static", "signal"];
const KEY = "ken-visitor";

export function getVisitor(): Visitor {
  const device: Visitor["device"] = window.matchMedia("(pointer: coarse)").matches ? "mobile" : "desktop";
  let name: string | null = null;
  try {
    name = sessionStorage.getItem(KEY);
  } catch {
    // storage blocked: a new name each time is fine
  }
  if (!name) {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    name = `${word}-${Math.floor(Math.random() * 0xfff).toString(16).padStart(3, "0")}`;
    try {
      sessionStorage.setItem(KEY, name);
    } catch {
      // ignore
    }
  }
  return { name, device };
}
