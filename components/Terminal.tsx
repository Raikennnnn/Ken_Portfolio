"use client";

import { useEffect, useRef, useState } from "react";
import { onToggleTerminal } from "@/lib/terminalBus";
import { openRoom } from "@/lib/roomBus";
import { useKeyboardFit } from "@/lib/useKeyboardFit";
import { Console } from "./Console";

const CLOSE_MS = 220; // closing is quicker than opening

/** The page terminal: a popup around the shared Console. */
export function Terminal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  // Phones: fit the window into the visible area above the on-screen keyboard.
  const fit = useKeyboardFit(open);
  const lastFocus = useRef<HTMLElement | null>(null);

  // Open / close from anywhere: header button, Ctrl/⌘+K, "/" or "`".
  useEffect(() => {
    const offToggle = onToggleTerminal((next) => setOpen((o) => (next === undefined ? !o : next)));
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typingElsewhere = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (!typingElsewhere && (e.key === "/" || e.key === "`")) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      offToggle();
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Mount on open; on close, play the exit animation first, then unmount.
  useEffect(() => {
    if (open) {
      setClosing(false);
      setMounted(true);
      lastFocus.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = "hidden";
      return;
    }
    if (!mounted) return;
    setClosing(true);
    document.body.style.overflow = "";
    const t = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
      lastFocus.current?.focus?.({ preventScroll: true });
    }, CLOSE_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const goto = (id: string) => {
    setOpen(false);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), CLOSE_MS);
  };

  const room = () => {
    setOpen(false);
    window.setTimeout(openRoom, CLOSE_MS);
  };

  if (!mounted) return null;

  return (
    <>
      <div
        className={`term-backdrop fixed inset-0 z-[60] bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] backdrop-blur-sm ${closing ? "closing" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      {!closing && (
        <div className="fixed inset-0 z-[61] pointer-events-none" aria-hidden>
          <div className="term-ring" />
          <div className="term-slice" style={{ top: "34%" }} />
          <div className="term-slice" style={{ top: "57%", animationDelay: "60ms" }} />
        </div>
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Terminal"
        className={`term-window terminal-window fixed z-[62] left-1/2 top-[12vh] w-[min(720px,calc(100vw-24px))] -translate-x-1/2 flex flex-col panel corners shadow-[0_30px_80px_rgba(0,0,0,0.35)] ${closing ? "closing" : ""}`}
        style={fit ? { top: fit.top, height: fit.height } : undefined}
      >
        <div className="flex items-center gap-3 px-4 h-10 border-b border-[var(--line)] shrink-0">
          <span className="font-mono text-[12px] text-[var(--red)]">&gt;_</span>
          <span className="label">Terminal</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto label hover:text-[var(--red)] transition-colors"
            aria-label="Close terminal"
          >
            Esc
          </button>
        </div>
        <Console
          where="page"
          onExit={() => setOpen(false)}
          onGoto={goto}
          onRoom={room}
          className={fit ? "flex-1 min-h-0" : "h-[min(56vh,440px)]"}
        />
      </div>
    </>
  );
}
