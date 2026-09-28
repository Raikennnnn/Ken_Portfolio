"use client";

import { links, site } from "@/content/data";
import { useInView } from "@/lib/useInView";
import { toggleTerminal } from "@/lib/terminalBus";
import { SectionHeader } from "./SectionHeader";

const display = (href: string) =>
  href.replace(/^mailto:/, "").replace(/^https?:\/\//, "").replace(/\/$/, "").split("?")[0];

export function Contact() {
  const { ref, inView } = useInView();
  const email = links.find((l) => l.href.startsWith("mailto:"));

  return (
    <section id="contact" ref={ref} className="pt-20 md:pt-28 scroll-mt-16">
      <SectionHeader index="08" title="Contact" />

      <div className={`reveal ${inView ? "in" : ""} grid md:grid-cols-[1.2fr_1fr] gap-10 md:gap-14`}>
        <div>
          <h3 className="font-serif font-medium text-[clamp(1.7rem,3.4vw,2.5rem)] leading-[1.15] tracking-tight [text-wrap:balance]">
            Questions, projects or opportunities: my inbox is open.
          </h3>
          <div className="mt-8 flex flex-wrap gap-3">
            {email && (
              <a href={email.href} className="btn btn-primary">
                Email me
              </a>
            )}
            <button type="button" onClick={() => toggleTerminal(true)} className="btn">
              <span className="text-[var(--red)]">&gt;_</span> Terminal
            </button>
          </div>
        </div>

        <ul className="border-t border-[var(--line)] self-start">
          {links.map((l) => (
            <li key={l.label} className="border-b border-[var(--line)]">
              <a
                href={l.href}
                target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noreferrer"
                className="group flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between py-4"
              >
                <span className="label group-hover:text-[var(--red)] transition-colors">{l.label}</span>
                <span className="text-[0.93rem] break-all sm:text-right group-hover:text-[var(--red)] transition-colors">
                  {display(l.href)} <span aria-hidden>↗</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <footer className="mt-24 py-8 border-t border-[var(--line)] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <span className="label">© {new Date().getFullYear()} Ken</span>
        <span className="flex items-center gap-5">
          <a href={site.repo} target="_blank" rel="noreferrer" className="label hover:text-[var(--red)] transition-colors">
            About this site ↗
          </a>
          <a href="/.well-known/security.txt" className="label hover:text-[var(--red)] transition-colors">
            security.txt
          </a>
          <span className="label">Next.js · Vercel</span>
        </span>
      </footer>
    </section>
  );
}
