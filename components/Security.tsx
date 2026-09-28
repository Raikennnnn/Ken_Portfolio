"use client";

import { assessments, securityChecks, securityTools, type Assessment } from "@/content/data";
import { ListRow, NotesPanel, RepoLinks } from "./ListRow";
import { SectionHeader } from "./SectionHeader";
import { useInView } from "@/lib/useInView";
import { pad2 } from "@/lib/format";

function AssessmentRow({ a }: { a: Assessment }) {
  return (
    <ListRow id={`assessment-${a.index}`} index={a.index} title={a.target} meta={a.type} year={a.year}>
      <div className="grid md:grid-cols-2 gap-6 md:gap-10">
        <div>
          <p className="text-[0.97rem] leading-[1.75] text-[var(--fg-muted)]">{a.summary}</p>

          <dl className="mt-6 grid grid-cols-[72px_1fr] gap-y-2.5 text-[0.9rem]">
            <dt className="label pt-0.5">Scope</dt>
            <dd className="text-[var(--fg-muted)]">{a.scope}</dd>
          </dl>

          <div className="mt-6">
            <div className="label mb-2">Tools</div>
            <ul className="border-t border-[var(--line)]">
              {a.tools.map((t) => (
                <li key={t} className="flex items-baseline justify-between gap-4 py-2.5 border-b border-[var(--line)]">
                  <span className="text-[0.93rem]">{t}</span>
                  <span className="text-[0.82rem] text-[var(--fg-dim)] text-right">{securityTools[t]}</span>
                </li>
              ))}
            </ul>
          </div>

          {a.findings && a.findings.length > 0 && (
            <div className="mt-6">
              <div className="label mb-2">Findings</div>
              <ul className="border-t border-[var(--line)]">
                {a.findings.map((f) => (
                  <li key={f.issue} className="py-2.5 border-b border-[var(--line)]">
                    <span className="block text-[0.93rem]">{f.issue}</span>
                    <span className="block text-[0.84rem] text-[var(--fg-muted)]">Fixed: {f.fix}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <RepoLinks url={a.url} repo={a.repo} />
        </div>

        <NotesPanel label={`Checks performed · ${pad2(a.checks.length)}`}>
          <ol className="flex flex-col">
            {a.checks.map((c, i) => (
              <li key={c} className="grid grid-cols-[24px_1fr] gap-x-3 py-2.5 border-b border-[var(--line)] last:border-0">
                <span className="font-mono text-[11px] text-[var(--fg-dim)] pt-[3px]">{pad2(i + 1)}</span>
                <span>
                  <span className="block text-[0.93rem]">{c}</span>
                  <span className="block text-[0.84rem] text-[var(--fg-muted)]">{securityChecks[c]}</span>
                </span>
              </li>
            ))}
          </ol>
        </NotesPanel>
      </div>
    </ListRow>
  );
}

export function Security() {
  const { ref, inView } = useInView();

  return (
    <section id="security" ref={ref} className="py-20 md:py-28 scroll-mt-16">
      <SectionHeader index="02" title="Security testing" />

      <p className="-mt-4 mb-10 max-w-[560px] text-[0.97rem] leading-[1.75] text-[var(--fg-muted)]">
        Systems I have tested, with permission: the scope, the tools and the checks.
      </p>

      <div className={`reveal ${inView ? "in" : ""} border-t border-[var(--line)]`}>
        {assessments.map((a) => (
          <AssessmentRow key={a.index} a={a} />
        ))}
      </div>
    </section>
  );
}
