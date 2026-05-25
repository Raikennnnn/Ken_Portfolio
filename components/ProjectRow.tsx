"use client";

import { useState } from "react";
import type { Project } from "@/content/data";

export function ProjectRow({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);

  const primaryHref = project.url ?? project.repo;

  return (
    <div className="border-b border-current/20">
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid w-full grid-cols-12 items-baseline gap-4 py-5 md:py-7 text-left group"
        aria-expanded={open}
      >
        {/* Index */}
        <span className="col-span-2 md:col-span-1 font-mono text-xs opacity-50">
          {project.index}
        </span>

        {/* Title */}
        <span className="col-span-10 md:col-span-5 font-serif text-2xl md:text-3xl tracking-tight transition-transform duration-500 group-hover:translate-x-2">
          {project.title}
        </span>

        {/* Role */}
        <span className="hidden md:block md:col-span-3 font-mono text-xs uppercase tracking-widest opacity-60">
          {project.role}
        </span>

        {/* Year + chevron */}
        <span className="col-span-12 md:col-span-3 flex items-center justify-end gap-3 font-mono text-xs uppercase tracking-widest opacity-60">
          <span>{project.year}</span>
          <span
            className="inline-block transition-transform duration-300"
            style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
            aria-hidden
          >
            +
          </span>
        </span>
      </button>

      {/* Expanded panel */}
      <div
        className="grid grid-cols-12 gap-4 overflow-hidden transition-[max-height,opacity] duration-500 ease-out"
        style={{
          maxHeight: open ? 400 : 0,
          opacity: open ? 1 : 0,
        }}
      >
        <div className="hidden md:block md:col-span-1" />
        <div className="col-span-12 md:col-span-7 pb-8">
          <p className="font-serif text-lg md:text-xl leading-relaxed opacity-90 mb-4">
            {project.summary}
          </p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] uppercase tracking-widest border border-current/30 px-2 py-1 rounded-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="col-span-12 md:col-span-4 pb-8 flex md:flex-col md:items-end gap-3 md:gap-2">
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noreferrer"
              className="row-link font-mono text-xs uppercase tracking-widest"
            >
              live ↗
            </a>
          )}
          {project.repo && (
            <a
              href={project.repo}
              target="_blank"
              rel="noreferrer"
              className="row-link font-mono text-xs uppercase tracking-widest"
            >
              repo ↗
            </a>
          )}
          {!project.url && !project.repo && primaryHref === undefined && (
            <span className="font-mono text-xs uppercase tracking-widest opacity-40">
              private
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
