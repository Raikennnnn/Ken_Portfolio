// =====================================================================
//  PORTFOLIO CONTENT
//  Edit this single file to update the entire site.
//
//  - To change your profile picture: replace /public/profile.jpg
//    (or update `profile.image` below to point to a new path / URL).
//  - To add a project: copy a block in the `projects` array.
//  - To add a link: add an entry to `links`.
// =====================================================================

export type Project = {
  index: string;        // "01", "02", ... shown as the row marker
  title: string;
  year: string;
  role: string;         // e.g. "Design + Build", "Engineering"
  tags: string[];       // short tech / discipline tags
  summary: string;      // one-liner shown on hover / expand
  url?: string;         // optional live link
  repo?: string;        // optional repo link
};

export type SocialLink = {
  label: string;
  href: string;
};

export const profile = {
  name: "Ken",
  handle: "@ken",
  title: "Software Engineer",
  location: "Earth",
  // Path is relative to /public. Drop your photo there (e.g. /public/profile.jpg)
  // and update this string. Defaults to a generated placeholder portrait.
  image: "/profile.svg",
  bio: [
    "I build small, sturdy things on the web.",
    "Mostly product engineering — interfaces, systems, and the seams between them.",
    "Currently exploring how tools shape the work they help us make.",
  ],
  available: true, // shows the green dot + "available" pill
};

export const links: SocialLink[] = [
  { label: "Email",     href: "mailto:hello@example.com" },
  { label: "GitHub",    href: "https://github.com/Raikennnnn" },
  { label: "LinkedIn",  href: "https://linkedin.com/in/yourhandle" },
  { label: "Twitter",   href: "https://twitter.com/yourhandle" },
];

// Add or remove projects freely. Order here = order on the page.
export const projects: Project[] = [
  {
    index: "01",
    title: "Project Atlas",
    year: "2026",
    role: "Design + Build",
    tags: ["Next.js", "TypeScript", "Postgres"],
    summary:
      "A spatial editor for organising large research libraries. Real-time, collaborative, keyboard-first.",
    url: "https://example.com",
    repo: "https://github.com/Raikennnnn/atlas",
  },
  {
    index: "02",
    title: "Field Notes",
    year: "2025",
    role: "Engineering",
    tags: ["React Native", "SQLite"],
    summary:
      "Offline-first journaling app for fieldwork. Sync resolves conflicts via CRDTs.",
    repo: "https://github.com/Raikennnnn/field-notes",
  },
  {
    index: "03",
    title: "Lumen",
    year: "2024",
    role: "Solo",
    tags: ["WebGL", "Audio"],
    summary:
      "An ambient music visualiser that reacts to the room — generative, low-CPU, beautiful.",
    url: "https://example.com",
  },
];

export const meta = {
  copy: `© ${new Date().getFullYear()} ${profile.name}. Built with care.`,
  // Used in <head> for the document title + description
  siteTitle: `${profile.name} — Portfolio`,
  siteDescription: "A small portfolio of work and writing.",
};
