# Ken's portfolio

Portfolio of Kenneth Raichen B. Torres (Ken), BSIT Cybersecurity student.
Next.js 15 + Tailwind, black and red with a light mode. The look borrows from the
NINJA GAIDEN 4 menus: hairlines, a faint grid, one red accent, short ease-out motion.

## Sections

The hero panel inspects the visit (検, ken, means "to inspect"): browser, timezone, screen,
referrer, this site's security headers and the visitor's CTF progress. It all runs in the
browser and nothing is stored or sent.

1. About. Bio, and a dithered portrait that resolves into the photo on hover or tap.
2. Experience. Real roles only (`experience` in `content/data.ts`).
3. Selected work. Each project lists the security decisions in its code, plus its last
   push from GitHub. Public repos that aren't listed as projects show up under "Other repositories".
4. Security testing. One entry per system tested: scope, tools, checks and findings.
5. Credentials. Exam-based certifications first, then Cisco Networking Academy course badges,
   all linked to Credly (public `credly.com/badges/<id>` links). The CCNA items are course
   completions: never label them "CCNA certified".
6. Skills. Each skill links to the project or assessment that uses it, including the AI tools used.
7. Break this site. Five harmless flags hidden where a tester looks first. Answers are
   SHA-256 hashes in `lib/ctf.ts` (the file header says where each flag lives); progress is
   kept in `localStorage`.
8. Contact.

The terminal opens with `Ctrl/⌘ K`, `/` or the header button. Try `help`, `projects`,
`open 1`, `security 1`, `certs`, `ctf`, `submit flag{...}`, `ls -a`, `goto about` or `theme light`.

The old 3D companion is archived in `extras/ken3d-companion/` (not built with the site).

## Editing content

All content is in `content/data.ts`. Only list things you have actually done.

| Field | Used for |
| --- | --- |
| `profile` | Name, headline, intro, bio, focus rows |
| `projects` | Selected work. `stack` names must match `skills` to link them |
| `assessments` | Security testing. Add real `findings` (issue + fix) as you have them |
| `securityTools`, `securityChecks` | One-line descriptions that assessments reference by name |
| `experience` | Roles, shown in the Experience section |
| `certifications` | Certifications (`group: "exam"`) and course badges, with Credly links; `skills` links a cert to a skill |
| `writeups` | Empty for now; adding an entry makes its block appear |

The profile photo is `public/profile-photo.jpg`.

## Security

- Headers are set in `next.config.mjs`: CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`,
  Referrer-Policy, Permissions-Policy and COOP. `X-Powered-By` is off.
- No third-party scripts. GitHub is called from the server, never from the browser.
- `public/.well-known/security.txt` needs its `Expires` date updated every year.

## Running it

```bash
npm install
npm run dev
```

Deploys to Vercel with no environment variables.
