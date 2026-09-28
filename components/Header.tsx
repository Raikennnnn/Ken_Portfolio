"use client";

import { useEffect, useState } from "react";
import { toggleTerminal } from "@/lib/terminalBus";
import { ThemeToggle } from "./ThemeToggle";
import { SoundToggle } from "./Sound";
import { DiamondMenu } from "./DiamondMenu";
import { pad2 } from "@/lib/format";

const NAV = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "work", label: "Work" },
  { id: "security", label: "Security" },
  { id: "credentials", label: "Credentials" },
  { id: "skills", label: "Skills" },
  { id: "ctf", label: "Break it" },
  { id: "contact", label: "Contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false); // phones / tablets: section menu

  // close the menu on scroll or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("scroll", close, { passive: true, once: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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
      <div className="mx-auto max-w-[1120px] px-5 md:px-8 h-16 flex items-center gap-4 md:gap-5">
        {/* desktop: the diamond menu; phones keep the list menu (right) for now */}
        <div className="hidden md:block">
          <DiamondMenu sections={NAV} active={active} />
        </div>
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


        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="btn w-9 justify-center px-0 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close sections menu" : "Open sections menu"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
          <SoundToggle />
          <ThemeToggle />
          <button type="button" onClick={() => toggleTerminal(true)} className="btn" aria-label="Open terminal (Ctrl+K)">
            <span className="text-[var(--red)]">&gt;_</span>
            <span className="hidden sm:inline">Terminal</span>
            <kbd className="kbd hidden 2xl:inline-flex">Ctrl K</kbd>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Sections"
          className="md:hidden border-t border-[var(--line)] bg-[var(--bg)] mx-auto max-w-[1120px] px-5 md:px-8 py-2"
        >
          {NAV.map((item, i) => {
            const current = active === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setMenuOpen(false)}
                aria-current={current ? "true" : undefined}
                className="flex items-baseline gap-3 py-3 border-b border-[var(--line)] last:border-0 text-[15px]"
              >
                <span className={`font-mono text-[11px] ${current ? "text-[var(--red)]" : "text-[var(--fg-dim)]"}`}>
                  {pad2(i + 1)}
                </span>
                <span className={current ? "text-[var(--fg)]" : "text-[var(--fg-muted)]"}>{item.label}</span>
              </a>
            );
          })}
        </nav>
      )}
    </header>
  );
}
