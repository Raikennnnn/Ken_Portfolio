import type { GithubSnapshot } from "@/lib/github";
import { timeAgo } from "@/lib/github";
import { SectionHeader } from "./SectionHeader";

/** Live repo feed from GitHub (server-rendered, revalidated hourly). */
export function Activity({ user, snapshot }: { user: string; snapshot: GithubSnapshot | null }) {
  return (
    <section id="activity" className="py-20 md:py-28 scroll-mt-16">
      <SectionHeader index="04" title="Activity" kanji="記録" meaning="log" />

      <div className="panel">
        <div className="flex items-center justify-between gap-4 px-5 h-11 border-b border-[var(--line)]">
          <span className="label text-[var(--fg-muted)]">Recent repositories</span>
          <a href={`https://github.com/${user}`} target="_blank" rel="noreferrer" className="label hover:text-[var(--red)] transition-colors">
            github.com/{user} ↗
          </a>
        </div>

        {snapshot && snapshot.repos.length > 0 ? (
          <ul>
            {snapshot.repos.map((r) => (
              <li key={r.name} className="border-b border-[var(--line)] last:border-0">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group grid grid-cols-[1fr_auto] md:grid-cols-[220px_1fr_auto] items-baseline gap-x-6 gap-y-1 px-5 py-4 hover:bg-[var(--red-soft)] transition-colors"
                >
                  <span className="font-mono text-[13px] group-hover:text-[var(--red)] transition-colors">{r.name}</span>
                  <span className="order-3 md:order-none col-span-2 md:col-span-1 text-[0.9rem] text-[var(--fg-muted)] truncate">
                    {r.description ?? "—"}
                  </span>
                  <span className="flex items-center gap-5 font-mono text-[11px] text-[var(--fg-dim)] justify-end">
                    {r.language && <span>{r.language}</span>}
                    <span className="w-[64px] text-right">{timeAgo(r.pushedAt)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-6 text-[0.9rem] text-[var(--fg-muted)]">
            GitHub didn&apos;t respond this time.{" "}
            <a href={`https://github.com/${user}`} target="_blank" rel="noreferrer" className="link">
              See the repositories directly
            </a>
            .
          </p>
        )}
      </div>
    </section>
  );
}
