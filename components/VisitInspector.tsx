"use client";

import { useEffect, useState } from "react";
import { FLAGS, adminFlag, getSolved, onSolvedChange, readSession } from "@/lib/ctf";

type Row = { label: string; value: string; accent?: boolean };

const SECURITY_HEADERS: [string, string][] = [
  ["content-security-policy", "CSP"],
  ["strict-transport-security", "HSTS"],
  ["x-frame-options", "XFO"],
  ["x-content-type-options", "nosniff"],
];

function browserOf(ua: string) {
  const names: Record<string, string> = { Edg: "Edge", OPR: "Opera", SamsungBrowser: "Samsung Internet" };
  const m = ua.match(/(Edg|OPR|Firefox|SamsungBrowser)\/(\d+)/) ?? ua.match(/(Chrome)\/(\d+)/);
  if (m) return `${names[m[1]] ?? m[1]} ${m[2]}`;
  const safari = ua.match(/Version\/(\d+).*Safari/);
  return safari ? `Safari ${safari[1]}` : "Unknown browser";
}

function osOf(ua: string) {
  if (/Windows/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "unknown OS";
}

function referrerOf() {
  if (!document.referrer) return "typed it in, or a bookmark";
  try {
    const host = new URL(document.referrer).host;
    return host === location.host ? "this site" : host;
  } catch {
    return "unknown";
  }
}

const clock = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Hero panel: 検 (ken) means "to inspect", so the page inspects your visit. Nothing leaves the browser. */
export function VisitInspector() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [shown, setShown] = useState(0);
  const [time, setTime] = useState("");
  const [solved, setSolved] = useState(0);
  const [headers, setHeaders] = useState("checking…");

  useEffect(() => {
    const ua = navigator.userAgent;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const session = readSession();
    const admin = session.role.toLowerCase() === "admin";

    setRows([
      { label: "Browser", value: `${browserOf(ua)} · ${osOf(ua)}` },
      { label: "Language", value: navigator.language },
      { label: "Timezone", value: tz },
      { label: "Screen", value: `${screen.width || innerWidth}×${screen.height || innerHeight} · ${Math.round(devicePixelRatio * 100) / 100}x${navigator.maxTouchPoints > 0 ? " · touch" : ""}` },
      { label: "Came from", value: referrerOf() },
      { label: "Connection", value: location.protocol === "https:" ? "HTTPS" : "HTTP (local dev)" },
      { label: "Session", value: admin ? `${session.user} · role: admin` : `${session.user} · role: ${session.role}`, accent: admin },
      ...(admin ? [{ label: "Admin note", value: adminFlag(), accent: true }] : []),
    ]);

    setTime(clock());
    const tick = window.setInterval(() => setTime(clock()), 30_000);

    setSolved(getSolved().length);
    const off = onSolvedChange((ids) => setSolved(ids.length));

    // This page's own response headers, the same ones listed under the portfolio project.
    fetch(location.pathname, { method: "HEAD", cache: "no-store" })
      .then((res) => {
        const present = SECURITY_HEADERS.filter(([h]) => res.headers.has(h)).map(([, name]) => name);
        setHeaders(`${present.join(" · ") || "none"} (${present.length}/${SECURITY_HEADERS.length})`);
      })
      .catch(() => setHeaders("couldn't check"));

    return () => {
      window.clearInterval(tick);
      off();
    };
  }, []);

  // Rows print one by one, like a scan.
  useEffect(() => {
    if (!rows) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setShown(rows.length + 3);
    if (shown >= rows.length + 3) return;
    const t = window.setTimeout(() => setShown((n) => n + 1), shown === 0 ? 350 : 110);
    return () => window.clearTimeout(t);
  }, [rows, shown]);

  const all: Row[] = rows
    ? [
        ...rows.slice(0, 3),
        { label: "Local time", value: time },
        ...rows.slice(3),
        { label: "Site headers", value: headers },
        { label: "Flags found", value: `${solved} / ${FLAGS.length}`, accent: solved > 0 },
      ]
    : [];
  const scanning = !rows || shown < all.length;

  return (
    <div className="panel corners relative flex flex-col">
      <div className="flex items-center gap-3 px-5 h-11 border-b border-[var(--line)]">
        <span className="kanji text-[14px] text-[var(--red)] tracking-normal" lang="ja" title="検 (ken): to inspect">
          検
        </span>
        <span className="label text-[var(--fg-muted)]">Inspecting your visit</span>
        <span
          className={`ml-auto w-1.5 h-1.5 bg-[var(--red)] ${scanning ? "animate-pulse" : "opacity-40"}`}
          aria-hidden
        />
      </div>

      <dl className="px-5 py-3 font-mono text-[12px] min-h-[340px]" aria-live="off">
        {all.slice(0, shown).map((r) => (
          <div key={r.label} className="grid grid-cols-[104px_1fr] gap-3 py-[7px] border-b border-[var(--line)] last:border-0">
            <dt className="text-[var(--fg-dim)]">{r.label}</dt>
            <dd className={`break-words ${r.accent ? "text-[var(--red)]" : "text-[var(--fg)]"}`}>
              {r.label === "Flags found" ? (
                <a href="#ctf" className="hover:underline underline-offset-4">
                  {r.value} <span className="text-[var(--fg-dim)]">· break this site ↓</span>
                </a>
              ) : (
                r.value
              )}
            </dd>
          </div>
        ))}
        {scanning && <div className="py-[7px] text-[var(--red)] animate-pulse">▍</div>}
      </dl>

      <p className="mt-auto px-5 py-3 border-t border-[var(--line)] text-[0.8rem] leading-[1.6] text-[var(--fg-dim)]">
        Nothing here is stored or sent anywhere. Any site you open can read the same things.
      </p>
    </div>
  );
}
