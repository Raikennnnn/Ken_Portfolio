"use client";

import { experience } from "@/content/data";
import { useInView } from "@/lib/useInView";
import { SectionHeader } from "./SectionHeader";

export function Experience() {
  const { ref, inView } = useInView();

  return (
    <section id="experience" ref={ref} className="py-20 md:py-28 scroll-mt-16">
      <SectionHeader index="02" title="Experience" />

      <ol className={`reveal ${inView ? "in" : ""} border-t border-[var(--line)]`}>
        {experience.map((e) => (
          <li key={e.role + e.org} className="grid md:grid-cols-[220px_1fr] gap-x-10 gap-y-4 py-7 border-b border-[var(--line)]">
            <div>
              <div className="font-mono text-[11px] text-[var(--red)]">{e.year}</div>
              <div className="mt-2 text-[0.84rem] leading-[1.55] text-[var(--fg-muted)]">{e.org}</div>
            </div>

            <div>
              <h3 className="font-serif text-[1.2rem] md:text-[1.35rem] font-medium tracking-tight">{e.role}</h3>
              <ul className="mt-4 flex flex-col gap-2.5 max-w-[640px]">
                {e.points.map((p) => (
                  <li key={p} className="flex gap-3 text-[0.95rem] leading-[1.7] text-[var(--fg-muted)]">
                    <span className="mt-[0.7em] w-1 h-1 shrink-0 bg-[var(--red)]" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                {e.links.map((l) => (
                  <a key={l.href} href={l.href} className="label hover:text-[var(--red)] transition-colors">
                    {l.label} ↓
                  </a>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
