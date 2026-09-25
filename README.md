# Ken — Portfolio

A cybersecurity student's portfolio built as an **operator console**: a 3D companion,
a working terminal, and security claims you can verify. Next.js 14 + Tailwind + Three.js.

## What's on the page

- **3D companion** (`components/Companion.tsx`) — stands in the hero, follows the cursor,
  and docks to the corner as you scroll. Click it: wave → identity scan → nod → spin.
  Spam-click it and the "rate limiter" trips (429). Docked, it comments on each section once
  and opens the terminal.
- **Terminal** (`components/Terminal.tsx`) — `Ctrl/⌘ K`, `/` or the header button.
  `help`, `projects`, `open 1`, `skills`, `goto about`, `wave`, `scan`, `sudo …`.
- **Security notes per project** — each project row lists the concrete security decisions
  in the repo (hashing, RBAC, audit logs, server authority).
- **Skills with evidence** — no percentage bars; every skill links to the project that uses it.
- **Live GitHub activity** — fetched server-side, revalidated hourly (`lib/github.ts`).
- **Encrypted photo** — the About photo renders as an ordered dither and "decrypts" on hover.

## Security

- Strict headers in `next.config.mjs`: CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`,
  Referrer-Policy, Permissions-Policy, COOP. No `X-Powered-By`.
- No third-party scripts. The browser never calls GitHub; the server does.
- The 3D loader runs without Draco/Meshopt decoders, so the CSP needs no CDN or `wasm-unsafe-eval`.
  If you ever swap in a compressed `.glb`, update `USE_DRACO` / `USE_MESHOPT` and the CSP together.
- `public/.well-known/security.txt` — update `Expires` yearly.

Check the deployed site at [securityheaders.com](https://securityheaders.com).

## Editing content

Everything lives in **`content/data.ts`**:

| Field | What it does |
| --- | --- |
| `profile.headline` / `intro` / `bio` | Hero headline, subtitle, About text |
| `projects[].stack` | Skill names — this is what links skills to projects |
| `projects[].security` | The "security notes" list for each project |
| `skills[].context` | Shown when no project uses the skill yet |
| `certifications` | Add one and a Certifications block appears (link the verify page) |
| `writeups` | Add one and a Write-ups list appears under Work |

Profile photo: `public/profile-photo.jpg`. 3D model: `public/models/character.glb`
(the companion animates the `head`, `neck`, `shoulder_R`, `elbow_R`, `wrist_R` nodes and the
`Idle` clip — keep those names if you re-export it).

## Ideas for next entries

- **First write-up:** in IntelliDocs `api/ai_verify_upload.php`, the MIME check trusts the
  client-supplied `$_FILES['type']` and only falls back to `finfo` when it's empty. Fix it
  (always use `finfo`), then write up the finding — that's a real vuln-to-fix story.
- TryHackMe / HackTheBox rooms → `writeups`.
- Certifications (e.g. Google Cybersecurity, CompTIA Security+) → `certifications`.
- Once GitHub activity is steady, a contribution graph can join the Activity section.

## Run

```bash
npm install
npm run dev
```

Deploy on Vercel — no environment variables needed.
