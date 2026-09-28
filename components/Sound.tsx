"use client";

import { useEffect, useState } from "react";
import { isSoundOn, onSoundChange, play, setSound } from "@/lib/sound";
import { onThemeChange } from "@/lib/theme";

// Things you can actually click. Text fields are left alone.
const CLICKABLE = 'a[href], button, [role="button"], summary';

/**
 * One listener for the whole page: a tick when the mouse enters something clickable,
 * a confirm on click ("back" when closing an open row), a sweep on theme change.
 * Elements with data-sound="none" stay silent on click (they make their own sound).
 */
export function SoundEffects() {
  useEffect(() => {
    let current: Element | null = null;

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return; // no hover on touch screens
      const el = (e.target as Element).closest?.(CLICKABLE) ?? null;
      if (el && el !== current && !el.hasAttribute("disabled")) play("hover");
      current = el;
    };

    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element).closest?.(CLICKABLE);
      if (!el || el.getAttribute("data-sound") === "none") return;
      play(el.getAttribute("aria-expanded") === "true" ? "back" : "select");
    };

    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("click", onClick, true);
    const offTheme = onThemeChange((t) => play(t === "light" ? "sweep-light" : "sweep-dark"));
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("click", onClick, true);
      offTheme();
    };
  }, []);

  return null;
}

/** Header button. Muted on every visit until the visitor turns it on. */
export function SoundToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(isSoundOn());
    return onSoundChange(setOn);
  }, []);

  return (
    <button
      type="button"
      data-sound="none"
      onClick={() => setSound(!on)}
      className={`btn w-9 justify-center px-0 ${on ? "text-[var(--red)]" : ""}`}
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      title={on ? "Sound on" : "Sound off"}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
        {on ? (
          <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
        ) : (
          <path d="M16 9.5l5 5M21 9.5l-5 5" />
        )}
      </svg>
    </button>
  );
}
