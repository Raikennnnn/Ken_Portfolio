# Ken — Portfolio

A minimal, editorial-style personal portfolio. Built with Next.js + Tailwind, deploys to Vercel in one click.

## Design

Most portfolios are hero-image + grid-of-cards. This one isn't.
- **Editorial layout** — feels like a printed personal record. Serif headlines, monospace marginalia, paper texture in light mode, cursor-following spotlight in dark mode.
- **Row-per-project** — each project is a full-width row with index number, role, year. Click a row to expand it inline. No modals, no routing.
- **One file edits everything** — see `content/data.ts`.
- **Light + dark** — toggle in the header. Respects system preference, persists in localStorage.

## Quickstart

```bash
npm install
npm run dev
# open http://localhost:3000
```

## How to update content

Everything lives in **`content/data.ts`**.

### Change the profile picture
1. Drop your image into `public/` (e.g. `public/profile.jpg`).
2. Update `profile.image` in `content/data.ts` to `"/profile.jpg"`.

The placeholder is `public/profile.svg` — replace or repoint as needed. Any image URL also works (remote URLs are allowed via `next.config.mjs`).

### Add a project
Open `content/data.ts` and append to the `projects` array:

```ts
{
  index: "04",
  title: "New Thing",
  year: "2026",
  role: "Engineering",
  tags: ["TypeScript", "Whatever"],
  summary: "One-liner that shows when the row expands.",
  url: "https://example.com",   // optional
  repo: "https://github.com/...", // optional
}
```

That's it. Order in the array = order on the page.

### Edit the bio / name / links
Same file — `profile.bio` is an array (first line becomes the giant headline). `links` is the contact list at the bottom.

## Deploy to Vercel

1. Push this repo to GitHub (already done if you got here from Kiro).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Vercel auto-detects Next.js — just click Deploy.

No environment variables needed.

## Project structure

```
app/
  layout.tsx        # root layout, theme provider, fonts
  page.tsx          # the only page
  globals.css       # tokens, paper texture, spotlight
components/
  Header.tsx        # nav + theme toggle + "available" pill
  Hero.tsx          # portrait + bio
  Work.tsx          # section wrapper for projects
  ProjectRow.tsx    # one expandable row
  About.tsx         # colophon-style about
  Contact.tsx       # large CTA + link list
  ThemeProvider.tsx # light/dark + cursor tracking
  ThemeToggle.tsx   # the toggle pill
content/
  data.ts           # ← edit this to update the site
public/
  profile.svg       # ← replace with your photo
  favicon.svg
```
