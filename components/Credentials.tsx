"use client";

import { certifications, type Certification } from "@/content/data";
import { pad2 } from "@/lib/format";
import { useInView } from "@/lib/useInView";
import { SectionHeader } from "./SectionHeader";

const COURSE_GROUPS: { key: Certification["group"]; label: string; note?: (items: Certification[]) => string }[] = [
  { key: "security", label: "Security" },
  { key: "networking", label: "Networking", note: (items) => `CCNA course track · ${items.length} of 3` },
];

function Row({ c }: { c: Certification }) {
  return (
    <li className="border-b border-[var(--line)]">
      <a
        href={c.verifyUrl}
        target="_blank"
        rel="noreferrer"
        className="group grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 py-3.5"
      >
        <span className="text-[0.95rem] group-hover:text-[var(--red)] transition-colors">{c.name}</span>
        <span className="font-mono text-[11px] text-[var(--fg-dim)] whitespace-nowrap">{c.date}</span>
        <span className="text-[0.8rem] text-[var(--fg-dim)]">
          {c.issuer}
          {c.expires && <> · valid until {c.expires}</>}
        </span>
        <span className="label group-hover:text-[var(--red)] transition-colors">Verify ↗</span>
      </a>
    </li>
  );
}

function GroupHeader({ label, right }: { label: string; right: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-[var(--line-strong)]">
      <span className="label text-[var(--fg-muted)]">{label}</span>
      <span className="font-mono text-[10px] text-[var(--fg-dim)]">{right}</span>
    </div>
  );
}

export function Credentials() {
  const { ref, inView } = useInView();
  if (certifications.length === 0) return null;

  const exams = certifications.filter((c) => c.group === "exam");

  return (
    <section id="credentials" ref={ref} className="py-20 md:py-28 scroll-mt-16">
      <SectionHeader index="05" title="Credentials" />

      <p className="-mt-4 mb-12 max-w-[620px] text-[0.97rem] leading-[1.75] text-[var(--fg-muted)]">
        Certifications I passed exams for, then course badges from the Cisco Networking Academy. Every one
        links to Credly, where you can check it. The CCNA items are courses, not the CCNA certification exam.
      </p>

      <div className={`reveal ${inView ? "in" : ""}`}>
        {exams.length > 0 && (
          <div className="mb-14">
            <GroupHeader label="Certifications · by exam" right={pad2(exams.length)} />
            <ul className="grid md:grid-cols-2 md:gap-x-10">
              {exams.map((c) => (
                <Row key={c.verifyUrl} c={c} />
              ))}
            </ul>
          </div>
        )}

        <div className="label mb-5">Course badges · Cisco Networking Academy</div>
        <div className="grid md:grid-cols-2 gap-x-10 gap-y-12">
          {COURSE_GROUPS.map((g) => {
            const items = certifications.filter((c) => c.group === g.key);
            if (items.length === 0) return null;
            return (
              <div key={g.key}>
                <GroupHeader label={g.label} right={g.note ? g.note(items) : pad2(items.length)} />
                <ul>
                  {items.map((c) => (
                    <Row key={c.verifyUrl} c={c} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
