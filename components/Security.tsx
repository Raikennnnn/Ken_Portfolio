"use client";

import { securityTesting } from "@/content/data";
import { SectionHeader } from "./SectionHeader";
import { useInView } from "@/lib/useInView";

export function Security() {
  const { ref, inView } = useInView();
  const { target, scope, tools, checks } = securityTesting;

  return (
    <section id="security" ref={ref} className="py-20 md:py-28 scroll-mt-16">
      <SectionHeader index="02" title="Security testing" kanji="検証" meaning="verification" />

      <div className={`reveal ${inView ? "in" : ""} grid lg:grid-cols-[1fr_1.45fr] gap-10 lg:gap-14`}>
        <div>
          <p className="text-[1.02rem] leading-[1.75] text-[var(--fg-muted)] max-w-[440px]">
            I test what I build the way an attacker would look at it: intercepting requests,
            tampering with input and probing sessions and authentication.
          </p>

          <dl className="mt-8 grid grid-cols-[88px_1fr] gap-y-3 text-[0.92rem]">
            <dt className="label pt-0.5">Target</dt>
            <dd>{target}</dd>
            <dt className="label pt-0.5">Scope</dt>
            <dd className="text-[var(--fg-muted)]">{scope}</dd>
          </dl>

          <div className="mt-10">
            <div className="label mb-3">Tools</div>
            <ul className="border-t border-[var(--line)]">
              {tools.map((t) => (
                <li key={t.name} className="flex items-baseline justify-between gap-4 py-3 border-b border-[var(--line)]">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-[0.85rem] text-[var(--fg-dim)] text-right">{t.role}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="panel corners">
          <div className="flex items-center justify-between px-5 h-11 border-b border-[var(--line)]">
            <span className="label text-[var(--fg-muted)]">What I test for</span>
            <span className="font-mono text-[11px] text-[var(--fg-dim)]">
              {String(checks.length).padStart(2, "0")} checks
            </span>
          </div>
          <ol>
            {checks.map((c, i) => (
              <li
                key={c.name}
                className="group grid grid-cols-[28px_1fr] sm:grid-cols-[28px_1fr_1.1fr] items-baseline gap-x-4 gap-y-1 px-5 py-4 border-b border-[var(--line)] last:border-0 hover:bg-[var(--red-soft)] transition-colors"
              >
                <span className="font-mono text-[11px] text-[var(--fg-dim)] group-hover:text-[var(--red)] transition-colors">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-medium">{c.name}</span>
                <span className="col-start-2 sm:col-start-auto text-[0.88rem] text-[var(--fg-muted)]">{c.looksFor}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
