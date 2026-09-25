// =====================================================================
//  PORTFOLIO CONTENT
//  Edit this single file to update the entire site.
// =====================================================================

export type Project = {
  index: string;
  title: string;
  year: string;
  role: string;
  /** Skill names — must match `skills[].name` to count as evidence. */
  stack: string[];
  summary: string;
  /** Concrete security decisions in the project. Shown as "security notes". */
  security: string[];
  url?: string;
  repo?: string;
};

export type SocialLink = {
  label: string;
  href: string;
};

export type Skill = {
  name: string;
  category: "language" | "framework" | "security";
  /**
   * Where the skill was practised when no project lists it yet.
   * Skills used in a project get their evidence from `projects[].stack`.
   */
  context?: string;
};

export type Certification = {
  name: string;
  issuer: string;
  year: string;
  verifyUrl?: string;
};

export type Writeup = {
  title: string;
  date: string;
  /** e.g. "CTF", "Lab", "Finding" */
  kind: string;
  url: string;
};

export const profile = {
  name: "Ken",
  handle: "ken@sec",
  github: "Raikennnnn",
  title: "BSIT Cybersecurity",
  // Rendered as two lines; `accent` is highlighted inside the second line.
  headline: ["I study how systems break.", "Then I build ones that don't."],
  headlineAccent: "don't.",
  intro:
    "BSIT Cybersecurity student building full-stack apps and games with security designed in — hashed credentials, audit trails, and servers that never trust the client.",
  bio: [
    "I'm a BSIT Cybersecurity student with a deep interest in how things break — and how to make them harder to break.",
    "I build full-stack applications with security baked in from the start, not bolted on after. My favourite work lives at the intersection of secure development and good user experience.",
    "When I'm not studying protocols or writing code, I'm exploring game development, creative coding, and the occasional CTF challenge.",
  ],
  focus: [
    { label: "stack", value: "TypeScript · React · PHP · Python" },
    { label: "security", value: "Secure dev · Access control · Audit logging" },
    { label: "interests", value: "Game dev · 3D · CTFs · Creative coding" },
  ],
  available: true,
};

export const links: SocialLink[] = [
  { label: "Email", href: "mailto:torreskennethraichen@gmail.com" },
  { label: "GitHub", href: "https://github.com/Raikennnnn" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/kenneth-rt/" },
];

export const skills: Skill[] = [
  // Languages
  { name: "TypeScript", category: "language" },
  { name: "PHP", category: "language" },
  { name: "Python", category: "language" },
  { name: "Lua", category: "language" },
  // Frameworks + platforms
  { name: "React", category: "framework" },
  { name: "Next.js", category: "framework" },
  { name: "Three.js", category: "framework" },
  { name: "Tailwind CSS", category: "framework" },
  { name: "MySQL", category: "framework" },
  { name: "Roblox / Rojo", category: "framework" },
  // Security + tools
  { name: "Access control (RBAC)", category: "security" },
  { name: "Audit logging", category: "security" },
  { name: "Secure headers / CSP", category: "security" },
  { name: "Server-authoritative design", category: "security" },
  // TODO(ken): adjust `context` to where you actually used these.
  { name: "Linux / CLI", category: "security", context: "coursework · daily driver" },
  { name: "Wireshark / Nmap", category: "security", context: "coursework · CTF practice" },
];

export const projects: Project[] = [
  {
    index: "01",
    title: "IntelliDocs",
    year: "2026",
    role: "Full Stack",
    stack: ["TypeScript", "React", "PHP", "Python", "MySQL", "Access control (RBAC)", "Audit logging"],
    summary:
      "Student enrollment system with AI-assisted document verification. Students upload requirements, an OCR service checks them, and registrars review applications from their own portal.",
    security: [
      "Passwords hashed with bcrypt; every query uses PDO prepared statements",
      "Email OTP verification on registration",
      "Role-based access for students, registrars and admins (strict role enum)",
      "Audit trail: activity log + login-attempt log with IP and user agent",
      "OCR service bound to localhost — browser uploads go through the PHP API, never straight to Python",
    ],
    repo: "https://github.com/Raikennnnn/IntelliDocs",
  },
  {
    index: "02",
    title: "Stonebound Factory",
    year: "2026",
    role: "Game Dev",
    stack: ["Lua", "Roblox / Rojo", "Server-authoritative design"],
    summary:
      "Roll stones. Power machines. Build your fortune. A factory-automation game for Roblox, built with a Rojo toolchain and a service-based server architecture.",
    security: [
      "Server-authoritative: the server owns rolls, prices, inventory and currency",
      "Rolls are triggered by an in-world lever with a server-side cooldown — no client roll button to spam",
      "Tested against rapid and invalid requests from the client",
    ],
    repo: "https://github.com/Raikennnnn/stonebound-factory",
  },
  {
    index: "03",
    title: "Ken Portfolio",
    year: "2026",
    role: "Design + Dev",
    stack: ["TypeScript", "Next.js", "React", "Three.js", "Tailwind CSS", "Secure headers / CSP"],
    summary:
      "This site — an operator console with a 3D companion, a working terminal (press Ctrl+K), and live data from GitHub.",
    security: [
      "Content-Security-Policy, HSTS, frame-ancestors 'none', strict referrer + permissions policies",
      "No third-party scripts; GitHub data is fetched server-side",
      "Publishes /.well-known/security.txt for responsible disclosure",
    ],
    repo: "https://github.com/Raikennnnn/Ken_Portfolio",
  },
];

// Add entries and a section appears automatically. Keep them real — link the verify page.
export const certifications: Certification[] = [
  // { name: "Google Cybersecurity Certificate", issuer: "Google", year: "2026", verifyUrl: "https://..." },
];

// CTF write-ups, lab notes, findings. First good candidate: see README "Ideas".
export const writeups: Writeup[] = [
  // { title: "HTB Starting Point: Meow", date: "Oct 2026", kind: "CTF", url: "https://..." },
];

export const meta = {
  copy: `© ${new Date().getFullYear()} Ken. All packets accounted for.`,
  siteTitle: "Ken — Cybersecurity Portfolio",
  siteDescription:
    "BSIT Cybersecurity student. I study how systems break, then build ones that don't.",
};

/** Projects that list a given skill in their stack. */
export function projectsUsing(skill: string): Project[] {
  return projects.filter((p) => p.stack.includes(skill));
}
