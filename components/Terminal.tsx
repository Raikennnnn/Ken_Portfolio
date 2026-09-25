"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { profile, projects, skills, links, certifications, writeups, projectsUsing } from "@/content/data";
import { emitAvatar, onToggleTerminal, type AvatarAction } from "@/lib/avatarBus";
import { SCAN_LINES, SCAN_STEP_MS } from "@/lib/scanLines";

type Line = { id: number; node: ReactNode };

const SECTIONS = ["top", "work", "skills", "activity", "about", "contact"];

const HELP: [string, string][] = [
  ["whoami", "who is this"],
  ["projects", "list projects"],
  ["open <n>", "security notes + links for project n"],
  ["skills", "skills and where they were used"],
  ["contact", "ways to reach me"],
  ["github | linkedin | email", "open a link"],
  ["goto <section>", SECTIONS.join(" · ")],
  ["cat security.txt", "responsible disclosure"],
  ["wave | scan | spin | nod", "ask the avatar nicely"],
  ["clear | exit", "tidy up / close (Esc)"],
];

const COMMANDS = [
  "help", "whoami", "ls", "cat", "projects", "open", "skills", "contact", "github", "linkedin",
  "email", "goto", "wave", "scan", "spin", "nod", "clear", "exit", "history", "date", "echo", "sudo",
];

const FILES = ["about.txt", "security.txt", "projects/", "skills.json"];

function Muted({ children }: { children: ReactNode }) {
  return <span className="text-[var(--fg-muted)]">{children}</span>;
}
function Accent({ children }: { children: ReactNode }) {
  return <span className="text-[var(--accent)]">{children}</span>;
}

const linkHref = (label: string) => links.find((l) => l.label.toLowerCase() === label)?.href;

export function Terminal() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>(() => [
    {
      id: -3,
      node: (
        <span>
          <Accent>ken@portfolio</Accent> <Muted>— secure shell v1.0 · guest session</Muted>
        </span>
      ),
    },
    {
      id: -2,
      node: (
        <Muted>
          type <Accent>help</Accent> for commands · <Accent>tab</Accent> completes · <Accent>↑↓</Accent> history
        </Muted>
      ),
    },
    { id: -1, node: " " },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  // Phones: fit the window into the visible area above the on-screen keyboard.
  const [fit, setFit] = useState<{ top: number; height: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const nextId = useRef(0);

  const print = (...nodes: ReactNode[]) =>
    setLines((ls) => [...ls, ...nodes.map((node) => ({ id: nextId.current++, node }))]);

  // Open / close from anywhere
  useEffect(() => {
    const offToggle = onToggleTerminal((next) => setOpen((o) => (next === undefined ? !o : next)));
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typingElsewhere =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (!typingElsewhere && (e.key === "/" || e.key === "`")) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      offToggle();
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    emitAvatar({ type: "terminal", open });
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => inputRef.current?.focus());
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      lastFocus.current?.focus?.();
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines, fit]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!open || !vv) return setFit(null);
    const update = () => {
      if (window.innerWidth >= 640) return setFit(null);
      const gap = 10;
      setFit({ top: vv.offsetTop + gap, height: Math.max(180, vv.height - gap * 2) });
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [open]);

  const goto = (id: string) => {
    setOpen(false);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  const openUrl = (href: string | undefined) => {
    if (!href) return;
    if (href.startsWith("mailto:")) window.location.href = href;
    else window.open(href, "_blank", "noopener,noreferrer");
  };

  const run = (raw: string) => {
    const cmdline = raw.trim();
    print(
      <span>
        <Accent>guest@ken</Accent>
        <Muted>:~$</Muted> {cmdline}
      </span>
    );
    if (!cmdline) return;
    setHistory((h) => [...h, cmdline]);

    const [cmd, ...args] = cmdline.split(/\s+/);
    const arg = args.join(" ");

    switch (cmd.toLowerCase()) {
      case "help":
        print(
          ...HELP.map(([c, d]) => (
            <span>
              <span className="block sm:inline-block sm:w-[210px] text-[var(--fg)]">{c}</span>
              <span className="block pl-3 sm:inline sm:pl-0">
                <Muted>{d}</Muted>
              </span>
            </span>
          ))
        );
        break;

      case "whoami":
        print(
          <span>
            <span className="text-[var(--fg)]">{profile.name}</span> — {profile.title} student.
          </span>,
          <Muted>{profile.intro}</Muted>
        );
        break;

      case "ls":
        print(<span>{FILES.map((f) => (f.endsWith("/") ? <Accent key={f}>{f}  </Accent> : `${f}  `))}</span>);
        break;

      case "cat":
        if (arg === "about.txt") print(...profile.bio.map((b) => <Muted>{b}</Muted>));
        else if (arg === "security.txt")
          print(
            <span>
              Found a problem with this site? Email{" "}
              <Accent>{linkHref("email")?.replace("mailto:", "")}</Accent>.
            </span>,
            <Muted>Machine-readable copy: /.well-known/security.txt</Muted>
          );
        else if (arg === "skills.json") run("skills");
        else print(<Muted>cat: {arg || "missing operand"}: no such file</Muted>);
        break;

      case "projects":
        print(
          ...projects.map((p, i) => (
            <span>
              <Accent>[{i + 1}]</Accent> <span className="text-[var(--fg)]">{p.title}</span>{" "}
              <Muted>
                · {p.role} · {p.year}
              </Muted>
            </span>
          )),
          <Muted>
            → <Accent>open 1</Accent> for details
          </Muted>
        );
        break;

      case "open": {
        const n = Number(arg);
        const p =
          projects[n - 1] ?? projects.find((x) => x.title.toLowerCase().includes(arg.toLowerCase()) && arg);
        if (!p) {
          print(<Muted>open: no project “{arg}”. try `projects`.</Muted>);
          break;
        }
        print(
          <span className="text-[var(--fg)]">{p.title}</span>,
          <Muted>{p.summary}</Muted>,
          <span className="text-[var(--green)]">security notes:</span>,
          ...p.security.map((s) => (
            <span>
              <span className="text-[var(--green)]">  ✓</span> {s}
            </span>
          )),
          p.repo ? (
            <a href={p.repo} target="_blank" rel="noreferrer" className="underline decoration-[var(--border-active)] hover:text-[var(--accent)]">
              {p.repo.replace("https://", "")}
            </a>
          ) : (
            " "
          )
        );
        break;
      }

      case "skills": {
        const cats = [
          ["language", "languages"],
          ["framework", "frameworks"],
          ["security", "security + tools"],
        ] as const;
        for (const [key, label] of cats) {
          print(<Accent>{label}</Accent>);
          print(
            ...skills
              .filter((s) => s.category === key)
              .map((s) => {
                const used = projectsUsing(s.name).map((p) => p.title);
                return (
                  <span>
                    <span className="block sm:inline-block sm:w-[210px] text-[var(--fg)]">  {s.name}</span>
                    <span className="block pl-3 sm:inline sm:pl-0">
                      <Muted>{used.length ? used.join(", ") : s.context}</Muted>
                    </span>
                  </span>
                );
              })
          );
        }
        if (certifications.length) print(<Muted>{certifications.length} certification(s) — goto about</Muted>);
        if (writeups.length) print(<Muted>{writeups.length} write-up(s) — goto work</Muted>);
        break;
      }

      case "contact":
        print(
          ...links.map((l) => (
            <span>
              <span className="inline-block w-[100px] text-[var(--fg)]">{l.label.toLowerCase()}</span>
              <Muted>{l.href.replace(/^mailto:|^https?:\/\//g, "")}</Muted>
            </span>
          ))
        );
        break;

      case "github":
      case "linkedin":
      case "email":
        print(<Muted>opening {cmd}…</Muted>);
        openUrl(linkHref(cmd.toLowerCase()));
        break;

      case "goto":
      case "cd": {
        const id = arg.replace(/^\.?\/?/, "") || "top";
        if (SECTIONS.includes(id)) goto(id);
        else print(<Muted>goto: unknown section. try: {SECTIONS.join(", ")}</Muted>);
        break;
      }

      case "wave":
      case "scan":
      case "spin":
      case "nod":
        emitAvatar({ type: "action", action: cmd.toLowerCase() as AvatarAction });
        print(<Muted>avatar ← {cmd.toLowerCase()} <span className="text-[var(--green)]">ok</span></Muted>);
        // The scan readout prints here — the avatar's HUD stays hidden while the terminal is open.
        if (cmd.toLowerCase() === "scan") {
          SCAN_LINES.forEach((line, i) =>
            window.setTimeout(
              () => print(line.includes("GRANTED") ? <span className="text-[var(--green)]">{line}</span> : <Muted>{line}</Muted>),
              250 + i * SCAN_STEP_MS
            )
          );
        }
        break;

      case "history":
        print(...history.map((h, i) => <Muted>{`${String(i + 1).padStart(3)}  ${h}`}</Muted>));
        break;

      case "date":
        print(new Date().toString());
        break;

      case "echo":
        print(arg || " ");
        break;

      case "sudo":
        print(<span className="text-[var(--red)]">guest is not in the sudoers file. This incident will be reported.</span>);
        emitAvatar({ type: "action", action: "nod" });
        emitAvatar({ type: "say", text: "Nice try. Least privilege, remember?", ms: 3200 });
        break;

      case "rm":
        print(<span className="text-[var(--red)]">rm: permission denied. The server owns the state, not you.</span>);
        break;

      case "clear":
        setLines([]);
        break;

      case "exit":
      case "quit":
        setOpen(false);
        break;

      default:
        print(
          <Muted>
            {cmd}: command not found. type <Accent>help</Accent>.
          </Muted>
        );
    }
  };

  const complete = () => {
    const [cmd, ...rest] = input.split(" ");
    if (rest.length === 0) {
      const matches = COMMANDS.filter((c) => c.startsWith(cmd.toLowerCase()));
      if (matches.length === 1) setInput(matches[0] + " ");
      else if (matches.length > 1) print(<Muted>{matches.join("  ")}</Muted>);
      return;
    }
    const partial = rest.join(" ");
    const pool =
      cmd === "goto" ? SECTIONS : cmd === "cat" ? FILES : cmd === "open" ? projects.map((_, i) => String(i + 1)) : [];
    const matches = pool.filter((p) => p.startsWith(partial));
    if (matches.length === 1) setInput(`${cmd} ${matches[0]}`);
    else if (matches.length > 1) print(<Muted>{matches.join("  ")}</Muted>);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(input);
      setInput("");
      setCursor(null);
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const i = cursor === null ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(i);
      setInput(history[i]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cursor === null) return;
      const i = cursor + 1;
      if (i >= history.length) {
        setCursor(null);
        setInput("");
      } else {
        setCursor(i);
        setInput(history[i]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key.toLowerCase() === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-[#03030a]/70 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Terminal"
        className="terminal-window fixed z-[62] left-1/2 top-[12vh] w-[min(720px,calc(100vw-24px))] -translate-x-1/2 flex flex-col"
        style={fit ? { top: fit.top, height: fit.height } : undefined}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex items-center gap-2 px-4 h-9 border-b border-[var(--border)]">
          <span className="w-2.5 h-2.5 rounded-full opacity-70 bg-[var(--red)]" />
          <span className="w-2.5 h-2.5 rounded-full opacity-70 bg-[var(--amber)]" />
          <span className="w-2.5 h-2.5 rounded-full opacity-70 bg-[var(--green)]" />
          <span className="ml-3 font-mono text-[10px] tracking-wider text-[var(--fg-muted)]">guest@ken — ssh</span>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto font-mono text-[10px] text-[var(--fg-muted)] hover:text-[var(--accent)]"
            aria-label="Close terminal"
          >
            esc
          </button>
        </div>

        <div className={`flex flex-col sm:flex-row ${fit ? "flex-1 min-h-0" : "h-[min(60vh,460px)]"}`}>
        {/* Live viewport: the 3D companion flies in here while the terminal is open (Companion.tsx). */}
        <div
          className={`terminal-cam relative shrink-0 order-first sm:order-last border-b sm:border-b-0 sm:border-l border-[var(--border)] sm:w-[190px] sm:!h-auto ${fit ? "" : "h-[150px]"}`}
          style={{ height: fit ? Math.round(Math.min(160, Math.max(120, fit.height * 0.3))) : undefined }}
        >
          <div id="terminal-avatar-slot" className="absolute inset-0" aria-hidden />
          <span className="absolute top-2 left-3 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--fg-muted)]">
            <span className="sec-dot" /> ken.exe · live
          </span>
        </div>
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 font-mono text-[12px] leading-[1.7] text-[var(--fg-soft)]"
        >
          {lines.map((l) => (
            <div key={l.id} className="whitespace-pre-wrap break-words">
              {l.node}
            </div>
          ))}
          <label className="flex items-center gap-2">
            <span className="shrink-0">
              <Accent>guest@ken</Accent>
              <Muted>:~$</Muted>
            </span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                emitAvatar({ type: "typing" });
              }}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              aria-label="Command"
              enterKeyHint="send"
              // 16px on phones stops iOS Safari from zooming in on focus.
              className="flex-1 min-w-0 bg-transparent outline-none text-[16px] sm:text-[12px] text-[var(--fg)] caret-[var(--accent)]"
            />
          </label>
        </div>
        </div>
      </div>
    </>
  );
}
