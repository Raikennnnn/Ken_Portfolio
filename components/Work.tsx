"use client";

import { projects, writeups } from "@/content/data";
import { ProjectRow } from "./ProjectRow";
import { SectionHeader } from "./SectionHeader";
import { useInView } from "@/lib/useInView";

export function Work() {
  const { ref, inView } = useInView();

  return (
    <section id="work" className="py-16 md:py-24 scroll-mt-16" ref={ref}>
      <SectionHeader id="01" label="Selected Work" hashOf={projects} />

      <div
        className={`transition-all duration-700 ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {projects.map((p, i) => (
          <ProjectRow key={p.index} project={p} delay={i * 100} defaultOpen={i === 0} />
        ))}

        {writeups.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--accent)] pb-2.5 border-b border-[var(--border)] mb-2">
              <span>Write-ups</span>
              <span className="font-mono text-[9px] text-[var(--fg-muted)] font-normal">
                {writeups.length} entries
              </span>
            </div>
            {writeups.map((w) => (
              <a
                key={w.url}
                href={w.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 py-3 border-b border-[var(--border)] group"
              >
                <span className="tag">{w.kind}</span>
                <span className="flex-1 text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors">
                  {w.title}
                </span>
                <span className="font-mono text-[10px] text-[var(--fg-muted)]">{w.date}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
