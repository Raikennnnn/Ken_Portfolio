"use client";

import { profile } from "@/content/data";
import { toggleTerminal } from "@/lib/terminalBus";
import { VisitInspector } from "./VisitInspector";
import { Rain } from "./Rain";

export function Hero() {
  const [line1, line2] = profile.headline;
  const accentAt = line2.lastIndexOf(profile.headlineAccent);

  return (
    <section
      id="top"
      className="relative min-h-[100svh] grid lg:grid-cols-[1.3fr_1fr] items-center gap-10 lg:gap-14 pt-28 pb-16"
    >
      <Rain />
      <div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-8">
          <span className="label text-[var(--fg-muted)]">{profile.title} student</span>
          {profile.available && (
            <span className="label flex items-center gap-2 text-[var(--fg-muted)]">
              <span className="w-1.5 h-1.5 bg-[var(--red)]" aria-hidden />
              Open to work
            </span>
          )}
        </div>

        <h1 className="font-serif font-medium text-[clamp(2.3rem,5.4vw,4.2rem)] leading-[1.08] tracking-[-0.01em] [text-wrap:balance]">
          {line1}
          <br />
          {accentAt >= 0 ? (
            <>
              {line2.slice(0, accentAt)}
              <span className="text-[var(--red)]">{profile.headlineAccent}</span>
            </>
          ) : (
            line2
          )}
        </h1>

        <p className="mt-7 max-w-[540px] text-[1.05rem] leading-[1.75] text-[var(--fg-muted)]">
          I&apos;m <span className="text-[var(--fg)]">{profile.fullName}</span>, {profile.intro}
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a href="#work" className="btn btn-primary">
            View work
          </a>
          <button type="button" onClick={() => toggleTerminal(true)} className="btn">
            <span className="text-[var(--red)]">&gt;_</span> Open terminal
            <kbd className="kbd hidden sm:inline-flex">Ctrl K</kbd>
          </button>
        </div>
      </div>

      <VisitInspector />
    </section>
  );
}
