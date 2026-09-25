"use client";

import { useState } from "react";
import type { Project } from "@/content/data";

export function ProjectRow({
  project,
  delay = 0,
  defaultOpen = false,
}: {
  project: Project;
  delay?: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `project-${project.index}`;

  return (
    <div
      className="card-interactive mb-3"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid w-full items-center gap-4 p-[18px_20px] md:p-[20px_24px] text-left group"
        style={{ gridTemplateColumns: "auto 1fr auto auto" }}
        aria-expanded={open}
        aria-controls={panelId}
      >
        {/* Index */}
        <span className="font-mono text-xs text-[var(--accent)] font-semibold opacity-60">
          {project.index}
        </span>

        {/* Title + security count */}
        <span className="flex items-center gap-3 min-w-0">
          <span className="font-display text-[1.15rem] md:text-[1.3rem] font-semibold tracking-tight transition-colors duration-300 group-hover:text-[var(--accent)] truncate">
            {project.title}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--green)] border border-[color-mix(in_srgb,var(--green)_25%,transparent)] rounded px-1.5 py-0.5">
            <span aria-hidden>✓</span> {project.security.length} security notes
          </span>
        </span>

        {/* Role */}
        <span className="hidden md:block font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--fg-muted)]">
          {project.role}
        </span>

        {/* Year + toggle */}
        <span className="flex items-center gap-2.5 font-mono text-[10px] text-[var(--fg-muted)]">
          <span>{project.year}</span>
          <span
            className={`w-5 h-5 flex items-center justify-center border rounded text-[13px] text-[var(--accent)] transition-all duration-300 ${
              open
                ? "rotate-45 border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
                : "border-[var(--border)]"
            }`}
            aria-hidden
          >
            +
          </span>
        </span>
      </button>

      {/* Expanded panel — grid-rows trick animates to the content's real height */}
      <div
        id={panelId}
        className="grid transition-[grid-template-rows,opacity] duration-500 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
      >
        <div className="overflow-hidden">
          <div className="px-5 md:px-6 pb-6 grid md:grid-cols-[1fr_1fr] gap-6">
            <div>
              <p className="text-[0.95rem] text-[var(--fg-soft)] leading-[1.7] mb-4">
                {project.summary}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {project.stack.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mt-5">
                {project.url && (
                  <a href={project.url} target="_blank" rel="noreferrer" className="btn-cmd text-[10px] py-1.5 px-3">
                    <span className="prompt">$</span> live
                  </a>
                )}
                {project.repo && (
                  <a href={project.repo} target="_blank" rel="noreferrer" className="btn-cmd text-[10px] py-1.5 px-3">
                    <span className="prompt">$</span> repo
                  </a>
                )}
              </div>
            </div>

            {/* Security notes */}
            <div className="rounded-md border border-[var(--border)] bg-[var(--bg-terminal)] p-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--green)] mb-3">
                $ audit --notes
              </div>
              <ul className="flex flex-col gap-2">
                {project.security.map((s) => (
                  <li key={s} className="flex gap-2.5 font-mono text-[11.5px] leading-[1.6] text-[var(--fg-soft)]">
                    <span className="text-[var(--green)] shrink-0" aria-hidden>
                      ✓
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
