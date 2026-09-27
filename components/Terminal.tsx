"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  profile, projects, skills, links, certifications, writeups, assessments, securityChecks, securityTools, projectsUsing,
} from "@/content/data";
import { onToggleTerminal } from "@/lib/terminalBus";
import { getTheme, setTheme } from "@/lib/theme";

type Line = { id: number; node: ReactNode };

const SECTIONS = ["top", "work", "security", "skills", "activity", "about", "contact"];
const CLOSE_MS = 220; // closing is shorter than opening, as in the NG4 menus

const HELP: [string, string][] = [
  ["whoami", "who is this"],
  ["projects", "list projects"],
  ["open <n>", "details and security notes for project n"],
  ["security [n]", "systems I've security-tested / details for n"],
  ["skills", "skills and where they are used"],
  ["contact", "ways to reach me"],
  ["github | linkedin | email", "open a link"],
  ["goto <section>", SECTIONS.join(" · ")],
  ["theme [dark|light]", "switch colour mode"],
  ["cat security.txt", "responsible disclosure"],
  ["clear | exit", "clear the screen / close (Esc)"],
];

const COMMANDS = [
  "help", "whoami", "ls", "cat", "projects", "open", "security", "skills", "contact", "github",
  "linkedin", "email", "goto", "theme", "clear", "exit", "history", "date", "echo", "sudo",
];

const FILES = ["about.txt", "security.txt", "projects/", "skills.json"];

function Dim({ children }: { children: ReactNode }) {
  return <span className="text-[var(--fg-dim)]">{children}</span>;
}
function Muted({ children }: { children: ReactNode }) {
  return <span className="text-[var(--fg-muted)]">{children}</span>;
}
function Red({ children }: { children: ReactNode }) {
  return <span className="text-[var(--red)]">{children}</span>;
}
/** Two-column row that stacks on phones. */
function Row({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <span className="block sm:flex">
      <span className="block sm:w-[270px] shrink-0">{left}</span>
      <span className="block pl-3 sm:pl-0">
        <Muted>{right}</Muted>
      </span>
    </span>
  );
}

const linkHref = (label: string) => links.find((l) => l.label.toLowerCase() === label)?.href;

export function Terminal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [lines, setLines] = useState<Line[]>(() => [
    { id: -3, node: <span><Red>ken@portfolio</Red> <Dim>· guest session</Dim></span> },
    {
      id: -2,
      node: <Dim>type <Red>help</Red> for commands · tab completes · ↑↓ history</Dim>,
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

  // Open / close from anywhere: header button, Ctrl/⌘+K, "/" or "`".
  useEffect(() => {
    const offToggle = onToggleTerminal((next) => setOpen((o) => (next === undefined ? !o : next)));
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typingElsewhere = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
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

  // Mount on open; on close, play the exit animation first, then unmount.
  useEffect(() => {
    if (open) {
      setClosing(false);
      setMounted(true);
      lastFocus.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
      document.body.style.overflow = "hidden";
      return;
    }
    if (!mounted) return;
    setClosing(true);
    document.body.style.overflow = "";
    const t = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
      lastFocus.current?.focus?.({ preventScroll: true });
    }, CLOSE_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), CLOSE_MS);
  };

  const openUrl = (href: string | undefined) => {
    if (!href) return;
    if (href.startsWith("mailto:")) window.location.href = href;
    else window.open(href, "_blank", "noopener,noreferrer");
  };

  const run = (raw: string) => {
    const cmdline = raw.trim();
    print(<span><Red>guest@ken</Red><Dim>:~$</Dim> {cmdline}</span>);
    if (!cmdline) return;
    setHistory((h) => [...h, cmdline]);

    const [cmd, ...args] = cmdline.split(/\s+/);
    const arg = args.join(" ");

    switch (cmd.toLowerCase()) {
      case "help":
        print(...HELP.map(([c, d]) => <Row left={c} right={d} />));
        break;

      case "whoami":
        print(<span>{profile.name} — {profile.title} student.</span>, <Muted>{profile.intro}</Muted>);
        break;

      case "ls":
        print(<span>{FILES.join("   ")}</span>);
        break;

      case "cat":
        if (arg === "about.txt") print(...profile.bio.map((b) => <Muted>{b}</Muted>));
        else if (arg === "security.txt")
          print(
            <span>Found a problem with this site? Email {linkHref("email")?.replace("mailto:", "")}.</span>,
            <Dim>Machine-readable copy: /.well-known/security.txt</Dim>
          );
        else if (arg === "skills.json") run("skills");
        else print(<Dim>cat: {arg || "missing operand"}: no such file</Dim>);
        break;

      case "projects":
        print(
          ...projects.map((p, i) => (
            <span>
              <Red>[{i + 1}]</Red> {p.title} <Dim>· {p.role} · {p.year}</Dim>
            </span>
          )),
          <Dim>type open 1 for details</Dim>
        );
        break;

      case "open": {
        const n = Number(arg);
        const p = projects[n - 1] ?? (arg ? projects.find((x) => x.title.toLowerCase().includes(arg.toLowerCase())) : undefined);
        if (!p) {
          print(<Dim>open: no project “{arg}”. try projects</Dim>);
          break;
        }
        print(
          <span>{p.title}</span>,
          <Muted>{p.summary}</Muted>,
          <Red>security notes</Red>,
          ...p.security.map((s) => <span>  <Red>·</Red> <Muted>{s}</Muted></span>),
          p.repo ? (
            <a href={p.repo} target="_blank" rel="noreferrer" className="link">
              {p.repo.replace("https://", "")}
            </a>
          ) : " "
        );
        break;
      }

      case "security": {
        if (!arg) {
          print(
            ...assessments.map((a, i) => (
              <span>
                <Red>[{i + 1}]</Red> {a.target} <Dim>· {a.type} · {a.year} · {a.checks.length} checks</Dim>
              </span>
            )),
            <Dim>type security 1 for details</Dim>
          );
          break;
        }
        const n = Number(arg);
        const a = assessments[n - 1] ?? assessments.find((x) => x.target.toLowerCase().includes(arg.toLowerCase()));
        if (!a) {
          print(<Dim>security: no assessment “{arg}”. try security</Dim>);
          break;
        }
        print(
          <span>{a.target} <Dim>· {a.type} · {a.year}</Dim></span>,
          <Dim>{a.scope}</Dim>,
          <Red>tools</Red>,
          ...a.tools.map((t) => <Row left={`  ${t}`} right={securityTools[t]} />),
          <Red>checks</Red>,
          ...a.checks.map((c) => <Row left={`  ${c}`} right={securityChecks[c]} />)
        );
        break;
      }

      case "skills": {
        const groups = [
          ["language", "languages"],
          ["framework", "frameworks & platforms"],
          ["practice", "security practice"],
          ["tool", "testing tools"],
        ] as const;
        for (const [key, label] of groups) {
          print(<Red>{label}</Red>);
          print(
            ...skills
              .filter((s) => s.category === key)
              .map((s) => <Row left={`  ${s.name}`} right={projectsUsing(s.name).map((p) => p.title).join(", ")} />)
          );
        }
        if (certifications.length) print(<Dim>{certifications.length} certification(s) — goto about</Dim>);
        if (writeups.length) print(<Dim>{writeups.length} write-up(s) — goto work</Dim>);
        break;
      }

      case "contact":
        print(...links.map((l) => <Row left={l.label.toLowerCase()} right={l.href.replace(/^mailto:|^https?:\/\//g, "")} />));
        break;

      case "github":
      case "linkedin":
      case "email":
        print(<Dim>opening {cmd}…</Dim>);
        openUrl(linkHref(cmd.toLowerCase()));
        break;

      case "goto":
      case "cd": {
        const id = arg.replace(/^\.?\/?/, "") || "top";
        if (SECTIONS.includes(id)) goto(id);
        else print(<Dim>goto: unknown section. try {SECTIONS.join(", ")}</Dim>);
        break;
      }

      case "theme": {
        const want = arg === "dark" || arg === "light" ? arg : getTheme() === "dark" ? "light" : "dark";
        setTheme(want);
        print(<Dim>theme → {want}</Dim>);
        break;
      }

      case "history":
        print(...history.map((h, i) => <Dim>{`${String(i + 1).padStart(3)}  ${h}`}</Dim>));
        break;

      case "date":
        print(new Date().toString());
        break;

      case "echo":
        print(arg || " ");
        break;

      case "sudo":
        print(<Red>guest is not in the sudoers file. This incident will be reported.</Red>);
        break;

      case "clear":
        setLines([]);
        break;

      case "exit":
      case "quit":
        setOpen(false);
        break;

      default:
        print(<Dim>{cmd}: command not found. type help</Dim>);
    }
  };

  const complete = () => {
    const [cmd, ...rest] = input.split(" ");
    if (rest.length === 0) {
      const matches = COMMANDS.filter((c) => c.startsWith(cmd.toLowerCase()));
      if (matches.length === 1) setInput(matches[0] + " ");
      else if (matches.length > 1) print(<Dim>{matches.join("  ")}</Dim>);
      return;
    }
    const partial = rest.join(" ");
    const pool =
      cmd === "goto" ? SECTIONS
      : cmd === "cat" ? FILES
      : cmd === "theme" ? ["dark", "light"]
      : cmd === "open" ? projects.map((_, i) => String(i + 1))
      : cmd === "security" ? assessments.map((_, i) => String(i + 1))
      : [];
    const matches = pool.filter((p) => p.startsWith(partial));
    if (matches.length === 1) setInput(`${cmd} ${matches[0]}`);
    else if (matches.length > 1) print(<Dim>{matches.join("  ")}</Dim>);
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

  if (!mounted) return null;

  return (
    <>
      <div
        className={`term-backdrop fixed inset-0 z-[60] bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] backdrop-blur-sm ${closing ? "closing" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      {!closing && (
        <div className="fixed inset-0 z-[61] pointer-events-none" aria-hidden>
          <div className="term-ring" />
          <div className="term-slice" style={{ top: "34%" }} />
          <div className="term-slice" style={{ top: "57%", animationDelay: "60ms" }} />
        </div>
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Terminal"
        className={`term-window terminal-window fixed z-[62] left-1/2 top-[12vh] w-[min(720px,calc(100vw-24px))] -translate-x-1/2 flex flex-col panel corners shadow-[0_30px_80px_rgba(0,0,0,0.35)] ${closing ? "closing" : ""}`}
        style={fit ? { top: fit.top, height: fit.height } : undefined}
        onClick={() => inputRef.current?.focus({ preventScroll: true })}
      >
        <div className="flex items-center gap-3 px-4 h-10 border-b border-[var(--line)] shrink-0">
          <span className="kanji text-[13px] text-[var(--red)] tracking-normal" lang="ja" title="端末 — terminal">
            端末
          </span>
          <span className="label">Terminal</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto label hover:text-[var(--red)] transition-colors"
            aria-label="Close terminal"
          >
            Esc
          </button>
        </div>

        <div
          ref={scrollRef}
          className={`${fit ? "flex-1 min-h-0" : "h-[min(56vh,440px)]"} overflow-y-auto overscroll-contain px-4 py-3 font-mono text-[12px] leading-[1.7] text-[var(--fg)]`}
        >
          {lines.map((l) => (
            <div key={l.id} className="whitespace-pre-wrap break-words">
              {l.node}
            </div>
          ))}
          <label className="flex items-center gap-2">
            <span className="shrink-0">
              <Red>guest@ken</Red>
              <Dim>:~$</Dim>
            </span>
            {/* Phones: the input is 16px so iOS Safari doesn't zoom on focus, then scaled
                to 75% so it matches the 12px terminal text and the caret lines up. */}
            <span className="flex-1 min-w-0 flex items-center overflow-hidden">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                aria-label="Command"
                enterKeyHint="send"
                className="w-[133.334%] shrink-0 origin-left scale-75 sm:w-full sm:scale-100 bg-transparent outline-none leading-[1.7] text-[16px] sm:text-[12px] text-[var(--fg)] caret-[var(--red)]"
              />
            </span>
          </label>
        </div>
      </div>
    </>
  );
}
