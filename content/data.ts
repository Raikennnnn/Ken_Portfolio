// =====================================================================
//  PORTFOLIO CONTENT
//  Edit this single file to update the entire site.
// =====================================================================

export type Project = {
  index: string;
  title: string;
  year: string;
  role: string;
  tags: string[];
  summary: string;
  url?: string;
  repo?: string;
};

export type SocialLink = {
  label: string;
  href: string;
};

export type Skill = {
  name: string;
  level: number; // 0-100, drives the animated bar
  category: "language" | "framework" | "security";
};

export const profile = {
  name: "Ken",
  handle: "ken@sec",
  title: "BSIT Cybersecurity",
  tagline: "Securing systems. Building what's next.",
  bio: [
    "I'm a BSIT Cybersecurity student with a deep interest in how things break — and how to make them harder to break.",
    "I build full-stack applications with security baked in from the start, not bolted on after. My favourite work lives at the intersection of secure development and good user experience.",
    "When I'm not studying protocols or writing code, I'm exploring game development, creative coding, and the occasional CTF challenge.",
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
  { name: "TypeScript", level: 90, category: "language" },
  { name: "Python", level: 75, category: "language" },
  { name: "Lua", level: 72, category: "language" },
  // Frameworks
  { name: "React / Next.js", level: 88, category: "framework" },
  { name: "Node.js", level: 85, category: "framework" },
  { name: "Tailwind CSS", level: 92, category: "framework" },
  // Security + Tools
  { name: "Network Security", level: 78, category: "security" },
  { name: "Linux / CLI", level: 82, category: "security" },
  { name: "Git / CI-CD", level: 80, category: "security" },
  { name: "Wireshark / Nmap", level: 70, category: "security" },
];

export const projects: Project[] = [
  {
    index: "01",
    title: "IntelliDocs",
    year: "2026",
    role: "Full Stack",
    tags: ["TypeScript", "Next.js", "AI"],
    summary:
      "Web-based student enrollment system with AI-assisted document verification. Streamlines the enrollment pipeline with intelligent form parsing and automated validation.",
    repo: "https://github.com/Raikennnnn/IntelliDocs",
  },
  {
    index: "02",
    title: "Stonebound Factory",
    year: "2026",
    role: "Game Dev",
    tags: ["Lua", "Roblox"],
    summary:
      "Roll stones. Power machines. Build your fortune. A factory-automation game built on Roblox with custom physics and progression systems.",
    repo: "https://github.com/Raikennnnn/stonebound-factory",
  },
  {
    index: "03",
    title: "Ken Portfolio",
    year: "2026",
    role: "Design + Dev",
    tags: ["Next.js", "Three.js", "Tailwind"],
    summary:
      "This site — a cybersecurity-themed portfolio with interactive elements, network visualizations, and scroll-driven animations.",
    repo: "https://github.com/Raikennnnn/Ken_Portfolio",
  },
];

export const meta = {
  copy: `© ${new Date().getFullYear()} Ken. All packets accounted for.`,
  siteTitle: "Ken — Cybersecurity Portfolio",
  siteDescription:
    "BSIT Cybersecurity student. Securing systems, building what's next.",
};
