// Server-side read of the honeypot's public summary.json (see the
// ssh-honeypot-threat-intelligence repo, collector/export.py).
//
// The file is produced by a pipeline that ingests attacker data, so it is
// treated as untrusted: every field is checked here and anything unexpected
// makes the whole summary null (the row then says telemetry is unavailable).
// Only numbers and short allowlisted strings ever reach the page.

import bundled from "@/content/honeypot-summary.json";

export type HoneypotSource =
  | { kind: "sensor" }
  | { kind: "sample" }
  | { kind: "dataset"; name: string; url: string; license: string };

export type HoneypotSummary = {
  source: HoneypotSource;
  generatedAt: string;
  window: { start: string; end: string };
  totals: { sessions: number; loginAttempts: number; uniqueSources: number; commands: number; countries: number | null };
  series: { unit: "hour" | "day"; points: { t: string; sessions: number }[] };
  outcomes: { noLoginAttempt: number; loginFailed: number; loginNoCommands: number; ranCommands: number };
  behaviours: { attack: string; label: string; sessions: number }[];
  topCountries: { name: string; share: number }[];
  passwords: string[];
  passwordMinSources: number;
};

const ISO_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const TECHNIQUE = /^T\d{4}(\.\d{3})?$/;
const LABEL = /^[A-Za-z][A-Za-z /-]{0,39}$/;
const COUNTRY = /^[A-Za-z][A-Za-z .'-]{0,39}$/;
const TEXT = /^[A-Za-z0-9][A-Za-z0-9 .,()-]{0,79}$/;
const PASSWORD = /^[\x21-\x7e]{1,32}$/;
// Dataset links go into an href: only exact, known-safe prefixes.
const SAFE_URL = /^https:\/\/(doi\.org|zenodo\.org)\/[A-Za-z0-9./_-]{1,100}$/;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < 1e9;
const isShare = (v: unknown): v is number => typeof v === "number" && v >= 0 && v <= 1;
const isTime = (v: unknown): v is string => typeof v === "string" && ISO_TIME.test(v);

function parseSource(s: unknown): HoneypotSource | null {
  if (!isObj(s)) return null;
  if (s.kind === "sensor" || s.kind === "sample") return { kind: s.kind };
  if (s.kind !== "dataset") return null;
  if (typeof s.name !== "string" || !TEXT.test(s.name)) return null;
  if (typeof s.license !== "string" || !TEXT.test(s.license)) return null;
  if (typeof s.url !== "string" || !SAFE_URL.test(s.url)) return null;
  return { kind: "dataset", name: s.name, url: s.url, license: s.license };
}

/** Strict validation. Returns null if anything is off. */
export function parseSummary(raw: unknown): HoneypotSummary | null {
  if (!isObj(raw) || raw.schema !== 1 || !isTime(raw.generated_at)) return null;
  const source = parseSource(raw.source);
  const { window: w, totals: t, series, outcomes: o } = raw;
  if (!source || !isObj(w) || !isTime(w.start) || !isTime(w.end)) return null;
  if (!isObj(t) || ![t.sessions, t.login_attempts, t.unique_sources, t.commands].every(isCount)) return null;
  if (!(t.countries === null || isCount(t.countries))) return null;
  if (!isObj(series) || (series.unit !== "hour" && series.unit !== "day")) return null;
  if (!Array.isArray(series.points) || series.points.length > 96) return null;
  if (!isObj(o) || ![o.no_login_attempt, o.login_failed, o.login_no_commands, o.ran_commands].every(isCount)) return null;
  const { behaviours, top_countries: countries, passwords } = raw;
  if (!Array.isArray(behaviours) || behaviours.length > 10) return null;
  if (!Array.isArray(countries) || countries.length > 10) return null;
  if (!Array.isArray(passwords) || passwords.length > 10) return null;
  if (!isCount(raw.password_min_sources) || raw.password_min_sources < 20) return null;

  const points: HoneypotSummary["series"]["points"] = [];
  for (const p of series.points) {
    if (!isObj(p) || !isTime(p.t) || !isCount(p.sessions)) return null;
    points.push({ t: p.t, sessions: p.sessions });
  }
  const behs: HoneypotSummary["behaviours"] = [];
  for (const b of behaviours) {
    if (!isObj(b) || typeof b.attack !== "string" || !TECHNIQUE.test(b.attack)) return null;
    if (typeof b.label !== "string" || !LABEL.test(b.label) || !isCount(b.sessions)) return null;
    behs.push({ attack: b.attack, label: b.label, sessions: b.sessions });
  }
  const tops: HoneypotSummary["topCountries"] = [];
  for (const c of countries) {
    if (!isObj(c) || typeof c.name !== "string" || !COUNTRY.test(c.name) || !isShare(c.share)) return null;
    tops.push({ name: c.name, share: c.share });
  }
  if (!passwords.every((p): p is string => typeof p === "string" && PASSWORD.test(p))) return null;

  return {
    source,
    generatedAt: raw.generated_at,
    window: { start: w.start, end: w.end },
    totals: {
      sessions: t.sessions as number,
      loginAttempts: t.login_attempts as number,
      uniqueSources: t.unique_sources as number,
      commands: t.commands as number,
      countries: t.countries as number | null,
    },
    series: { unit: series.unit, points },
    outcomes: {
      noLoginAttempt: o.no_login_attempt as number,
      loginFailed: o.login_failed as number,
      loginNoCommands: o.login_no_commands as number,
      ranCommands: o.ran_commands as number,
    },
    behaviours: behs,
    topCountries: tops,
    passwords,
    passwordMinSources: raw.password_min_sources,
  };
}

/**
 * Where the summary comes from, first match wins:
 * 1. HONEYPOT_SUMMARY_FILE: a local file, for previews in `next dev` only
 * 2. HONEYPOT_SUMMARY_URL: the live sensor's published file (raw.githubusercontent.com)
 * 3. content/honeypot-summary.json: the bundled dataset analysis
 */
export async function getHoneypotSummary(): Promise<HoneypotSummary | null> {
  try {
    const file = process.env.HONEYPOT_SUMMARY_FILE;
    if (file && process.env.NODE_ENV !== "production") {
      const { readFile } = await import("node:fs/promises");
      return parseSummary(JSON.parse(await readFile(file, "utf8")));
    }
    const url = process.env.HONEYPOT_SUMMARY_URL;
    if (url && url.startsWith("https://raw.githubusercontent.com/")) {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (res.ok && Number(res.headers.get("content-length") ?? 0) <= 64_000) {
        const live = parseSummary(await res.json());
        if (live) return live;
      }
    }
    return parseSummary(bundled);
  } catch {
    return parseSummary(bundled);
  }
}
