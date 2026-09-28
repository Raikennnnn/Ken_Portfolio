"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { pad2 } from "@/lib/format";
import { openRoom } from "@/lib/roomBus";
import { toggleTerminal } from "@/lib/terminalBus";

// Icons, 24×24 stroke paths
const I = {
  about: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  experience: <><rect x="3" y="7" width="18" height="13" rx="1" /><path d="M9 7V4h6v3M3 12h18" /></>,
  work: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  security: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  credentials: <><circle cx="12" cy="9" r="5" /><path d="M8.5 13l-2 8 5.5-3 5.5 3-2-8" /></>,
  skills: <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" />,
  ctf: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  contact: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="M3 6l9 7 9-7" /></>,
  room: <path d="M6 21V3h12v18M3 21h18M14 12h1" />,
  terminal: <path d="M5 8l4 4-4 4M11 17h8" />,
} satisfies Record<string, ReactNode>;

export type MenuSection = { id: string; label: string };
type MenuNode = { key: string; label: string; icon: ReactNode; href?: string; action?: () => void; current?: boolean };

const STEP_Y = 46; // vertical distance between nodes
const ZIG = 40; // horizontal zigzag offset
const ROOT = { x: 18, y: 18 }; // centre of the burger button
const CLOSE_MS = 260;

/** Desktop section menu: the burger turns into a diamond and a chain of diamond icons unfolds. */
export function DiamondMenu({ sections, active }: { sections: MenuSection[]; active: string | null }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const close = (focusRoot = false) => {
    setOpen(false);
    if (focusRoot) rootRef.current?.focus();
  };

  const nodes: MenuNode[] = [
    ...sections.map((s) => ({
      key: s.id,
      label: s.label,
      icon: I[s.id as keyof typeof I] ?? I.work,
      href: `#${s.id}`,
      current: active === s.id,
    })),
    { key: "room", label: "Server room", icon: I.room, action: () => openRoom() },
    { key: "terminal", label: "Terminal", icon: I.terminal, action: () => toggleTerminal(true) },
  ];
  const pos = nodes.map((_, i) => ({ x: ROOT.x + (i % 2 ? ZIG : 0), y: ROOT.y + 58 + i * STEP_Y }));
  const points = [ROOT, ...pos].map((p) => `${p.x},${p.y}`).join(" ");
  const length = [ROOT, ...pos].slice(1).reduce((sum, p, i, arr) => {
    const prev = i === 0 ? ROOT : arr[i - 1];
    return sum + Math.hypot(p.x - prev.x, p.y - prev.y);
  }, 0);

  // mount on open, play the fold-away before unmounting
  useEffect(() => {
    if (open) {
      setClosing(false);
      setMounted(true);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const t = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, CLOSE_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // once the diamonds exist, put keyboard focus on the first one
  useEffect(() => {
    if (open && mounted) itemRefs.current[0]?.focus({ preventScroll: true });
  }, [open, mounted]);

  // Esc, arrow keys between diamonds, click outside
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close(true);
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const i = itemRefs.current.findIndex((el) => el === document.activeElement);
      const next = e.key === "ArrowDown" ? Math.min(nodes.length - 1, i + 1) : Math.max(0, i - 1);
      itemRefs.current[next]?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={wrapRef} className={`dm relative w-9 h-9 ${closing ? "dm-closing" : ""}`}>
      <button
        ref={rootRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`dm-root ${open ? "dm-root-open" : ""}`}
        aria-expanded={open}
        aria-controls="section-menu"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <span className="dm-root-frame" aria-hidden />
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {/* dim the page behind the menu, like a game's pause screen. Portalled next to the header:
          inside it, the header's blur would trap a fixed element; on <body>, it would sit above
          the page wrapper (and the header with it). */}
      {mounted &&
        createPortal(
          <div className={`dm-backdrop ${closing ? "dm-backdrop-out" : ""}`} aria-hidden />,
          rootRef.current?.closest("header")?.parentElement ?? document.body
        )}

      {mounted && (
        <nav id="section-menu" aria-label="Sections" className="absolute left-0 top-0 z-[70]">
          <svg className="dm-lines" width={ROOT.x + ZIG + 40} height={pos[pos.length - 1].y + 30} aria-hidden>
            <polyline
              className="dm-line"
              points={points}
              fill="none"
              style={{ strokeDasharray: length, ["--len" as string]: length }}
            />
          </svg>
          <ul>
            {nodes.map((n, i) => {
              const inner = (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {n.icon}
                </svg>
              );
              const common = {
                ref: (el: HTMLElement | null) => {
                  itemRefs.current[i] = el;
                },
                className: `dm-item ${n.current ? "dm-current" : ""}`,
                "aria-label": n.label,
                "aria-current": n.current ? ("true" as const) : undefined,
                onClick: () => {
                  n.action?.();
                  close();
                },
              };
              return (
                <li key={n.key} className="dm-node" style={{ left: pos[i].x, top: pos[i].y, ["--i" as string]: i, ["--n" as string]: nodes.length }}>
                  {n.href ? (
                    <a href={n.href} {...common}>
                      {inner}
                    </a>
                  ) : (
                    <button type="button" {...common}>
                      {inner}
                    </button>
                  )}
                  <span className="dm-label" aria-hidden>
                    <span className="text-[var(--red)]">{n.href ? pad2(i + 1) : "··"}</span> {n.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}

