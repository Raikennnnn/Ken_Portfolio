"use client";

import { skills, projectsUsing } from "@/content/data";
import { SectionHeader } from "./SectionHeader";
import { useInView } from "@/lib/useInView";

const CATEGORIES = [
  { key: "language" as const, label: "Languages" },
  { key: "framework" as const, label: "Frameworks + Platforms" },
  { key: "security" as const, label: "Security + Tools" },
];

export function Skills() {
  const { ref, inView } = useInView();

  return (
    <section id="skills" className="py-16 md:py-24 scroll-mt-16" ref={ref}>
      <SectionHeader id="02" label="Capabilities" hashOf={skills} />

      <p className="max-w-[560px] -mt-4 mb-10 text-[0.95rem] text-[var(--fg-soft)] leading-[1.7]">
        No percentage bars. Each skill points to the project where it&apos;s used,
        so you can check the code yourself.
      </p>

      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-700 ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {CATEGORIES.map((cat) => {
          const catSkills = skills.filter((s) => s.category === cat.key);
          return (
            <div key={cat.key}>
              <div className="flex items-center justify-between font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--accent)] pb-2.5 border-b border-[var(--border)] mb-1">
                <span>{cat.label}</span>
                <span className="font-mono text-[9px] text-[var(--fg-muted)] font-normal">
                  {catSkills.length} entries
                </span>
              </div>

              <ul>
                {catSkills.map((skill) => {
                  const used = projectsUsing(skill.name);
                  return (
                    <li
                      key={skill.name}
                      className="py-3 border-b border-[var(--border)] last:border-0"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-xs text-[var(--fg)]">{skill.name}</span>
                        <span
                          className={`font-mono text-[9px] uppercase tracking-[0.08em] ${
                            used.length ? "text-[var(--green)]" : "text-[var(--fg-muted)]"
                          }`}
                        >
                          {used.length ? `${used.length} project${used.length > 1 ? "s" : ""}` : "practice"}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[10.5px] text-[var(--fg-muted)] flex flex-wrap gap-x-1.5">
                        {used.length
                          ? used.map((p, i) => (
                              <span key={p.index}>
                                <a
                                  href={p.repo ?? p.url ?? "#work"}
                                  target={p.repo || p.url ? "_blank" : undefined}
                                  rel="noreferrer"
                                  className="hover:text-[var(--accent)] transition-colors"
                                >
                                  → {p.title}
                                </a>
                                {i < used.length - 1 && ","}
                              </span>
                            ))
                          : skill.context}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
