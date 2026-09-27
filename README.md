# Ken — Portfolio

Personal portfolio of a BSIT Cybersecurity student. A quiet, device-style interface
(inspired by the menu design of NINJA GAIDEN 4) in black and red, with a light mode.
Next.js 14 + Tailwind.

## Design

- **Dark is the default; light is opt-in.** The toggle in the header (or `theme` in the
  terminal) switches modes; the choice is saved and applied before first paint.
- **Red is rationed:** the selected item, the kanji marks, one accent word. Everything else is
  hairlines, a faint grid and three typefaces — Noto Serif JP (headings + kanji),
  IBM Plex Sans (body), IBM Plex Mono (labels).
- **Motion is ease-out and short.** Full-screen transitions open slower than they close
  (terminal: ~0.45 s in, 0.22 s out). The open project drifts gently, like a highlighted menu item.
- **Kanji, always with an English meaning:** 検 (ken, "to inspect") as the mark,
  検証防御 ("verify, defend") in the hero, and one word per section —
  作品 works · 検証 verification · 技能 skills · 記録 log · 人物 profile · 連絡 contact.

## What's on the page

- **Selected work** — each project lists concrete security decisions found in its code.
- **Security testing** — the tools used (OWASP ZAP, Burp Suite, Postman, Chrome DevTools) and
  the attack classes checked on our own system. Only what has actually been done.
- **Capabilities** — every skill links to the project that uses it. No percentage bars.
- **Activity** — live repository feed, fetched server-side and cached for an hour (`lib/github.ts`).
- **About** — dithered portrait that reveals the photo on hover/tap.
- **Terminal** — `Ctrl/⌘ K`, `/` or the header button. `help`, `projects`, `open 1`,
  `security`, `skills`, `goto about`, `theme light`.

## Editing content

Everything lives in **`content/data.ts`**. Rule of thumb: only list what you have done.

| Field | What it does |
| --- | --- |
| `profile` | Headline, intro, bio, focus rows |
| `securityTesting` | Target, scope, tools and checks in the Security section |
| `projects[].stack` | Skill names — this links skills to projects |
| `projects[].security` | The "security notes" list for each project |
| `certifications` / `writeups` | Add an entry and its block appears (link a verify page) |

Profile photo: `public/profile-photo.jpg`.

## Security

- Strict headers in `next.config.mjs`: CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`,
  Referrer-Policy, Permissions-Policy, COOP. No `X-Powered-By`.
- No third-party scripts. The browser never calls GitHub; the server does.
- `public/.well-known/security.txt` — update `Expires` yearly.

## Run

```bash
npm install
npm run dev
```

Deploys on Vercel with no environment variables.
