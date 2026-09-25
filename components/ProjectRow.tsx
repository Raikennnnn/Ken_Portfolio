"use client";

import { useState } from "react";
import type { Project } from "@/content/data";

export function ProjectRow({
  project,
  delay = 0,
}: {
  project: Project;
  delay?: number;
}) {
  const [open, setOpen] = useState(false);

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
      >
        {/* Index */}
        <span className="font-mono text-xs text-[var(--accent)] font-semibold opacity-60">
          {project.index}
        </span>

        {/* Title */}
        <span className="font-display text-[1.15rem] md:text-[1.3rem] font-semibold tracking-tight transition-colors duration-300 group-hover:text-[var(--accent)]">
          {project.title}
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

      {/* Expanded panel */}
      <div
        className="overflow-hidden transition-all duration-500 ease-out"
        style={{
          maxHeight: open ? 300 : 0,
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-5 md:px-6 pb-5 flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <p className="text-[0.95rem] text-[var(--fg-soft)] leading-[1.7] max-w-[520px] mb-2.5">
              {project.summary}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {project.tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0 items-start">
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noreferrer"
                className="btn-cmd text-[10px] py-1.5 px-3"
              >
                <span className="prompt">$</span> live
              </a>
            )}
            {project.repo && (
              <a
                href={project.repo}
                target="_blank"
                rel="noreferrer"
                className="btn-cmd text-[10px] py-1.5 px-3"
              >
                <span className="prompt">$</span> repo
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
