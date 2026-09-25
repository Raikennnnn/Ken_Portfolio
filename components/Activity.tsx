import type { GithubSnapshot } from "@/lib/github";
import { timeAgo } from "@/lib/github";
import { SectionHeader } from "./SectionHeader";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Lua: "#7c86ff",
  Python: "#3572a5",
  PHP: "#8892bf",
};

/** Live repo feed from GitHub (server-rendered, revalidated hourly). */
export function Activity({ user, snapshot }: { user: string; snapshot: GithubSnapshot | null }) {
  return (
    <section id="activity" className="py-16 md:py-24 scroll-mt-16">
      <SectionHeader id="03" label="Activity" hashOf={snapshot?.repos.map((r) => r.pushedAt) ?? user} />

      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-terminal)] overflow-hidden">
        <div className="flex items-center justify-between px-4 h-9 border-b border-[var(--border)] font-mono text-[10px] text-[var(--fg-muted)]">
          <span>
            <span className="text-[var(--accent)]">$</span> git log --all --remotes=github.com/{user}
          </span>
          <span className="flex items-center gap-2">
            <span className="sec-dot" /> live
          </span>
        </div>

        {snapshot && snapshot.repos.length > 0 ? (
          <ul>
            {snapshot.repos.map((r) => (
              <li key={r.name} className="border-b border-[var(--border)] last:border-0">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[220px_1fr_auto] items-center gap-x-6 gap-y-1 px-4 py-3.5 group hover:bg-[var(--bg-soft)] transition-colors"
                >
                  <span className="font-mono text-[12.5px] text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors">
                    {r.name}
                  </span>
                  <span className="order-3 md:order-none col-span-2 md:col-span-1 text-[0.9rem] text-[var(--fg-soft)] truncate">
                    {r.description ?? "—"}
                  </span>
                  <span className="flex items-center gap-4 font-mono text-[10px] text-[var(--fg-muted)] justify-end">
                    {r.language && (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: LANG_COLORS[r.language] ?? "var(--fg-muted)" }}
                        />
                        {r.language}
                      </span>
                    )}
                    <span className="w-[64px] text-right">{timeAgo(r.pushedAt)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 font-mono text-xs text-[var(--fg-muted)]">
            GitHub didn&apos;t answer this time.{" "}
            <a href={`https://github.com/${user}`} target="_blank" rel="noreferrer" className="text-[var(--accent)]">
              See the repos directly →
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
