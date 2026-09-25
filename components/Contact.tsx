"use client";

import { links, meta } from "@/content/data";
import { useInView } from "@/lib/useInView";

export function Contact() {
  const { ref, inView } = useInView();

  return (
    <section id="contact" className="py-16 md:py-24" ref={ref}>
      {/* Section header */}
      <div className="section-header">
        <span className="section-id">04</span>
        <span className="section-label">Connect</span>
        <div className="section-line" />
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-8 transition-all duration-700 ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* CTA */}
        <div>
          <h2 className="font-display text-[clamp(1.6rem,3.5vw,2.5rem)] font-bold leading-[1.15] tracking-tight mb-4 [text-wrap:balance]">
            Establish a secure connection.
          </h2>
          <p className="text-base text-[var(--fg-soft)] mb-7">
            Got a project, a question, or a CTF team that needs one more? Send a
            packet.
          </p>
          <a
            href={`mailto:${links[0]?.href.replace("mailto:", "")}`}
            className="btn-cmd py-2.5 px-6"
          >
            <span className="prompt">$</span>{" "}
            <span>init --handshake</span>
          </a>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("mailto:") ? "_self" : "_blank"}
              rel="noreferrer"
              className="flex items-center justify-between px-4 py-3.5 border border-[var(--border)] rounded-lg bg-[var(--bg-soft)] no-underline text-inherit transition-all duration-300 hover:border-[var(--border-active)] hover:shadow-[0_2px_16px_var(--accent-glow)] group"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--fg-muted)] group-hover:text-[var(--accent)] transition-colors">
                {l.label}
              </span>
              <span className="font-mono text-xs text-[var(--fg-soft)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-2">
                {l.href 
                  .replace(/^mailto:/, "")
                  .replace(/^https?:\/\//, "")
                  .replace(/\/$/, "")
                  .split("?")[0]}
                <span className="inline-block transition-transform group-hover:translate-x-1">
                  &rarr;
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 pt-6 border-t border-[var(--border)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-[10px] text-[var(--fg-muted)]">
          <span>{meta.copy}</span>
          <span className="flex items-center gap-2">
            Next.js + Three.js + Vercel
            <span className="sec-dot" />
          </span>
        </div>
      </div>
    </section>
  );
}
