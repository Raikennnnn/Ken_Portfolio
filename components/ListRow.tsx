"use client";

import { useState, type ReactNode } from "react";

/**
 * Expandable list row used by Selected work and Security testing.
 * The open row gets the red selection bar and a drifting marker (NG4 menu cue).
 */
export function ListRow({
  id,
  index,
  title,
  meta,
  year,
  defaultOpen = false,
  children,
}: {
  id: string;
  index: string;
  title: string;
  meta: string;
  year: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `${id}-panel`;

  return (
    <div className={`relative border-b border-[var(--line)] ${open ? "bg-[var(--red-soft)]" : ""} transition-colors`}>
      <span
        className={`absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--red)] transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        aria-hidden
      />

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="group w-full grid grid-cols-[18px_auto_1fr_auto] md:grid-cols-[18px_auto_1fr_auto_auto] items-center gap-3 md:gap-5 px-3 md:px-5 py-5 text-left"
      >
        <span
          className={`text-[var(--red)] font-mono text-sm ${open ? "nudge" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
          aria-hidden
        >
          ›
        </span>
        <span className="font-mono text-[11px] text-[var(--fg-dim)]">{index}</span>
        <span className="font-serif text-[1.2rem] md:text-[1.35rem] font-medium tracking-tight truncate">{title}</span>
        <span className="label hidden md:block">{meta}</span>
        <span className="flex items-center gap-4">
          <span className="font-mono text-[11px] text-[var(--fg-dim)]">{year}</span>
          <span className="font-mono text-[13px] text-[var(--fg-muted)] w-3 text-center" aria-hidden>
            {open ? "−" : "+"}
          </span>
        </span>
      </button>

      <div
        id={panelId}
        className="grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
      >
        <div className="overflow-hidden">
          <div className="px-3 md:px-5 pb-7 md:pl-[3.75rem]">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Sunken side panel with a red label and a kanji tag. */
export function NotesPanel({
  label,
  kanji,
  meaning,
  children,
}: {
  label: string;
  kanji: string;
  meaning: string;
  children: ReactNode;
}) {
  return (
    <div className="border border-[var(--line)] bg-[var(--bg-sunken)] p-5">
      <div className="flex items-baseline justify-between mb-4">
        <span className="label text-[var(--red)]">{label}</span>
        <span className="kanji text-[12px] text-[var(--fg-dim)]" lang="ja" title={`${kanji} — ${meaning}`}>
          {kanji}
        </span>
      </div>
      {children}
    </div>
  );
}
