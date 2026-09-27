// =====================================================================
//  PORTFOLIO CONTENT
//  Edit this single file to update the entire site.
//  Rule of thumb: only list what you have actually done.
// =====================================================================

export type Project = {
  index: string;
  title: string;
  year: string;
  role: string;
  /** Skill names — must match `skills[].name` to count as evidence. */
  stack: string[];
  summary: string;
  /** Concrete security decisions in the project's code. */
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
  category: "language" | "framework" | "practice" | "tool";
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
  /** e.g. "Lab", "Finding" */
  kind: string;
  url: string;
};

export const profile = {
  name: "Ken",
  github: "Raikennnnn",
  title: "BSIT Cybersecurity",
  // Two lines; `headlineAccent` is highlighted inside the second line.
  headline: ["I build systems,", "then I test how they break."],
  headlineAccent: "break.",
  intro:
    "BSIT Cybersecurity student building full-stack apps and games, then security-testing them with OWASP ZAP, Burp Suite, Postman and Chrome DevTools.",
  bio: [
    "I'm a BSIT Cybersecurity student with a deep interest in how things break — and how to make them harder to break.",
    "I build full-stack applications with security baked in from the start, not bolted on after. My favourite work lives at the intersection of secure development and good user experience.",
    "Outside of coursework and code, I'm exploring game development and creative coding.",
  ],
  focus: [
    { label: "Stack", value: "TypeScript · React · PHP · Python" },
    { label: "Security", value: "Secure development · Web security testing" },
    { label: "Interests", value: "Game development · Creative coding" },
  ],
  available: true,
};

export const links: SocialLink[] = [
  { label: "Email", href: "mailto:torreskennethraichen@gmail.com" },
  { label: "GitHub", href: "https://github.com/Raikennnnn" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/kenneth-rt/" },
];

/**
 * Security testing done on our own system. Keep this factual:
 * list the tools used and the attack classes checked — not results you can't show.
 */
export const securityTesting = {
  target: "IntelliDocs",
  scope: "Authorized testing of a system our team built. No third-party targets.",
  tools: [
    { name: "OWASP ZAP", role: "Web application scanner" },
    { name: "Burp Suite", role: "Intercepting proxy" },
    { name: "Postman", role: "Crafted API requests" },
    { name: "Chrome DevTools", role: "Requests, cookies and storage" },
  ],
  checks: [
    { name: "SQL injection", looksFor: "Queries built from user input" },
    { name: "Cross-site scripting", looksFor: "Scripts injected through inputs and URLs" },
    { name: "Input validation & manipulation", looksFor: "Tampered, oversized or unexpected values" },
    { name: "Brute force", looksFor: "Repeated login attempts" },
    { name: "Session hijacking", looksFor: "Exposed or stolen session identifiers" },
    { name: "Session reuse", looksFor: "Sessions still valid after logout" },
    { name: "DDoS / request flooding", looksFor: "High request volume against endpoints" },
  ],
};

export const skills: Skill[] = [
  // Languages
  { name: "TypeScript", category: "language" },
  { name: "PHP", category: "language" },
  { name: "Python", category: "language" },
  { name: "Lua", category: "language" },
  // Frameworks + platforms
  { name: "React", category: "framework" },
  { name: "Next.js", category: "framework" },
  { name: "Tailwind CSS", category: "framework" },
  { name: "MySQL", category: "framework" },
  { name: "Roblox / Rojo", category: "framework" },
  // Security practice (visible in the code)
  { name: "Access control (RBAC)", category: "practice" },
  { name: "Audit logging", category: "practice" },
  { name: "Secure headers / CSP", category: "practice" },
  { name: "Server-authoritative design", category: "practice" },
  // Testing tools
  { name: "OWASP ZAP", category: "tool" },
  { name: "Burp Suite", category: "tool" },
  { name: "Postman", category: "tool" },
  { name: "Chrome DevTools", category: "tool" },
];

export const projects: Project[] = [
  {
    index: "01",
    title: "IntelliDocs",
    year: "2026",
    role: "Full Stack",
    stack: [
      "TypeScript", "React", "PHP", "Python", "MySQL",
      "Access control (RBAC)", "Audit logging",
      "OWASP ZAP", "Burp Suite", "Postman", "Chrome DevTools",
    ],
    summary:
      "Student enrollment system with AI-assisted document verification. Students upload requirements, an OCR service checks them, and registrars review applications from their own portal.",
    security: [
      "Passwords hashed with bcrypt; every query uses PDO prepared statements",
      "Email OTP verification on registration",
      "Role-based access for students, registrars and admins (strict role enum)",
      "Audit trail: activity log + login-attempt log with IP and user agent",
      "OCR service bound to localhost — uploads go through the PHP API, never straight to Python",
      "Security-tested for SQL injection, XSS, session attacks, brute force and request flooding",
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
    stack: ["TypeScript", "Next.js", "React", "Tailwind CSS", "Secure headers / CSP"],
    summary:
      "This site. A quiet, device-style interface in dark and light, with a working terminal (Ctrl+K) and live data from GitHub.",
    security: [
      "Content-Security-Policy, HSTS, frame-ancestors 'none', strict referrer and permissions policies",
      "No third-party scripts; GitHub data is fetched server-side",
      "Publishes /.well-known/security.txt for responsible disclosure",
    ],
    repo: "https://github.com/Raikennnnn/Ken_Portfolio",
  },
];

// Add entries and a section appears automatically. Keep them real — link the verify page.
export const certifications: Certification[] = [];

// Lab notes and findings from your own testing.
export const writeups: Writeup[] = [];

export const meta = {
  siteTitle: "Ken — Cybersecurity Portfolio",
  siteDescription:
    "BSIT Cybersecurity student. I build full-stack apps and games, then test how they break.",
};

/** Projects that list a given skill in their stack. */
export function projectsUsing(skill: string): Project[] {
  return projects.filter((p) => p.stack.includes(skill));
}
