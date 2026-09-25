"use client";

import { skills } from "@/content/data";
import { useInView } from "@/lib/useInView";

function fakeHash(seed: number): string {
  let h = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < 8; i++) {
    h += chars[((seed * (i + 7) * 31) % 16) | 0];
  }
  return h;
}

export function Skills() {
  const { ref, inView } = useInView();

  const categories = [
    { key: "language" as const, label: "Languages" },
    { key: "framework" as const, label: "Frameworks" },
    { key: "security" as const, label: "Security + Tools" },
  ];

  return (
    <section id="skills" className="py-16 md:py-24" ref={ref}>
      {/* Section header */}
      <div className="section-header">
        <span className="section-id">02</span>
        <span className="section-label">Capabilities</span>
        <div className="section-line" />
        <span className="section-hash">sha:{fakeHash(4)}</span>
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-700 ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {categories.map((cat) => {
          const catSkills = skills.filter((s) => s.category === cat.key);
          return (
            <div key={cat.key}>
              {/* Column header */}
              <div className="flex items-center justify-between font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--accent)] pb-2.5 border-b border-[var(--border)] mb-5">
                <span>{cat.label}</span>
                <span className="font-mono text-[9px] text-[var(--fg-muted)] font-normal">
                  {catSkills.length} entries
                </span>
              </div>

              {/* Skill bars */}
              {catSkills.map((skill, i) => (
                <div key={skill.name} className="mb-[18px]">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="font-mono text-xs text-[var(--fg)]">
                      {skill.name}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--fg-muted)]">
                      {skill.level}%
                    </span>
                  </div>
                  <div className="skill-bar">
                    <div
                      className="skill-bar-fill"
                      style={{
                        transform: inView
                          ? `scaleX(${skill.level / 100})`
                          : "scaleX(0)",
                        transitionDelay: `${i * 100}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
