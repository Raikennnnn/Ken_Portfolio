"use client";

import { profile, certifications } from "@/content/data";
import { useInView } from "@/lib/useInView";
import { PhotoFrame } from "./PhotoFrame";
import { SectionHeader } from "./SectionHeader";

export function About() {
  const { ref, inView } = useInView();

  return (
    <section id="about" className="py-16 md:py-24 scroll-mt-16" ref={ref}>
      <SectionHeader id="04" label="About" hashOf={profile.bio} />

      <div
        className={`grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-8 md:gap-10 transition-all duration-700 ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="flex items-start justify-center">
          <PhotoFrame />
        </div>

        <div className="flex flex-col gap-5 text-[1.05rem] text-[var(--fg-soft)] leading-[1.8]">
          {profile.bio.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          {profile.focus.map((item) => (
            <div
              key={item.label}
              className="px-4 py-3.5 border border-[var(--border)] rounded-lg bg-[var(--bg-soft)] transition-all duration-300 hover:border-[var(--border-active)] hover:shadow-[0_2px_16px_var(--accent-glow)]"
            >
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--accent)] mb-1">
                {item.label}
              </div>
              <div className="font-mono text-xs text-[var(--fg)]">{item.value}</div>
            </div>
          ))}
          {profile.available && (
            <div className="px-4 py-3.5 border border-[var(--border)] rounded-lg bg-[var(--bg-soft)]">
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--accent)] mb-1">
                status
              </div>
              <div className="font-mono text-xs text-[var(--green)] flex items-center gap-2">
                <span className="sec-dot" /> Open to interesting work
              </div>
            </div>
          )}
        </div>
      </div>

      {certifications.length > 0 && (
        <div className="mt-14">
          <div className="flex items-center justify-between font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--accent)] pb-2.5 border-b border-[var(--border)] mb-2">
            <span>Certifications</span>
            <span className="font-mono text-[9px] text-[var(--fg-muted)] font-normal">
              {certifications.length} entries
            </span>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {certifications.map((c) => (
              <div key={c.name} className="card-interactive p-4">
                <div className="text-[var(--fg)] font-display font-semibold">{c.name}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--fg-muted)] mt-1">
                  {c.issuer} · {c.year}
                </div>
                {c.verifyUrl && (
                  <a href={c.verifyUrl} target="_blank" rel="noreferrer" className="inline-block mt-3 font-mono text-[10px] text-[var(--green)] hover:underline">
                    ✓ verify →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
