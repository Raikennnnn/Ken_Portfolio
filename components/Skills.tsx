"use client";

import { skills, skillGroups, evidenceFor } from "@/content/data";
import { SectionHeader } from "./SectionHeader";
import { useInView } from "@/lib/useInView";
import { pad2 } from "@/lib/format";

export function Skills() {
  const { ref, inView } = useInView();

  return (
    <section id="skills" ref={ref} className="py-20 md:py-28 scroll-mt-16">
      <SectionHeader index="06" title="Skills" />

      <p className="-mt-4 mb-12 max-w-[560px] text-[0.97rem] leading-[1.75] text-[var(--fg-muted)]">
        Each skill links to the work that uses it.
      </p>

      <div className={`reveal ${inView ? "in" : ""} grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12`}>
        {skillGroups.map((group) => {
          const items = skills.filter((s) => s.category === group.key);
          return (
            <div key={group.key}>
              <div className="flex items-baseline justify-between pb-3 border-b border-[var(--line-strong)]">
                <span className="label text-[var(--fg-muted)]">{group.label}</span>
                <span className="font-mono text-[10px] text-[var(--fg-dim)]">{pad2(items.length)}</span>
              </div>
              <ul>
                {items.map((skill) => {
                  const used = evidenceFor(skill.name);
                  return (
                    <li key={skill.name} className="py-3 border-b border-[var(--line)]">
                      <div className="text-[0.95rem]">{skill.name}</div>
                      {used.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-x-3 text-[0.8rem] text-[var(--fg-dim)]">
                          {used.map((e) => (
                            <a
                              key={e.label}
                              href={e.href}
                              target={e.external ? "_blank" : undefined}
                              rel={e.external ? "noreferrer" : undefined}
                              className="hover:text-[var(--red)] transition-colors"
                            >
                              {e.label} {e.external ? "↗" : "↓"}
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
