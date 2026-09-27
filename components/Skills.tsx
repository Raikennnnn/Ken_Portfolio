"use client";

import { skills, projectsUsing, type Skill } from "@/content/data";
import { SectionHeader } from "./SectionHeader";
import { useInView } from "@/lib/useInView";

const GROUPS: { key: Skill["category"]; label: string }[] = [
  { key: "language", label: "Languages" },
  { key: "framework", label: "Frameworks & platforms" },
  { key: "practice", label: "Security practice" },
  { key: "tool", label: "Testing tools" },
];

export function Skills() {
  const { ref, inView } = useInView();

  return (
    <section id="skills" ref={ref} className="py-20 md:py-28 scroll-mt-16">
      <SectionHeader index="03" title="Capabilities" kanji="技能" meaning="skills" />

      <p className="-mt-4 mb-12 max-w-[560px] text-[0.97rem] leading-[1.75] text-[var(--fg-muted)]">
        No self-rated percentages. Each skill links to the project where it is used, so you can
        check the work directly.
      </p>

      <div className={`reveal ${inView ? "in" : ""} grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12`}>
        {GROUPS.map((group) => {
          const items = skills.filter((s) => s.category === group.key);
          return (
            <div key={group.key}>
              <div className="flex items-baseline justify-between pb-3 border-b border-[var(--line-strong)]">
                <span className="label text-[var(--fg-muted)]">{group.label}</span>
                <span className="font-mono text-[10px] text-[var(--fg-dim)]">{String(items.length).padStart(2, "0")}</span>
              </div>
              <ul>
                {items.map((skill) => {
                  const used = projectsUsing(skill.name);
                  return (
                    <li key={skill.name} className="py-3 border-b border-[var(--line)]">
                      <div className="text-[0.95rem]">{skill.name}</div>
                      {used.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-x-3 text-[0.8rem] text-[var(--fg-dim)]">
                          {used.map((p) => (
                            <a
                              key={p.index}
                              href={p.repo ?? p.url ?? "#work"}
                              target={p.repo || p.url ? "_blank" : undefined}
                              rel="noreferrer"
                              className="hover:text-[var(--red)] transition-colors"
                            >
                              {p.title} ↗
                            </a>
                          ))}
                        </div>
                      )}
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
