// Server-side read of the daily DShield summary that Higanbana's GitHub
// Actions job publishes (collector/dshield.py in the Higanbana repo).
//
// The usernames in it come from attackers, so the file is treated as
// untrusted: every field is checked and anything unexpected hides the block.
// Attribution text and links are hardcoded in the component, not read from
// the data.

export const LIVE_FEED_URL =
  "https://raw.githubusercontent.com/Raikennnnn/Higanbana/data/dshield/summary.json";

export type LiveFeed = {
  generatedAt: string;
  date: string;
  ssh: { reports: number; sources: number; targets: number; rank: number | null };
  history: { date: string; reports: number; sources: number }[];
  topPorts: { port: number; service: string | null; reports: number }[];
  topUsernames: string[];
};

const ISO_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SERVICE = /^[A-Za-z][A-Za-z0-9 ()-]{0,30}$/;
const USERNAME = /^[A-Za-z0-9._@+=!#$%*-]{1,32}$/;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < 1e12;

/** Strict validation. Returns null if anything is off. */
export function parseLiveFeed(raw: unknown): LiveFeed | null {
  if (!isObj(raw) || raw.schema !== 1) return null;
  const { generated_at, date, ssh, ssh_history, top_ports, top_usernames } = raw;
  if (typeof generated_at !== "string" || !ISO_TIME.test(generated_at)) return null;
  if (typeof date !== "string" || !ISO_DATE.test(date)) return null;
  if (!isObj(ssh) || ![ssh.reports, ssh.sources, ssh.targets].every(isCount)) return null;
  const rank = ssh.rank;
  if (!(rank === null || (Number.isInteger(rank) && (rank as number) >= 1 && (rank as number) <= 20))) return null;
  if (!Array.isArray(ssh_history) || ssh_history.length < 1 || ssh_history.length > 31) return null;
  if (!Array.isArray(top_ports) || top_ports.length < 1 || top_ports.length > 10) return null;
  if (!Array.isArray(top_usernames) || top_usernames.length > 10) return null;

  const history: LiveFeed["history"] = [];
  for (const d of ssh_history) {
    if (!isObj(d) || typeof d.date !== "string" || !ISO_DATE.test(d.date)) return null;
    if (!isCount(d.reports) || !isCount(d.sources)) return null;
    history.push({ date: d.date, reports: d.reports, sources: d.sources });
  }
  const ports: LiveFeed["topPorts"] = [];
  for (const p of top_ports) {
    if (!isObj(p) || !Number.isInteger(p.port) || (p.port as number) < 1 || (p.port as number) > 65535) return null;
    if (!(p.service === null || (typeof p.service === "string" && SERVICE.test(p.service)))) return null;
    if (!isCount(p.reports)) return null;
    ports.push({ port: p.port as number, service: p.service as string | null, reports: p.reports });
  }
  if (!top_usernames.every((u): u is string => typeof u === "string" && USERNAME.test(u))) return null;

  return {
    generatedAt: generated_at,
    date,
    ssh: { reports: ssh.reports as number, sources: ssh.sources as number, targets: ssh.targets as number, rank: rank as number | null },
    history,
    topPorts: ports,
    topUsernames: top_usernames,
  };
}

/** Fetched on the server, cached for an hour. Null if unreachable or invalid. */
export async function getLiveFeed(): Promise<LiveFeed | null> {
  try {
    const res = await fetch(LIVE_FEED_URL, { next: { revalidate: 3600 } });
    if (!res.ok || Number(res.headers.get("content-length") ?? 0) > 64_000) return null;
    return parseLiveFeed(await res.json());
  } catch {
    return null;
  }
}
