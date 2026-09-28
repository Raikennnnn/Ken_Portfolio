import type { LiveFeed as Feed } from "@/lib/dshield";

// Fixed locale and UTC so the server and the browser render identical text.
const fmt = new Intl.NumberFormat("en-US");
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const short = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** Daily global SSH attack data from SANS ISC DShield, collected by Higanbana. */
export function LiveFeed({ feed, stale }: { feed: Feed; stale: boolean }) {
  const { ssh, history, topPorts, topUsernames } = feed;
  const maxDay = Math.max(1, ...history.map((d) => d.reports));
  const maxPort = Math.max(1, ...topPorts.map((p) => p.reports));
  const dataDate = day.format(new Date(`${feed.date}T00:00:00Z`));
  const stats: [string, string][] = [
    ["SSH attack reports", fmt.format(ssh.reports)],
    ["Attacking IPs", fmt.format(ssh.sources)],
    ["Reporting sensors", fmt.format(ssh.targets)],
    ["SSH rank among ports", ssh.rank ? `#${ssh.rank}` : "–"],
  ];

  return (
    <div className="mt-6 border border-[var(--line)] bg-[var(--bg-sunken)] p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span className="flex items-center gap-2 label text-[var(--red)]">
          <span className={`w-1.5 h-1.5 ${stale ? "bg-[var(--fg-dim)]" : "bg-[var(--red)] animate-pulse"}`} aria-hidden />
          Live · global SSH attacks
        </span>
        <span className="flex items-center gap-2 label">
          <span className="tag whitespace-nowrap">SANS ISC</span>
          <span>{stale ? `last data ${dataDate}` : `data for ${dataDate}`}</span>
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt className="label">{label}</dt>
            <dd className="font-mono text-[1.25rem] text-[var(--fg)] mt-0.5">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="label mb-2">SSH reports per day · last {history.length} days</div>
      <div
        role="img"
        aria-label={`SSH attack reports per day from ${short.format(new Date(`${history[0].date}T00:00:00Z`))} to ${short.format(new Date(`${history[history.length - 1].date}T00:00:00Z`))}, peak ${fmt.format(maxDay)}`}
        className="flex items-end gap-[2px] h-10 mb-5"
      >
        {history.map((d, i) => (
          <span
            key={d.date}
            title={`${d.date}: ${fmt.format(d.reports)} reports from ${fmt.format(d.sources)} IPs`}
            className={`flex-1 ${i === history.length - 1 ? "bg-[var(--red)]" : "bg-[var(--red-line)]"}`}
            style={{ height: `${Math.max(3, Math.round((d.reports / maxDay) * 100))}%` }}
          />
        ))}
      </div>

      <div className="label mb-2">Most attacked ports · {short.format(new Date(`${feed.date}T00:00:00Z`))}</div>
      <ul className="flex flex-col gap-2 mb-5">
        {topPorts.map((p) => (
          <li key={p.port} className="grid grid-cols-[52px_1fr_52px] items-center gap-3 text-[0.85rem]">
            <span className="font-mono text-[11px] text-[var(--red)]">{p.port}</span>
            <span className="relative text-[var(--fg-muted)] pb-1.5 min-w-0 truncate">
              {p.service ?? "unassigned"}
              <span
                className="absolute left-0 bottom-0 h-[2px] bg-[var(--red-line)]"
                style={{ width: `${Math.round((p.reports / maxPort) * 100)}%` }}
                aria-hidden
              />
            </span>
            <span className="font-mono text-[11px] text-[var(--fg-dim)] text-right">{compact.format(p.reports)}</span>
          </li>
        ))}
      </ul>

      {topUsernames.length > 0 && (
        <>
          <div className="label mb-2">Most tried SSH usernames · ranked, last 30 days</div>
          <div className="flex flex-wrap gap-1.5 mb-1">
            {topUsernames.map((u) => (
              <span key={u} className="tag">{u}</span>
            ))}
          </div>
        </>
      )}

      <p className="mt-4 pt-3 border-t border-[var(--line)] text-[0.75rem] leading-[1.6] text-[var(--fg-dim)]">
        Data:{" "}
        <a href="https://isc.sans.edu" target="_blank" rel="noreferrer" className="link">
          SANS Internet Storm Center / DShield
        </a>{" "}
        (
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer" className="link">
          CC BY-NC-SA 4.0
        </a>
        ), collected daily by my pipeline.
      </p>
    </div>
  );
}
