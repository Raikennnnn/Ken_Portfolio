"use client";

import type { Project } from "@/content/data";
import { ListRow, NotesPanel, RepoLinks } from "./ListRow";
import { HoneypotTelemetry } from "./HoneypotTelemetry";
import type { LiveData } from "./Work";

export function ProjectRow({
  project,
  lastPush,
  live,
}: {
  project: Project;
  /** e.g. "2w ago", from GitHub */
  lastPush?: string;
  live?: LiveData;
}) {
  return (
    <ListRow
      id={`project-${project.index}`}
      index={project.index}
      title={project.title}
      meta={project.role}
      year={project.year}
    >
      <div className="grid md:grid-cols-2 gap-6 md:gap-10">
        <div>
          <p className="text-[0.97rem] leading-[1.75] text-[var(--fg-muted)]">{project.summary}</p>
          {project.live === "honeypot" && live && (
            <HoneypotTelemetry summary={live.honeypot} updated={live.honeypotUpdated} />
          )}
          <div className="flex flex-wrap gap-1.5 mt-5">
            {project.stack.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
          <RepoLinks url={project.url} repo={project.repo} note={lastPush && `Last push ${lastPush}`} />
        </div>

        <NotesPanel label="Security notes">
          <ul className="flex flex-col gap-2.5">
            {project.security.map((s) => (
              <li key={s} className="flex gap-3 text-[0.9rem] leading-[1.6] text-[var(--fg-muted)]">
                <span className="mt-[0.6em] w-1 h-1 shrink-0 bg-[var(--red)]" aria-hidden />
                {s}
              </li>
            ))}
          </ul>
        </NotesPanel>
      </div>
    </ListRow>
  );
}
