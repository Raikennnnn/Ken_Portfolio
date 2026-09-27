"use client";

import { useState } from "react";
import type { Project } from "@/content/data";

export function ProjectRow({ project, defaultOpen = false }: { project: Project; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `project-${project.index}`;

  return (
    <div className={`relative border-b border-[var(--line)] ${open ? "bg-[var(--red-soft)]" : ""} transition-colors`}>
      {/* selected bar */}
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
        <span className={`text-[var(--red)] font-mono text-sm ${open ? "nudge" : "opacity-0 group-hover:opacity-100"} transition-opacity`} aria-hidden>
          ›
        </span>
        <span className="font-mono text-[11px] text-[var(--fg-dim)]">{project.index}</span>
        <span className="font-serif text-[1.2rem] md:text-[1.35rem] font-medium tracking-tight truncate">
          {project.title}
        </span>
        <span className="label hidden md:block">{project.role}</span>
        <span className="flex items-center gap-4">
          <span className="font-mono text-[11px] text-[var(--fg-dim)]">{project.year}</span>
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
          <div className="grid md:grid-cols-2 gap-6 md:gap-10 px-3 md:px-5 pb-7 md:pl-[3.75rem]">
            <div>
              <p className="text-[0.97rem] leading-[1.75] text-[var(--fg-muted)]">{project.summary}</p>
              <div className="flex flex-wrap gap-1.5 mt-5">
                {project.stack.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mt-6">
                {project.url && (
                  <a href={project.url} target="_blank" rel="noreferrer" className="btn">
                    Live site ↗
                  </a>
                )}
                {project.repo && (
                  <a href={project.repo} target="_blank" rel="noreferrer" className="btn">
                    Repository ↗
                  </a>
                )}
              </div>
            </div>

            <div className="border border-[var(--line)] bg-[var(--bg-sunken)] p-5">
              <div className="flex items-baseline justify-between mb-4">
                <span className="label text-[var(--red)]">Security notes</span>
                <span className="kanji text-[12px] text-[var(--fg-dim)]" lang="ja" title="安全 — safety, security">
                  安全
                </span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {project.security.map((s) => (
                  <li key={s} className="flex gap-3 text-[0.9rem] leading-[1.6] text-[var(--fg-muted)]">
                    <span className="mt-[0.6em] w-1 h-1 shrink-0 bg-[var(--red)]" aria-hidden />
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
