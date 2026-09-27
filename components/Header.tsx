"use client";

import { useEffect, useState } from "react";
import { toggleTerminal } from "@/lib/terminalBus";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { id: "work", label: "Work" },
  { id: "security", label: "Security" },
  { id: "skills", label: "Skills" },
  { id: "activity", label: "Activity" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The section crossing the middle of the viewport is "current".
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -54% 0px" }
    );
    document.querySelectorAll("section[id]").forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] backdrop-blur-md border-b border-[var(--line)]"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1120px] px-5 md:px-8 h-16 flex items-center gap-6">
        <a href="#top" className="flex items-center gap-3 shrink-0" aria-label="Ken — back to top">
          <span
            className="kanji w-8 h-8 grid place-items-center border border-[var(--red-line)] text-[var(--red)] text-[15px] tracking-normal"
            lang="ja"
            title="検 (ken) — to inspect"
          >
            検
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-[15px] font-medium">Ken</span>
            <span className="label block text-[9.5px]">Cybersecurity</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-1 mx-auto" aria-label="Sections">
          {NAV.map((item, i) => {
            const current = active === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={current ? "true" : undefined}
                className={`group flex items-baseline gap-1.5 px-3 py-1.5 text-[13px] transition-colors ${
                  current ? "text-[var(--fg)]" : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                }`}
              >
                <span className={`font-mono text-[10px] ${current ? "text-[var(--red)]" : "text-[var(--fg-dim)]"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 ml-auto lg:ml-0">
          <ThemeToggle />
          <button type="button" onClick={() => toggleTerminal(true)} className="btn" aria-label="Open terminal (Ctrl+K)">
            <span className="text-[var(--red)]">&gt;_</span>
            <span className="hidden sm:inline">Terminal</span>
            <kbd className="kbd hidden md:inline-flex">Ctrl K</kbd>
          </button>
        </div>
      </div>
    </header>
  );
}
