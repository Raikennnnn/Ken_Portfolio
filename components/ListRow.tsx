"use client";

import { useState, type ReactNode } from "react";

/**
 * Expandable list row used by Selected work and Security testing.
 * The open row gets the red selection bar and a drifting marker.
 */
export function ListRow({
  id,
  index,
  title,
  meta,
  year,
  children,
}: {
  id: string;
  index: string;
  title: string;
  meta: string;
  year: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
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
        <span className="font-serif text-[1.2rem] md:text-[1.35rem] font-medium tracking-tight min-w-0 break-words sm:truncate">{title}</span>
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

/** Sunken side panel with a red label. */
export function NotesPanel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border border-[var(--line)] bg-[var(--bg-sunken)] p-5">
      <div className="label text-[var(--red)] mb-4">{label}</div>
      {children}
    </div>
  );
}

/** "Live site" / "Repository" buttons, plus an optional trailing note. */
export function RepoLinks({ url, repo, note }: { url?: string; repo?: string; note?: string }) {
  if (!url && !repo && !note) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-6">
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="btn">
          Live site ↗
        </a>
      )}
      {repo && (
        <a href={repo} target="_blank" rel="noreferrer" className="btn">
          Repository ↗
        </a>
      )}
      {note && <span className="label">{note}</span>}
    </div>
  );
}
