"use client";

import { projects, writeups } from "@/content/data";
import { ProjectRow } from "./ProjectRow";
import { SectionHeader } from "./SectionHeader";
import { useInView } from "@/lib/useInView";

export function Work() {
  const { ref, inView } = useInView();

  return (
    <section id="work" ref={ref} className="py-20 md:py-28 scroll-mt-16">
      <SectionHeader index="01" title="Selected work" kanji="作品" meaning="works" />

      <div className={`reveal ${inView ? "in" : ""} border-t border-[var(--line)]`}>
        {projects.map((p, i) => (
          <ProjectRow key={p.index} project={p} defaultOpen={i === 0} />
        ))}
      </div>

      {writeups.length > 0 && (
        <div className="mt-14">
          <div className="label mb-3">Write-ups</div>
          {writeups.map((w) => (
            <a
              key={w.url}
              href={w.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 py-3 border-b border-[var(--line)] group"
            >
              <span className="tag">{w.kind}</span>
              <span className="flex-1 group-hover:text-[var(--red)] transition-colors">{w.title}</span>
              <span className="font-mono text-[11px] text-[var(--fg-dim)]">{w.date}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
