"use client";

import { useEffect, useState, useRef } from "react";
import { profile, projects, skills, projectsUsing } from "@/content/data";
import { toggleTerminal } from "@/lib/avatarBus";

export function Hero({
  lastPush,
  publicRepos,
}: {
  lastPush: string | null;
  publicRepos: number | null;
}) {
  const [mounted, setMounted] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [time, setTime] = useState("");
  const typingDone = useRef(false);

  useEffect(() => setMounted(true), []);

  // Live clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setTime(`${h}:${m}:${s}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Typing effect
  useEffect(() => {
    if (!mounted || typingDone.current) return;
    typingDone.current = true;

    const text = "whoami";
    let i = 0;

    function type() {
      if (i <= text.length) {
        setTypedText(text.slice(0, i));
        i++;
        setTimeout(type, 70 + Math.random() * 50);
      }
    }

    setTimeout(type, 700);
  }, [mounted]);

  const languagesInProd = skills.filter(
    (s) => s.category === "language" && projectsUsing(s.name).length > 0
  ).length;

  const stats = [
    { value: String(projects.length).padStart(2, "0"), label: "projects shipped" },
    { value: String(languagesInProd).padStart(2, "0"), label: "languages in prod" },
    lastPush
      ? { value: lastPush, label: "last git push", live: true }
      : { value: String(publicRepos ?? projects.length).padStart(2, "0"), label: "public repos" },
  ];

  const [line1, line2] = profile.headline;
  const accentAt = line2.lastIndexOf(profile.headlineAccent);

  return (
    <section
      id="top"
      className="min-h-[100svh] grid md:grid-cols-[1.2fr_1fr] items-center gap-6 md:gap-4 pt-24 pb-12"
    >
      <div
        className={`transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Status line */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--fg-muted)] tracking-wider mb-8">
          <span className="text-[var(--accent)]">&rarr;</span>
          session <span className="text-[var(--green)]">active</span>
          <span className="mx-1">&middot;</span>
          <span suppressHydrationWarning>{time} local</span>
        </div>

        {/* Terminal prompt */}
        <div className="font-mono text-[clamp(13px,1.4vw,15px)] text-[var(--fg-muted)] mb-5 flex items-center gap-1">
          <span className="text-[var(--accent)]">guest</span>
          <span>@</span>
          <span className="text-[var(--accent2)]">ken</span>
          <span className="text-[var(--fg-soft)]">:~</span>
          <span>$&nbsp;</span>
          <span className="text-[var(--fg)]">{typedText}</span>
          <span className="cursor-blink" />
        </div>

        {/* Headline */}
        <h1 className="font-display font-bold text-[clamp(2.1rem,5.2vw,4.1rem)] leading-[1.06] tracking-tight [text-wrap:balance]">
          {line1}
          <br />
          {accentAt >= 0 ? (
            <>
              {line2.slice(0, accentAt)}
              <span className="text-[var(--accent)] relative whitespace-nowrap">
                {profile.headlineAccent}
                <span className="absolute bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] opacity-40" />
              </span>
            </>
          ) : (
            line2
          )}
        </h1>

        <p className="mt-7 max-w-[540px] text-[1.05rem] text-[var(--fg-soft)] leading-[1.75]">
          {profile.intro}
        </p>

        {/* Stats */}
        <dl className="mt-10 grid grid-cols-3 max-w-[540px] border-y border-[var(--border)]">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`py-4 ${i > 0 ? "pl-4 border-l border-[var(--border)]" : ""}`}
            >
              <dd className="font-display text-xl md:text-2xl font-semibold text-[var(--fg)] flex items-center gap-2">
                {s.value}
                {"live" in s && s.live && <span className="sec-dot" title="live from GitHub" />}
              </dd>
              <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--fg-muted)] mt-1">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href="#work" className="btn-cmd py-2.5 px-5 border-[var(--border-active)] text-[var(--fg)]">
            <span className="prompt">$</span> ls ./work
          </a>
          <button onClick={() => toggleTerminal(true)} className="btn-cmd py-2.5 px-5">
            <span className="prompt">&gt;_</span> open terminal
            <kbd className="kbd ml-1">Ctrl K</kbd>
          </button>
          {profile.available && (
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--green)] ml-1">
              <span className="sec-dot" /> open to work
            </span>
          )}
        </div>
      </div>

      {/* The 3D companion is drawn here while the hero is on screen (see Companion.tsx). */}
      <div className="relative h-[380px] md:h-[min(74vh,640px)]">
        <div id="avatar-slot" className="absolute inset-0" aria-hidden />
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">
            <span className="text-[var(--accent)]">[</span> click to interact{" "}
            <span className="text-[var(--accent)]">]</span>
          </span>
        </div>
      </div>
    </section>
  );
}
