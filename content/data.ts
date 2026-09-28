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
  /** Shows a live data block in the row (fetched server-side). */
  live?: "honeypot";
  /** Not done yet: only shown when NEXT_PUBLIC_SHOW_DRAFTS=1 (local previews). */
  draft?: boolean;
};

export type SocialLink = {
  label: string;
  href: string;
};

export type Skill = {
  name: string;
  category: "language" | "framework" | "practice" | "tool" | "ai";
};

export type Certification = {
  name: string;
  issuer: string;
  /** Issue date as shown on the badge, e.g. "Jul 2025" */
  date: string;
  /** "exam" = passed a certification exam; the others are course-completion badges. */
  group: "exam" | "security" | "networking";
  /** Public Credly link (credly.com/badges/<id>, not the earner "share" link). */
  verifyUrl: string;
  expires?: string;
  /** Skill names this certification is evidence for. */
  skills?: string[];
};

export type Experience = {
  role: string;
  org: string;
  year: string;
  points: string[];
  /** In-page links to the matching project / assessment */
  links: { label: string; href: string }[];
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
  fullName: "Kenneth Raichen B. Torres",
  github: "Raikennnnn",
  title: "BSIT Cybersecurity",
  // Two lines; `headlineAccent` is highlighted inside the second line.
  headline: ["I build systems,", "then I test how they break."],
  headlineAccent: "break.",
  // The intro is rendered as "I'm <fullName>, " + intro.
  intro:
    "a BSIT Cybersecurity student. I love finding something new on a website, so I build web apps that try to do things a little differently, then test them the way an attacker would.",
  bio: [
    "I'm a BSIT Cybersecurity student who wants to understand the real work behind cybersecurity: how systems get attacked, how they're defended, and what it takes to do that job well.",
    "I learn best by taking on challenges I'm not ready for yet. I'm willing to take a leap of faith, fail, and try again, because every mistake teaches me something a textbook can't.",
    "Right now I'm focused on sharpening my skills, one project and one test at a time. Outside of school I make games and small creative-coding experiments.",
  ],
  focus: [
    { label: "Stack", value: "TypeScript · React · PHP · Python" },
    { label: "Security", value: "Web security testing · Quality checking" },
    { label: "Interests", value: "Creative web experiences · Game dev (hobby)" },
  ],
  available: true,
};

export const links: SocialLink[] = [
  { label: "Email", href: "mailto:torreskennethraichen@gmail.com" },
  { label: "GitHub", href: "https://github.com/Raikennnnn" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/kenneth-rt/" },
];

// ---------------------------------------------------------------------
//  Security testing
//  One entry per system you have tested. Tools and checks are named from
//  the catalogs below, so a new assessment only lists what you actually ran.
//  Keep it factual: what was tested and how — not results you can't show.
// ---------------------------------------------------------------------

export const securityTools = {
  "OWASP ZAP": "Web application scanner",
  "Burp Suite": "Intercepting proxy",
  "Postman": "Crafted API requests",
  "Chrome DevTools": "Requests, cookies and storage",
} as const;

export const securityChecks = {
  "SQL injection": "Queries built from user input",
  "Cross-site scripting": "Scripts injected through inputs and URLs",
  "Input validation & manipulation": "Tampered, oversized or unexpected values",
  "Brute force": "Repeated login attempts",
  "Session hijacking": "Exposed or stolen session identifiers",
  "Session reuse": "Sessions still valid after logout",
  "Request flooding / rate limits": "High request volume against endpoints",
} as const;

export type SecurityTool = keyof typeof securityTools;
export type SecurityCheck = keyof typeof securityChecks;

export type Assessment = {
  index: string;
  target: string;
  /** e.g. "Web application", "API", "Game server" */
  type: string;
  year: string;
  /** How you were allowed to test it. */
  scope: string;
  summary: string;
  tools: SecurityTool[];
  checks: SecurityCheck[];
  /** Real results only. The block is hidden while the list is empty. */
  findings?: { issue: string; fix: string }[];
  url?: string;
  repo?: string;
};

export const assessments: Assessment[] = [
  {
    index: "01",
    target: "IntelliDocs",
    type: "Web application",
    year: "2026",
    scope: "Authorized testing of our team's capstone project. No third-party targets.",
    summary:
      "My main role on the team. I tested the web app and its API the way an attacker would look at it: intercepting requests, tampering with input and probing authentication and sessions. I reported what I found to the developer, who fixed and hardened it.",
    tools: ["OWASP ZAP", "Burp Suite", "Postman", "Chrome DevTools"],
    checks: [
      "SQL injection",
      "Cross-site scripting",
      "Input validation & manipulation",
      "Brute force",
      "Session hijacking",
      "Session reuse",
      "Request flooding / rate limits",
    ],
    // Add what you found and how it was fixed, e.g.
    // { issue: "Session stayed valid after logout", fix: "Session is destroyed and regenerated on logout" },
    findings: [],
    repo: "https://github.com/Raikennnnn/IntelliDocs",
  },
];

export const skillGroups: { key: Skill["category"]; label: string }[] = [
  { key: "language", label: "Languages" },
  { key: "framework", label: "Frameworks & platforms" },
  { key: "practice", label: "Security practice" },
  { key: "tool", label: "Testing tools" },
  { key: "ai", label: "AI tools" },
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
  // AI tools used while building (listed openly)
  { name: "Claude Code", category: "ai" },
  { name: "Codex", category: "ai" },
  { name: "Gemini", category: "ai" },
];

const allProjects: Project[] = [
  {
    index: "01",
    title: "IntelliDocs",
    year: "2026",
    role: "First version · Security & QA",
    stack: [
      "TypeScript", "React", "PHP", "Python", "MySQL",
      "Access control (RBAC)", "Audit logging",
    ],
    summary:
      "Our capstone: a student enrollment system with AI-assisted document verification. Students upload requirements, an OCR service checks them, and registrars review applications from their own portal. I built the first version, then handed development to a teammate and worked as the team's security tester and QA: reporting issues and suggesting what to change or keep.",
    security: [
      "Passwords hashed with bcrypt; every query uses PDO prepared statements",
      "Email OTP verification on registration",
      "Role-based access for students, registrars and admins (strict role enum)",
      "Audit trail: activity log + login-attempt log with IP and user agent",
      "OCR service only listens on localhost; uploads go through the PHP API, never straight to Python",
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
      "Rolls come from an in-world lever with a server-side cooldown, so there is no client button to spam",
      "Tested against rapid and invalid requests from the client",
    ],
    repo: "https://github.com/Raikennnnn/stonebound-factory",
  },
  {
    index: "03",
    title: "Ken Portfolio",
    year: "2026",
    role: "Design + Dev",
    stack: ["TypeScript", "Next.js", "React", "Tailwind CSS", "Secure headers / CSP", "Claude Code"],
    summary:
      "This site. It inspects your visit, hides a five-flag capture-the-flag, and has a working terminal (Ctrl+K).",
    security: [
      "Content-Security-Policy, HSTS, frame-ancestors 'none', strict referrer and permissions policies",
      "No third-party scripts; GitHub data is fetched server-side",
      "Publishes /.well-known/security.txt for responsible disclosure",
      "CTF answers are checked against SHA-256 hashes in the browser; nothing is sent to a server",
    ],
    repo: "https://github.com/Raikennnnn/Ken_Portfolio",
  },
  {
    index: "04",
    title: "Higanbana",
    year: "2026",
    role: "SSH honeypot threat intel",
    stack: ["Python", "PostgreSQL", "Docker", "MITRE ATT&CK", "Threat modeling"],
    summary:
      "Named after the red spider lily (彼岸花), planted around Japanese rice fields because its poisonous bulbs keep pests away. A pipeline that turns SSH honeypot logs into explainable threat intel: it deduplicates Cowrie events, labels each session with rules mapped to MITRE ATT&CK, and publishes only aggregated numbers. It currently analyses the public CyberLab honeynet dataset (about 50 Cowrie honeypots, IPs pseudonymised by its authors). My own hardened sensor is built and firewall-tested, and goes live when I have cloud access.",
    security: [
      "Every log line is treated as hostile: size limits, type checks, parameterised SQL only",
      "Public output is aggregates only, with no IPs, commands or URLs; a test checks that none leak into the export",
      "A password is shown only if 20+ different sources tried it, so real leaked credentials stay out",
      "This block is validated server-side before it renders; bad data hides it instead of breaking the page",
      "Sensor design: all outbound traffic blocked and SSH forwarding off, so it can't be used against anyone else",
    ],
    live: "honeypot",
  },
];

export const projects: Project[] = allProjects.filter(
  (p) => !p.draft || process.env.NEXT_PUBLIC_SHOW_DRAFTS === "1",
);

// Only real roles. One entry is fine; don't pad it.
export const experience: Experience[] = [
  {
    role: "Developer, then security tester & QA",
    org: "IntelliDocs capstone team · FEU Institute of Technology",
    year: "2026",
    points: [
      "Built the first version of IntelliDocs, our enrollment system with AI-assisted document verification, then handed development to a teammate.",
      "Became the team's security tester and QA: tested the web app and its API with Burp Suite, OWASP ZAP, Postman and Chrome DevTools.",
      "Reported issues to the developer and suggested what to change or keep; they were fixed and hardened.",
    ],
    links: [
      { label: "Project", href: "#work" },
      { label: "Security assessment", href: "#security" },
    ],
  },
];

// Every entry is verifiable on Credly. "exam" entries are certifications earned by passing an exam.
// The Cisco Networking Academy entries are course completions: never label them "CCNA certified"
// (that is a separate exam).
export const certifications: Certification[] = [
  {
    name: "Cisco Certified Support Technician (CCST) Networking",
    issuer: "Cisco",
    date: "Feb 2025",
    group: "exam",
    verifyUrl: "https://www.credly.com/badges/d43ef14e-8225-4c23-8e49-91def5441079",
  },
  {
    name: "IT Specialist – Python",
    issuer: "Certiport (Pearson VUE)",
    date: "Feb 2025",
    group: "exam",
    verifyUrl: "https://www.credly.com/badges/76719a57-398b-440a-b5a2-25b1dd37d896",
    skills: ["Python"],
  },
  {
    name: "IT Specialist – Databases",
    issuer: "Certiport (Pearson VUE)",
    date: "Nov 2024",
    group: "exam",
    verifyUrl: "https://www.credly.com/badges/1dbd4e43-47bd-408b-8218-ba82bb45da0d",
    skills: ["MySQL"],
  },
  {
    name: "PMI Project Management Ready™",
    issuer: "Project Management Institute",
    date: "Mar 2026",
    group: "exam",
    verifyUrl: "https://www.credly.com/badges/e3bf8577-7aee-429e-9384-3dd3eeabcd7d",
    expires: "Mar 2031",
  },
  {
    name: "Ethical Hacker",
    issuer: "Cisco Networking Academy",
    date: "Jul 2025",
    group: "security",
    verifyUrl: "https://www.credly.com/badges/f0f86217-9c3d-48e2-82e7-f6ee6fc973e9",
  },
  {
    name: "Introduction to Cybersecurity",
    issuer: "Cisco Networking Academy",
    date: "Mar 2025",
    group: "security",
    verifyUrl: "https://www.credly.com/badges/ec63feed-1a0b-4ea5-a18b-f8c73be77356",
  },
  {
    name: "Network Defense",
    issuer: "Cisco Networking Academy",
    date: "Mar 2025",
    group: "security",
    verifyUrl: "https://www.credly.com/badges/4d60ce2c-9e6a-4669-9abd-f6c40464d0a5",
  },
  {
    name: "CCNA: Introduction to Networks",
    issuer: "Cisco Networking Academy",
    date: "Dec 2024",
    group: "networking",
    verifyUrl: "https://www.credly.com/badges/1fe29082-91bd-43d7-929d-d1c51f02ee92",
  },
  {
    name: "CCNA: Switching, Routing, and Wireless Essentials",
    issuer: "Cisco Networking Academy",
    date: "Mar 2025",
    group: "networking",
    verifyUrl: "https://www.credly.com/badges/abac81f1-ea01-4eb6-8da1-fe78206d28d7",
  },
  {
    name: "CCNA: Enterprise Networking, Security, and Automation",
    issuer: "Cisco Networking Academy",
    date: "Jan 2026",
    group: "networking",
    verifyUrl: "https://www.credly.com/badges/97de4bcf-3942-4ba2-88b3-0d99d0720bb8",
  },
];

// Lab notes and findings from your own testing.
export const writeups: Writeup[] = [];

export const meta = {
  siteTitle: "Kenneth Raichen B. Torres — Cybersecurity Portfolio",
  siteDescription:
    "Kenneth Raichen B. Torres (Ken), BSIT Cybersecurity student. I build creative web apps, then test how they break.",
};

/** Projects that list a given skill in their stack. */
export function projectsUsing(skill: string): Project[] {
  return projects.filter((p) => p.stack.includes(skill));
}

export type Evidence = { label: string; href: string; external: boolean };

/** Where a skill is used: projects that build with it, assessments that tested with it. */
export function evidenceFor(skill: string): Evidence[] {
  const built = projectsUsing(skill).map((p) => {
    const href = p.repo ?? p.url;
    return { label: p.title, href: href ?? "#work", external: Boolean(href) };
  });
  const tested = assessments
    .filter((a) => (a.tools as string[]).includes(skill))
    .map((a) => ({ label: `${a.target} assessment`, href: "#security", external: false }));
  const certified = certifications
    .filter((c) => c.skills?.includes(skill))
    .map((c) => ({ label: c.name, href: c.verifyUrl, external: true }));
  return [...built, ...tested, ...certified];
}
