"use client";

import { profile } from "@/content/data";
import { useInView } from "@/lib/useInView";
import { PhotoFrame } from "./PhotoFrame";

function fakeHash(seed: number): string {
  let h = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < 8; i++) {
    h += chars[((seed * (i + 7) * 31) % 16) | 0];
  }
  return h;
}

export function About() {
  const { ref, inView } = useInView();

  const infoCards = [
    { label: "stack", value: "TypeScript · React · Node · Postgres" },
    { label: "security", value: "Network defense · Secure dev · Threat analysis" },
    { label: "interests", value: "Game dev · 3D · CTFs · Creative coding" },
    { label: "status", value: "Open to interesting work", isStatus: true },
  ];

  return (
    <section id="about" className="py-16 md:py-24" ref={ref}>
      {/* Section header */}
      <div className="section-header">
        <span className="section-id">03</span>
        <span className="section-label">About</span>
        <div className="section-line" />
        <span className="section-hash">sha:{fakeHash(5)}</span>
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-8 md:gap-10 transition-all duration-700 ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Photo — on mobile shows first, on desktop left column */}
        <div className="flex items-start justify-center order-first">
          <PhotoFrame />
        </div>

        {/* Bio text — center column */}
        <div className="flex flex-col gap-5 text-[1.05rem] text-[var(--fg-soft)] leading-[1.8]">
          {profile.bio.map((paragraph, i) => (
            <p key={i}>
              {i === 0 ? (
                <>
                  I&apos;m{" "}
                  <span className="text-[var(--fg)] font-semibold">
                    {profile.name}
                  </span>
                  , a{" "}
                  <span className="text-[var(--accent)]">
                    {profile.title}
                  </span>{" "}
                  student with a deep interest in how things break — and how to
                  make them harder to break.
                </>
              ) : (
                paragraph
              )}
            </p>
          ))}
        </div>

        {/* Info cards — right column */}
        <div className="flex flex-col gap-2.5">
          {infoCards.map((item) => (
            <div
              key={item.label}
              className="px-4 py-3.5 border border-[var(--border)] rounded-lg bg-[var(--bg-soft)] transition-all duration-300 hover:border-[var(--border-active)] hover:shadow-[0_2px_16px_var(--accent-glow)]"
            >
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--accent)] mb-1">
                {item.label}
              </div>
              <div
                className={`font-mono text-xs ${
                  item.isStatus ? "text-[var(--green)]" : "text-[var(--fg)]"
                }`}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
