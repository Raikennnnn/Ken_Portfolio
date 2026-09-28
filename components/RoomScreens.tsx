"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { assessments, certifications, links, profile, projects, type Certification } from "@/content/data";
import { FLAGS, getSolved, onSolvedChange, submitFlag } from "@/lib/ctf";
import { pad2 } from "@/lib/format";
import { makeSprites, readPalette } from "@/lib/room";
import { useKeyboardFit } from "@/lib/useKeyboardFit";
import { Console } from "./Console";

// Everything you use inside the server room opens here, in the room, as a device screen.
// Nothing sends you back to the page; only external links open (in a new tab).

/** CRT-style device screen that powers on over the room. */
function Screen({ id, title, onClose, children }: { id: string; title: string; onClose: () => void; children: ReactNode }) {
  // phones: shrink to the space above the on-screen keyboard so inputs stay visible
  const fit = useKeyboardFit(true);
  return (
    <div className="room-screen" role="dialog" aria-label={title} style={fit ? { top: fit.top, height: fit.height, bottom: "auto" } : undefined}>
      <div className="flex items-center gap-3 px-4 h-9 border-b border-[var(--red-line)] shrink-0">
        <span className="w-1.5 h-1.5 bg-[var(--red)] animate-pulse" aria-hidden />
        <span className="label text-[var(--red)]">{id}</span>
        <span className="label text-[var(--fg-muted)] truncate">{title}</span>
        <button type="button" onClick={onClose} className="ml-auto label hover:text-[var(--red)] transition-colors shrink-0">
          esc ✕
        </button>
      </div>
      <div className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain">{children}</div>
      <div className="room-scanlines" aria-hidden />
    </div>
  );
}

const Heading = ({ children }: { children: ReactNode }) => <div className="label text-[var(--red)] mt-5 mb-2">{children}</div>;

// ── Racks: one project each ──

export function RackScreen({ index, onClose }: { index: number; onClose: () => void }) {
  const p = projects[index];
  const test = assessments.find((a) => a.target === p.title);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 280);
    return () => window.clearInterval(t);
  }, []);

  return (
    <Screen id={`RACK ${pad2(index + 1)}`} title={p.title} onClose={onClose}>
      <div className="px-4 md:px-5 py-4">
        <div className="flex items-center gap-1.5 mb-3" aria-hidden>
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className={`w-1.5 h-1.5 ${((i * 7 + tick * 3) % 11) > 5 ? "bg-[var(--red)]" : "bg-[var(--line-strong)]"}`} />
          ))}
          <span className="label ml-2">online</span>
        </div>
        <h3 className="font-serif text-[1.35rem] font-medium">{p.title}</h3>
        <div className="label mt-1">{p.role} · {p.year}</div>
        <p className="mt-3 text-[0.9rem] leading-[1.65] text-[var(--fg-muted)]">{p.summary}</p>

        <Heading>Stack</Heading>
        <div className="flex flex-wrap gap-1.5">
          {p.stack.map((t) => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>

        <Heading>Security notes</Heading>
        <ul className="flex flex-col gap-2">
          {p.security.map((s) => (
            <li key={s} className="flex gap-3 text-[0.88rem] leading-[1.55] text-[var(--fg-muted)]">
              <span className="mt-[0.6em] w-1 h-1 shrink-0 bg-[var(--red)]" aria-hidden />
              {s}
            </li>
          ))}
        </ul>

        {test && (
          <>
            <Heading>Security test · {test.checks.length} checks</Heading>
            <p className="text-[0.85rem] leading-[1.6] text-[var(--fg-muted)]">
              {test.tools.join(", ")}. Checked for {test.checks.map((c) => c.toLowerCase()).join(", ")}.
            </p>
          </>
        )}

        {p.repo && (
          <a href={p.repo} target="_blank" rel="noreferrer" className="btn mt-5">
            Repository ↗
          </a>
        )}
      </div>
    </Screen>
  );
}

// ── Desk: the real terminal, on the room's monitor ──

export function DeskScreen({ user, onClose }: { user: string; onClose: () => void }) {
  return (
    <Screen id="KEN-SRV01" title="console" onClose={onClose}>
      <Console where="room" user={user} onExit={onClose} className="absolute inset-0" />
    </Screen>
  );
}

// ── Plaques: the credential wall ──

function CredList({ items }: { items: Certification[] }) {
  return (
    <ul>
      {items.map((c) => (
        <li key={c.verifyUrl} className="border-b border-[var(--line)]">
          <a href={c.verifyUrl} target="_blank" rel="noreferrer" className="group grid grid-cols-[1fr_auto] gap-x-4 py-2.5">
            <span className="text-[0.9rem] group-hover:text-[var(--red)] transition-colors">{c.name}</span>
            <span className="font-mono text-[11px] text-[var(--fg-dim)] whitespace-nowrap">{c.date} · verify ↗</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function PlaqueScreen({ onClose }: { onClose: () => void }) {
  return (
    <Screen id="WALL" title="credentials" onClose={onClose}>
      <div className="px-4 md:px-5 py-4">
        <div className="label text-[var(--red)] mb-2">Certifications · by exam</div>
        <CredList items={certifications.filter((c) => c.group === "exam")} />
        <Heading>Course badges · Cisco Networking Academy</Heading>
        <CredList items={certifications.filter((c) => c.group !== "exam")} />
        <p className="mt-4 text-[0.8rem] text-[var(--fg-dim)]">
          All verified on Credly. The CCNA items are courses, not the CCNA certification exam.
        </p>
      </div>
    </Screen>
  );
}

// ── Vault: the CTF, solved from inside the room ──

export function VaultScreen({ onClose }: { onClose: () => void }) {
  const [solved, setSolved] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const email = links.find((l) => l.href.startsWith("mailto:"))?.href;
  const open = solved.length === FLAGS.length;

  useEffect(() => {
    setSolved(getSolved());
    return onSolvedChange(setSolved);
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const r = await submitFlag(input);
    if (r.status === "new") {
      setMsg(`${r.flag.title}: accepted. ${r.solved} of ${FLAGS.length}.`);
      setInput("");
    } else if (r.status === "repeat") setMsg(`${r.flag.title}: already in.`);
    else if (r.status === "unsupported") setMsg("This browser can't check flags here (needs HTTPS).");
    else setMsg("Rejected. Flags look like flag{...}.");
  };

  return (
    <Screen id="VAULT" title={open ? "unlocked" : "locked"} onClose={onClose}>
      <div className="px-4 md:px-5 py-4">
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-serif text-[1.35rem] font-medium">{open ? "Access granted." : "Locked."}</span>
          <span className="font-mono text-[12px] text-[var(--fg-muted)]">
            {pad2(solved.length)} / {pad2(FLAGS.length)}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1.5" aria-hidden>
          {FLAGS.map((f) => (
            <span key={f.id} className={`h-1.5 ${solved.includes(f.id) ? "bg-[var(--red)]" : "bg-[var(--line-strong)]"}`} />
          ))}
        </div>

        {open ? (
          <>
            <p className="mt-4 text-[0.9rem] leading-[1.65] text-[var(--fg-muted)]">
              All five flags. You did recon, read the headers, decoded the notes and got past a client-side check. Tell me
              how long it took.
            </p>
            {email && (
              <a href={`${email}?subject=Found%20all%20five%20flags`} className="btn btn-primary mt-4">
                Email me
              </a>
            )}
          </>
        ) : (
          <>
            <ol className="mt-4 border-t border-[var(--line)]">
              {FLAGS.map((f, i) => (
                <li key={f.id} className="grid grid-cols-[22px_1fr_auto] gap-x-3 py-2 border-b border-[var(--line)] text-[0.85rem]">
                  <span className="font-mono text-[11px] text-[var(--fg-dim)] pt-0.5">{pad2(i + 1)}</span>
                  <span>
                    <span className={solved.includes(f.id) ? "line-through decoration-[var(--red)]" : ""}>{f.title}</span>{" "}
                    <span className="text-[var(--fg-dim)]">· {f.hint}</span>
                  </span>
                  <span className={`label pt-0.5 ${solved.includes(f.id) ? "text-[var(--red)]" : ""}`}>
                    {solved.includes(f.id) ? "in" : "—"}
                  </span>
                </li>
              ))}
            </ol>
            <form onSubmit={onSubmit} className="mt-4 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="flag{...}"
                aria-label="Flag"
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                autoFocus
                className="flex-1 min-w-0 h-9 px-3 bg-[var(--bg-panel)] border border-[var(--line-strong)] font-mono text-[16px] sm:text-[12px] outline-none focus:border-[var(--red-line)]"
              />
              <button type="submit" className="btn btn-primary">
                Insert
              </button>
            </form>
            <p className="mt-2 min-h-[1.4em] text-[0.82rem] text-[var(--fg-muted)]" aria-live="polite">
              {msg}
            </p>
          </>
        )}
      </div>
    </Screen>
  );
}

// ── Ken: an RPG-style conversation ──

function KenPortrait() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const s = makeSprites(readPalette()).ken;
    let blinkAt = performance.now() + 1800;
    const draw = () => {
      const now = performance.now();
      if (now > blinkAt + 140) blinkAt = now + 2200 + Math.random() * 2500;
      const img = now > blinkAt ? s.blink : Math.floor(now / 900) % 2 ? s.breathe : s.idle;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width * 5, img.height * 5);
    };
    draw();
    const t = window.setInterval(draw, 100);
    return () => window.clearInterval(t);
  }, []);
  return <canvas ref={ref} width={70} height={100} className="[image-rendering:pixelated] w-[70px] h-[100px]" aria-hidden />;
}

type Topic = { q: string; a: string };

export function KenDialogue({ visitor, onClose }: { visitor: string; onClose: () => void }) {
  const solved = typeof window === "undefined" ? 0 : getSolved().length;
  const topics: Topic[] = [
    { q: "Who are you?", a: `I'm ${profile.fullName}, ${profile.intro}` },
    {
      q: "What is this place?",
      a: "My server room. Each rack holds one of my projects, the desk runs my terminal, the wall has my credentials, and the vault... you'll have to earn that one.",
    },
    {
      q: "How do I open the vault?",
      a: `Five flags are hidden around my site: in places a tester looks first. Find them and insert them at the vault. You've got ${solved} of 5 so far.`,
    },
    {
      q: "What are you working on?",
      a: "Our capstone, IntelliDocs. I built the first version, then switched to testing it the way an attacker would. Rack 01 has the details.",
    },
  ];
  const [text, setText] = useState(`Hey, ${visitor}. Welcome to my server room. Look around, or ask me something.`);
  const [shown, setShown] = useState(0);
  const done = shown >= text.length;

  // type the line out
  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => setShown((n) => n + 1), 18);
    return () => window.clearTimeout(t);
  }, [shown, done]);

  // E / Enter / Space finishes the line
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!["e", "enter", " "].includes(e.key.toLowerCase()) || done) return;
      e.preventDefault();
      setShown(text.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, text]);

  const say = (a: string) => {
    setText(a);
    setShown(0);
  };

  return (
    <div className="room-dialogue" role="dialog" aria-label="Talking to Ken">
      <div className="flex gap-4">
        <div className="shrink-0 border border-[var(--red-line)] bg-[var(--bg-sunken)] p-1.5 self-start">
          <KenPortrait />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <span className="label text-[var(--red)]">Ken</span>
            <button type="button" onClick={onClose} className="label hover:text-[var(--red)] transition-colors">
              esc ✕
            </button>
          </div>
          <p className="mt-1.5 min-h-[3.3em] text-[0.92rem] leading-[1.6]" aria-live="polite" onClick={() => setShown(text.length)}>
            {text.slice(0, shown)}
            {!done && <span className="inline-block w-2 h-[1em] -mb-[0.15em] ml-0.5 bg-[var(--red)] animate-pulse" aria-hidden />}
          </p>
          <div className={`mt-3 flex flex-wrap gap-2 transition-opacity ${done ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            {topics.map((t) => (
              <button key={t.q} type="button" className="btn" onClick={() => say(t.a)}>
                <span className="text-[var(--red)]">›</span> {t.q}
              </button>
            ))}
            <button type="button" className="btn" onClick={onClose}>
              <span className="text-[var(--red)]">›</span> See you
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
