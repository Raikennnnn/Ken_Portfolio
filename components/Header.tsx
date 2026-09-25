"use client";

import { useState, useEffect } from "react";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("work");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track which section is in view
  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.25 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const navItems = ["work", "skills", "about", "contact"];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
        scrolled
          ? "bg-[#060610]/85 backdrop-blur-2xl border-b border-[var(--border)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1080px] px-5 md:px-10 flex items-center justify-between h-14">
        {/* Handle + badge */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-medium tracking-wider text-[var(--accent)]">
            ken@sec
          </span>
          <span className="sec-badge">
            <span className="sec-dot" />
            secure
          </span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item}`}
              className={`font-mono text-[11px] tracking-wider px-3.5 py-1.5 rounded transition-colors duration-250 ${
                activeSection === item
                  ? "text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--accent-glow)]"
              }`}
            >
              ./{item}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <a href="#contact" className="btn-cmd">
          <span className="prompt">$</span> connect
        </a>
      </div>
    </header>
  );
}
