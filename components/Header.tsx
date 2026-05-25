"use client";

import { profile } from "@/content/data";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="flex items-center justify-between py-6 border-b border-current/20">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs uppercase tracking-widest">
          {profile.handle}
        </span>
        {profile.available && (
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest opacity-70">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            available
          </span>
        )}
      </div>
      <nav className="flex items-center gap-6">
        <a href="#work" className="font-mono text-xs uppercase tracking-widest opacity-70 hover:opacity-100 transition">work</a>
        <a href="#about" className="font-mono text-xs uppercase tracking-widest opacity-70 hover:opacity-100 transition">about</a>
        <a href="#contact" className="font-mono text-xs uppercase tracking-widest opacity-70 hover:opacity-100 transition">contact</a>
        <ThemeToggle />
      </nav>
    </header>
  );
}
