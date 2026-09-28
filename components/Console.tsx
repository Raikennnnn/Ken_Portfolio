"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  profile, projects, skills, links, certifications, writeups, assessments, securityChecks, securityTools, skillGroups, evidenceFor,
} from "@/content/data";
import { getTheme, setTheme } from "@/lib/theme";
import { isSoundOn, setSound } from "@/lib/sound";
import { FLAGS, NOTES_FILE, getSolved, submitFlag } from "@/lib/ctf";

// The terminal's command engine. Used by the page terminal (Terminal.tsx) and by the desk
// in the server room (RoomScreens.tsx), which runs it on the room's own monitor.

type Line = { id: number; node: ReactNode };
export type ConsoleWhere = "page" | "room";

export const SECTIONS = ["top", "about", "experience", "work", "security", "credentials", "skills", "ctf", "contact"];

const HELP: [string, string][] = [
  ["whoami", "who is this"],
  ["projects", "list projects"],
  ["open <n>", "details and security notes for project n"],
  ["security [n]", "systems I've security-tested / details for n"],
  ["room", "walk around the server room"],
  ["ctf", "five flags hidden in this site"],
  ["submit <flag>", "check a flag"],
  ["skills", "skills and where they are used"],
  ["certs", "certifications and course badges (Credly)"],
  ["contact", "ways to reach me"],
  ["github | linkedin | email", "open a link"],
  ["goto <section>", SECTIONS.join(" · ")],
  ["theme [dark|light]", "switch colour mode"],
  ["sound [on|off]", "menu sounds (off by default)"],
  ["cat security.txt", "responsible disclosure"],
  ["clear | exit", "clear the screen / close (Esc)"],
];

const COMMANDS = [
  "help", "whoami", "ls", "cat", "projects", "open", "security", "room", "ctf", "submit", "skills", "certs", "contact", "github",
  "linkedin", "email", "goto", "theme", "sound", "clear", "exit", "history", "date", "echo",
];

const FILES = ["about.txt", "security.txt", "projects/", "skills.json"];

export function Dim({ children }: { children: ReactNode }) {
  return <span className="text-[var(--fg-dim)]">{children}</span>;
}
export function Muted({ children }: { children: ReactNode }) {
  return <span className="text-[var(--fg-muted)]">{children}</span>;
}
export function Red({ children }: { children: ReactNode }) {
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

// Each console keeps its scrollback and history for the visit, even while it's closed.
let nextId = 0;
const sessions = new Map<ConsoleWhere, { lines: Line[]; history: string[] }>();

function banner(where: ConsoleWhere, user: string): Line[] {
  return where === "room"
    ? [
        { id: nextId++, node: <span><Red>ken-srv01</Red> <Dim>· console attached · {user}</Dim></span> },
        { id: nextId++, node: <Dim>same terminal as the site. type <Red>help</Red> · <Red>exit</Red> or Esc steps back from the desk</Dim> },
        { id: nextId++, node: " " },
      ]
    : [
        { id: nextId++, node: <span><Red>ken@portfolio</Red> <Dim>· guest session</Dim></span> },
        { id: nextId++, node: <Dim>type <Red>help</Red> for commands · tab completes · ↑↓ history</Dim> },
        { id: nextId++, node: " " },
      ];
}

export function Console({
  where,
  user = "guest",
  onExit,
  onGoto,
  onRoom,
  className = "",
}: {
  where: ConsoleWhere;
  user?: string;
  /** exit / quit / Esc */
  onExit: () => void;
  /** page only: scroll to a section */
  onGoto?: (id: string) => void;
  /** page only: go into the server room */
  onRoom?: () => void;
  /** sizing for the scrollback area */
  className?: string;
}) {
  const saved = sessions.get(where);
  const [lines, setLines] = useState<Line[]>(() => saved?.lines ?? banner(where, user));
  const [history, setHistory] = useState<string[]>(() => saved?.history ?? []);
  const [input, setInput] = useState("");
  const [cursor, setCursor] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prompt = where === "room" ? `${user}@srv` : "guest@ken";

  useEffect(() => {
    sessions.set(where, { lines, history });
  }, [where, lines, history]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }, []);

  const print = (...nodes: ReactNode[]) => setLines((ls) => [...ls, ...nodes.map((node) => ({ id: nextId++, node }))]);

  const openUrl = (href: string | undefined) => {
    if (!href) return;
    if (href.startsWith("mailto:")) window.location.href = href;
    else window.open(href, "_blank", "noopener,noreferrer");
  };

  const run = (raw: string) => {
    const cmdline = raw.trim();
    print(<span><Red>{prompt}</Red><Dim>:~$</Dim> {cmdline}</span>);
    if (!cmdline) return;
    setHistory((h) => [...h, cmdline]);

    const [cmd, ...args] = cmdline.split(/\s+/);
    const arg = args.join(" ");

    switch (cmd.toLowerCase()) {
      case "help":
        print(...HELP.map(([c, d]) => <Row left={c} right={d} />));
        break;

      case "whoami":
        print(
          <span>{profile.fullName} ({profile.name})</span>,
          <Muted>I&apos;m {profile.intro}</Muted>,
          ...(where === "room" ? [<Dim>you: {user} (a made-up name for this visit)</Dim>] : [])
        );
        break;

      case "ls":
        // `ls -a` shows the dotfile (CTF flag 4)
        print(<span>{(/(^|\s)-\w*a/.test(arg) ? [".notes", ...FILES] : FILES).join("   ")}</span>);
        break;

      case "cat":
        if (arg === "about.txt") print(...profile.bio.map((b) => <Muted>{b}</Muted>));
        else if (arg === "security.txt")
          print(
            <span>Found a problem with this site? Email {linkHref("email")?.replace("mailto:", "")}.</span>,
            <Dim>Machine-readable copy: /.well-known/security.txt</Dim>
          );
        else if (arg === "skills.json") run("skills");
        else if (arg === ".notes") print(<span>{NOTES_FILE}</span>);
        else print(<Dim>cat: {arg || "missing operand"}: no such file</Dim>);
        break;

      case "room":
        if (where === "room") print(<Dim>you&apos;re already in the server room.</Dim>);
        else {
          print(<Dim>entering the server room…</Dim>);
          onRoom?.();
        }
        break;

      case "ctf": {
        const solved = getSolved();
        print(
          <span>
            break this site <Dim>· {solved.length}/{FLAGS.length} found · progress stays in your browser</Dim>
          </span>,
          ...FLAGS.map((f, i) => (
            <Row
              left={
                <span>
                  {solved.includes(f.id) ? <Red>[x]</Red> : <Dim>[ ]</Dim>} {i + 1}. {f.title} <Dim>({f.level})</Dim>
                </span>
              }
              right={f.hint}
            />
          )),
          <Dim>submit flag{"{...}"} to check one{where === "room" ? " · the vault opens at 5/5" : ""}</Dim>
        );
        break;
      }

      case "submit":
      case "flag":
        if (!arg) {
          print(<Dim>usage: submit flag{"{...}"}</Dim>);
          break;
        }
        submitFlag(arg).then((r) => {
          if (r.status === "new") print(<Red>correct: {r.flag.title.toLowerCase()} · {r.solved}/{FLAGS.length}</Red>);
          else if (r.status === "repeat") print(<Dim>already found: {r.flag.title.toLowerCase()}</Dim>);
          else if (r.status === "unsupported") print(<Dim>can&apos;t check flags over plain HTTP</Dim>);
          else print(<Dim>not a flag</Dim>);
        });
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
        if (a.findings?.length)
          print(<Red>findings</Red>, ...a.findings.map((f) => <Row left={`  ${f.issue}`} right={`fixed: ${f.fix}`} />));
        break;
      }

      case "skills": {
        for (const { key, label } of skillGroups) {
          print(<Red>{label.toLowerCase()}</Red>);
          print(
            ...skills
              .filter((s) => s.category === key)
              .map((s) => <Row left={`  ${s.name}`} right={evidenceFor(s.name).map((e) => e.label).join(", ")} />)
          );
        }
        if (certifications.length) print(<Dim>{certifications.length} credentials — type certs</Dim>);
        if (writeups.length) print(<Dim>{writeups.length} write-up(s) — goto work</Dim>);
        break;
      }

      case "certs":
      case "certifications": {
        const row = (c: (typeof certifications)[number]) => (
          <Row
            left={`  ${c.name}`}
            right={
              <a href={c.verifyUrl} target="_blank" rel="noreferrer" className="link">
                {c.date} · verify ↗
              </a>
            }
          />
        );
        print(
          <Red>certifications (by exam)</Red>,
          ...certifications.filter((c) => c.group === "exam").map(row),
          <Red>course badges · cisco networking academy</Red>,
          ...certifications.filter((c) => c.group !== "exam").map(row),
          <Dim>all on Credly · CCNA items are courses, not the CCNA exam</Dim>
        );
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
        if (where === "room") {
          print(<Dim>goto works on the page. step back from the desk (Esc) and take the exit to leave the room.</Dim>);
          break;
        }
        const id = arg.replace(/^\.?\/?/, "") || "top";
        if (SECTIONS.includes(id)) onGoto?.(id);
        else print(<Dim>goto: unknown section. try {SECTIONS.join(", ")}</Dim>);
        break;
      }

      case "sound": {
        const want = arg === "on" ? true : arg === "off" ? false : !isSoundOn();
        setSound(want);
        print(<Dim>sound → {want ? "on" : "off"}</Dim>);
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

      case "clear":
        setLines([]);
        break;

      case "exit":
      case "quit":
        onExit();
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
      : cmd === "sound" ? ["on", "off"]
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
      e.stopPropagation();
      onExit();
    } else if (e.key.toLowerCase() === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto overscroll-contain px-4 py-3 font-mono text-[12px] leading-[1.7] text-[var(--fg)] ${className}`}
      onClick={() => inputRef.current?.focus({ preventScroll: true })}
    >
      {lines.map((l) => (
        <div key={l.id} className="whitespace-pre-wrap break-words">
          {l.node}
        </div>
      ))}
      <label className="flex items-center gap-2">
        <span className="shrink-0">
          <Red>{prompt}</Red>
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
  );
}
