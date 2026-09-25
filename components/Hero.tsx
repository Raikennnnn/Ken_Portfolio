"use client";

import { useEffect, useState, useRef } from "react";
import { profile } from "@/content/data";

export function Hero() {
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
      setTime(`${h}:${m}:${s} UTC+8`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Typing effect
  useEffect(() => {
    if (!mounted || typingDone.current) return;
    typingDone.current = true;

    const text = "cat ./about_me.txt";
    let i = 0;

    function type() {
      if (i <= text.length) {
        setTypedText(text.slice(0, i));
        i++;
        setTimeout(type, 60 + Math.random() * 40);
      }
    }

    setTimeout(type, 800);
  }, [mounted]);

  return (
    <section className="min-h-screen flex flex-col justify-center pt-20 pb-16">
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
          <span>{time}</span>
        </div>

        {/* Terminal prompt */}
        <div className="font-mono text-[clamp(13px,1.4vw,15px)] text-[var(--fg-muted)] mb-5 flex items-center gap-1">
          <span className="text-[var(--accent)]">ken</span>
          <span>@</span>
          <span className="text-[var(--accent2)]">portfolio</span>
          <span className="text-[var(--fg-soft)]">:~</span>
          <span>$&nbsp;</span>
          <span>{typedText}</span>
          <span className="cursor-blink" />
        </div>

        {/* Headline */}
        <h1 className="font-display font-bold text-[clamp(2.2rem,6vw,4.5rem)] leading-[1.08] tracking-tight max-w-[720px] [text-wrap:balance]">
          {profile.tagline.split(".").map((part, i, arr) =>
            i < arr.length - 1 ? (
              <span key={i}>
                {i === 0 ? part + "." : part + "."}
                <br />
              </span>
            ) : part.trim() ? (
              <span key={i}>
                {part.split(" ").map((word, j, words) =>
                  j === words.length - 1 ? (
                    <span key={j} className="text-[var(--accent)] relative">
                      {word}
                      <span className="absolute bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] opacity-40" />
                    </span>
                  ) : (
                    <span key={j}>{word} </span>
                  )
                )}
              </span>
            ) : null
          )}
        </h1>

        {/* Sub text */}
        <p className="mt-7 max-w-[520px] text-[1.05rem] text-[var(--fg-soft)] leading-[1.75]">
          BSIT Cybersecurity student focused on defensive security, secure
          development, and building tools that make the digital world harder to
          break.
        </p>

        {/* Meta blocks */}
        <div className="mt-12 flex flex-wrap gap-6">
          {[
            { label: "identity", value: profile.name },
            { label: "program", value: profile.title },
            { label: "focus", value: "Security + Dev" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-1 px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--bg-soft)] min-w-[140px]"
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--fg-muted)]">
                {item.label}
              </span>
              <span className="font-display text-sm font-medium text-[var(--fg)]">
                {item.value}
              </span>
            </div>
          ))}
          <div className="flex flex-col gap-1 px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--bg-soft)] min-w-[140px]">
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--fg-muted)]">
              status
            </span>
            <span className="font-display text-sm font-medium text-[var(--green)] flex items-center gap-1.5">
              <span className="sec-dot" />
              Open to work
            </span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="mt-20 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--fg-muted)]">
          <div className="w-10 h-px bg-gradient-to-r from-[var(--accent)] to-transparent animate-[scrollPulse_2s_ease-in-out_infinite]" />
          scroll to explore
        </div>
      </div>
    </section>
  );
}
