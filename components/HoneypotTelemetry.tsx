import type { HoneypotSummary } from "@/lib/honeypot";

// Fixed locale and UTC so the server and the browser render identical text.
const fmt = new Intl.NumberFormat("en-US");
const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);

/** Stats block inside the honeypot project row. Numbers and allowlisted labels only. */
export function HoneypotTelemetry({ summary, updated }: { summary: HoneypotSummary | null; updated?: string }) {
  if (!summary) {
    return (
      <div className="mt-6 border border-[var(--line)] bg-[var(--bg-sunken)] p-4 flex items-center gap-3">
        <span className="w-1.5 h-1.5 bg-[var(--fg-dim)]" aria-hidden />
        <span className="label">Telemetry unavailable</span>
      </div>
    );
  }

  const { source, totals, series, outcomes, behaviours, topCountries, passwords } = summary;
  const heading =
    source.kind === "dataset"
      ? `Dataset analysis · ${day.format(new Date(summary.window.start))}`
      : source.kind === "sample"
        ? "Sample data"
        : "Live telemetry · 7d";
  const max = Math.max(1, ...series.points.map((p) => p.sessions));
  const maxBeh = Math.max(1, ...behaviours.map((b) => b.sessions));
  const stats: [string, number][] = [
    ["Sessions", totals.sessions],
    ["Login attempts", totals.loginAttempts],
    ["Unique sources", totals.uniqueSources],
    totals.countries !== null ? ["Countries", totals.countries] : ["Commands run", totals.commands],
  ];
  const shape: [string, number, string][] = [
    ["Logged in, then left", outcomes.loginNoCommands, "bg-[var(--red)]"],
    ["No login attempt", outcomes.noLoginAttempt, "bg-[var(--red-line)]"],
    ["Login failed", outcomes.loginFailed, "bg-[var(--line-strong)]"],
    ["Ran commands", outcomes.ranCommands, "bg-[var(--fg-muted)]"],
  ];

  return (
    <div className="mt-6 border border-[var(--line)] bg-[var(--bg-sunken)] p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span className="label text-[var(--red)]">{heading}</span>
        <span className="flex items-center gap-2 label">
          {source.kind === "dataset" && <span className="tag">Public dataset</span>}
          {source.kind === "sample" && <span className="tag">Sample data</span>}
          {source.kind === "sensor" && <span className="w-1.5 h-1.5 bg-[var(--red)] animate-pulse" aria-hidden />}
          {source.kind === "sensor" && updated && <span>updated {updated}</span>}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
        {stats.map(([label, n]) => (
          <div key={label}>
            <dt className="label">{label}</dt>
            <dd className="font-mono text-[1.25rem] text-[var(--fg)] mt-0.5">{fmt.format(n)}</dd>
          </div>
        ))}
      </dl>

      {series.points.length > 0 && (
        <>
          <div className="label mb-2">Sessions per {series.unit}</div>
          <div
            role="img"
            aria-label={`Sessions per ${series.unit}, peak ${fmt.format(max)}`}
            className="flex items-end gap-[2px] h-10 mb-5"
          >
            {series.points.map((p) => (
              <span
                key={p.t}
                title={`${p.t.replace("T", " ").slice(0, 16)} UTC: ${fmt.format(p.sessions)} sessions`}
                className={`flex-1 ${p.sessions === max ? "bg-[var(--red)]" : "bg-[var(--red-line)]"}`}
                style={{ height: `${Math.max(3, Math.round((p.sessions / max) * 100))}%` }}
              />
            ))}
          </div>
        </>
      )}

      <div className="label mb-2">What sessions did</div>
      <div className="flex h-2 mb-2" role="img" aria-label={shape.map(([l, n]) => `${l} ${pct(n, totals.sessions)}%`).join(", ")}>
        {shape.map(([label, n, color]) => (
          <span key={label} className={color} style={{ width: `${pct(n, totals.sessions)}%` }} />
        ))}
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mb-5 text-[0.8rem] text-[var(--fg-muted)]">
        {shape.map(([label, n, color]) => (
          <li key={label} className="flex items-center gap-2">
            <span className={`w-2 h-2 shrink-0 ${color}`} aria-hidden />
            <span className="truncate">{label}</span>
            <span className="ml-auto font-mono text-[11px] text-[var(--fg-dim)]">{pct(n, totals.sessions)}%</span>
          </li>
        ))}
      </ul>

      {behaviours.length > 0 && (
        <>
          <div className="label mb-2">Behaviours seen · ATT&amp;CK · sessions</div>
          <ul className="flex flex-col gap-2 mb-5">
            {behaviours.map((b) => (
              <li key={b.attack} className="grid grid-cols-[76px_1fr_44px] items-center gap-3 text-[0.85rem]">
                <span className="font-mono text-[11px] text-[var(--red)]">{b.attack}</span>
                <span className="relative text-[var(--fg-muted)] pb-1.5 min-w-0 truncate">
                  {b.label}
                  <span
                    className="absolute left-0 bottom-0 h-[2px] bg-[var(--red-line)]"
                    style={{ width: `${Math.round((b.sessions / maxBeh) * 100)}%` }}
                    aria-hidden
                  />
                </span>
                <span className="font-mono text-[11px] text-[var(--fg-dim)] text-right">{fmt.format(b.sessions)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {topCountries.length > 0 && (
        <>
          <div className="label mb-2">Top source countries · by IP location, not attribution</div>
          <p className="font-mono text-[11px] text-[var(--fg-muted)] mb-5 leading-[1.9]">
            {topCountries.map((c) => `${c.name} ${Math.round(c.share * 100)}%`).join("  ·  ")}
          </p>
        </>
      )}

      {passwords.length > 0 && (
        <>
          <div className="label mb-2">Most tried passwords · {summary.passwordMinSources}+ sources each</div>
          <div className="flex flex-wrap gap-1.5 mb-1">
            {passwords.map((p) => (
              <span key={p} className="tag">{p}</span>
            ))}
          </div>
        </>
      )}

      {source.kind === "dataset" && (
        <p className="mt-4 pt-3 border-t border-[var(--line)] text-[0.75rem] leading-[1.6] text-[var(--fg-dim)]">
          Source:{" "}
          <a href={source.url} target="_blank" rel="noreferrer" className="link">
            {source.name}
          </a>{" "}
          ({source.license}). Analysed with my own pipeline; my own sensor isn&apos;t live yet.
        </p>
      )}
    </div>
  );
}
