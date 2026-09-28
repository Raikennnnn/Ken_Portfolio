// "Break this site": five harmless flags hidden where a tester looks first.
// Answers are stored as SHA-256 hashes, and progress lives only in the visitor's browser.
//
// Where they are:
//   source   HTML comment in app/layout.tsx
//   robots   public/robots.txt
//   headers  X-Ken-Flag response header (next.config.mjs)
//   notes    `cat .notes` in the terminal (base64)
//   session  set the ken_session cookie's role to "admin" (VisitInspector reads it)

export type Flag = {
  id: string;
  title: string;
  level: "easy" | "medium" | "hard";
  hint: string;
  sha256: string;
};

export const FLAGS: Flag[] = [
  {
    id: "source",
    title: "Page source",
    level: "easy",
    hint: "Every page ships more than it shows. Read it.",
    sha256: "7a80f308e7d3c86589ac38394f24154bf36149b8ad833f728c9e0ddeed29693e",
  },
  {
    id: "robots",
    title: "Robots",
    level: "easy",
    hint: "Crawlers get a file of instructions. Read it too.",
    sha256: "d43266a3ddf2cab859b257fad7ea2f2eceee3726e72f1651305a6d3f14bf064e",
  },
  {
    id: "headers",
    title: "Headers",
    level: "medium",
    hint: "The server says more than the page does. Look at the response in DevTools.",
    sha256: "338836a04d39ec0c4f2e8bf9f9a83db72fadb98e0df8a091f3b1f8844433edf6",
  },
  {
    id: "notes",
    title: "Hidden file",
    level: "medium",
    hint: "The terminal has more files than ls shows.",
    sha256: "6432444c6c36f0202a342a68233b23673519edd1131b07ac8a716b02ab1a00be",
  },
  {
    id: "session",
    title: "Session",
    level: "hard",
    hint: "You're browsing as a guest. The panel at the top of the page believes whatever your cookie says.",
    sha256: "e04a0607fafd5e8952ec68c8121aab620b2986e34c173f6822edde0623539f6f",
  },
];

/** What `cat .notes` prints. Encoded, not encrypted. */
export const NOTES_FILE =
  "bm90ZSB0byBzZWxmOiByb3RhdGUgdGhpcyBiZWZvcmUgbGF1bmNoCmZsYWd7ZW5jb2RpbmdfaXNfbm90X2VuY3J5cHRpb259Cg==";

const STORE_KEY = "ken-ctf";
const EVENT = "ken:ctf";

export function getSolved(): string[] {
  try {
    const ids = JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]");
    return Array.isArray(ids) ? ids.filter((id) => FLAGS.some((f) => f.id === id)) : [];
  } catch {
    return [];
  }
}

function saveSolved(ids: string[]) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(ids));
  } catch {
    // storage blocked: progress lasts until the tab closes
  }
  window.dispatchEvent(new CustomEvent<string[]>(EVENT, { detail: ids }));
}

export function resetSolved() {
  saveSolved([]);
}

export function onSolvedChange(handler: (ids: string[]) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<string[]>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

async function sha256(text: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export type SubmitResult =
  | { status: "new" | "repeat"; flag: Flag; solved: number }
  | { status: "wrong" | "unsupported" };

export async function submitFlag(input: string): Promise<SubmitResult> {
  if (!window.crypto?.subtle) return { status: "unsupported" };
  const hash = await sha256(input.trim().toLowerCase());
  const flag = FLAGS.find((f) => f.sha256 === hash);
  if (!flag) return { status: "wrong" };
  const solved = getSolved();
  if (solved.includes(flag.id)) return { status: "repeat", flag, solved: solved.length };
  const next = [...solved, flag.id];
  saveSolved(next);
  return { status: "new", flag, solved: next.length };
}

// ── The session cookie (flag 5) ──
// A deliberately naive "session": base64 JSON in a readable cookie, trusted by the page.

const COOKIE = "ken_session";

export type Session = { user: string; role: string };

export function readSession(): Session {
  const guest = { user: "guest", role: "guest" };
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw) {
    document.cookie = `${COOKIE}=${btoa(JSON.stringify(guest))}; path=/; max-age=2592000; SameSite=Lax`;
    return guest;
  }
  try {
    const s = JSON.parse(atob(decodeURIComponent(raw)));
    return { user: String(s.user ?? "guest"), role: String(s.role ?? "guest") };
  } catch {
    return { user: "?", role: "unreadable" };
  }
}

/** Shown when the cookie claims admin. Reversed + base64 so it isn't a plain string in the bundle. */
export function adminFlag() {
  return atob("fXRuZWlsY19laHRfdHN1cnRfcmV2ZW57Z2FsZg==").split("").reverse().join("");
}
