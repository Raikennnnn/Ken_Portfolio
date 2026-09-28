"use client";

import { profile, projects, writeups } from "@/content/data";
import { ProjectRow } from "./ProjectRow";
import { SectionHeader } from "./SectionHeader";
import { useInView } from "@/lib/useInView";

/** A public repository that isn't one of the listed projects. */
export type OtherRepo = {
  name: string;
  description: string | null;
  language: string | null;
  url: string;
  ago: string;
};

export function Work({ lastPush, others }: { lastPush: Record<string, string>; others: OtherRepo[] }) {
  const { ref, inView } = useInView();

  return (
    <section id="work" ref={ref} className="py-20 md:py-28 scroll-mt-16">
      <SectionHeader index="03" title="Selected work" />

      <div className={`reveal ${inView ? "in" : ""} border-t border-[var(--line)]`}>
        {projects.map((p) => (
          <ProjectRow
            key={p.index}
            project={p}
            lastPush={p.repo ? lastPush[p.repo.toLowerCase().replace(/\/$/, "")] : undefined}
          />
        ))}
      </div>

      {others.length > 0 && (
        <div className="mt-14">
          <div className="label mb-3">Other repositories</div>
          <ul className="border-t border-[var(--line)]">
            {others.map((r) => (
              <li key={r.name} className="border-b border-[var(--line)]">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group grid grid-cols-[1fr_auto] md:grid-cols-[220px_1fr_auto] items-baseline gap-x-6 gap-y-1 py-3"
                >
                  <span className="font-mono text-[13px] group-hover:text-[var(--red)] transition-colors">{r.name}</span>
                  <span className="order-3 md:order-none col-span-2 md:col-span-1 text-[0.9rem] text-[var(--fg-muted)] truncate">
                    {r.description ?? ""}
                  </span>
                  <span className="flex items-center gap-5 font-mono text-[11px] text-[var(--fg-dim)] justify-end">
                    {r.language && <span>{r.language}</span>}
                    <span>{r.ago}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

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

      <a
        href={`https://github.com/${profile.github}`}
        target="_blank"
        rel="noreferrer"
        className="label inline-block mt-8 hover:text-[var(--red)] transition-colors"
      >
        All repositories on GitHub ↗
      </a>
    </section>
  );
}
