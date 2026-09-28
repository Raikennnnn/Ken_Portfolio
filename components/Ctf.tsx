"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FLAGS, getSolved, onSolvedChange, resetSolved, submitFlag } from "@/lib/ctf";
import { links } from "@/content/data";
import { pad2 } from "@/lib/format";
import { useInView } from "@/lib/useInView";
import { SectionHeader } from "./SectionHeader";

type Message = { tone: "ok" | "muted" | "bad"; text: string } | null;

export function Ctf() {
  const { ref, inView } = useInView();
  const [solved, setSolved] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState<Message>(null);
  const email = links.find((l) => l.href.startsWith("mailto:"))?.href;
  const done = solved.length === FLAGS.length;

  useEffect(() => {
    setSolved(getSolved());
    // Progress can change from the terminal too; an older form message would be stale.
    // (A form submit sets its own message right after this fires.)
    return onSolvedChange((ids) => {
      setSolved(ids);
      setMessage(null);
    });
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const result = await submitFlag(input);
    if (result.status === "new") {
      setMessage({ tone: "ok", text: `${result.flag.title}: found. ${result.solved} of ${FLAGS.length}.` });
      setInput("");
    } else if (result.status === "repeat") {
      setMessage({ tone: "muted", text: `You already found ${result.flag.title.toLowerCase()}.` });
    } else if (result.status === "unsupported") {
      setMessage({ tone: "bad", text: "This browser can't check flags here (needs HTTPS)." });
    } else {
      setMessage({ tone: "bad", text: "Not a flag. They look like flag{...}." });
    }
  };

  return (
    <section id="ctf" ref={ref} className="py-20 md:py-28 scroll-mt-16">
      <SectionHeader index="07" title="Break this site" />

      <p className="-mt-4 mb-12 max-w-[600px] text-[0.97rem] leading-[1.75] text-[var(--fg-muted)]">
        I hid five flags in this site, in the places I check first when I test a system. You only need
        your browser. Your progress stays on your device.
      </p>

      <div className={`reveal ${inView ? "in" : ""} grid lg:grid-cols-[1fr_340px] gap-10 lg:gap-12`}>
        <ol className="border-t border-[var(--line)]">
          {FLAGS.map((f, i) => {
            const found = solved.includes(f.id);
            return (
              <li key={f.id} className="grid grid-cols-[28px_1fr_auto] gap-x-4 py-4 border-b border-[var(--line)]">
                <span className={`font-mono text-[11px] pt-1 ${found ? "text-[var(--red)]" : "text-[var(--fg-dim)]"}`}>
                  {pad2(i + 1)}
                </span>
                <span>
                  <span className="flex items-baseline gap-3">
                    <span className={`text-[1rem] ${found ? "line-through decoration-[var(--red)]" : ""}`}>{f.title}</span>
                    <span className="label">{f.level}</span>
                  </span>
                  <span className="block mt-1 text-[0.88rem] leading-[1.6] text-[var(--fg-muted)]">{f.hint}</span>
                </span>
                <span className={`label pt-1 ${found ? "text-[var(--red)]" : ""}`}>{found ? "Found" : "—"}</span>
              </li>
            );
          })}
        </ol>

        <div className="panel corners p-5 self-start">
          <div className="flex items-baseline justify-between">
            <span className="label">Progress</span>
            <span className="font-serif text-[1.6rem] font-medium">
              {pad2(solved.length)}
              <span className="text-[var(--fg-dim)]"> / {pad2(FLAGS.length)}</span>
            </span>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1.5" aria-hidden>
            {FLAGS.map((f) => (
              <span
                key={f.id}
                className={`h-1.5 ${solved.includes(f.id) ? "bg-[var(--red)]" : "bg-[var(--line-strong)]"}`}
              />
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-6">
            <label htmlFor="flag-input" className="label block mb-2">
              Submit a flag
            </label>
            <div className="flex gap-2">
              <input
                id="flag-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="flag{...}"
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                className="flex-1 min-w-0 h-9 px-3 bg-[var(--bg-sunken)] border border-[var(--line-strong)] font-mono text-[16px] sm:text-[12px] text-[var(--fg)] placeholder:text-[var(--fg-dim)] outline-none focus:border-[var(--red-line)]"
              />
              <button type="submit" className="btn btn-primary">
                Check
              </button>
            </div>
            <p
              className={`mt-3 min-h-[1.5em] text-[0.85rem] ${
                message?.tone === "ok"
                  ? "text-[var(--red)]"
                  : message?.tone === "bad"
                    ? "text-[var(--fg-muted)]"
                    : "text-[var(--fg-dim)]"
              }`}
              aria-live="polite"
            >
              {message?.text}
            </p>
          </form>

          {done ? (
            <div className="mt-2 pt-4 border-t border-[var(--line)]">
              <p className="text-[0.92rem] leading-[1.65]">
                All five. That was recon, response headers, encoding and a trust boundary: most of a first pass
                on a real web app. Tell me how long it took.
              </p>
              {email && (
                <a href={`${email}?subject=Found%20all%20five%20flags`} className="btn btn-primary mt-4">
                  Email me
                </a>
              )}
            </div>
          ) : (
            <p className="mt-2 pt-4 border-t border-[var(--line)] text-[0.84rem] leading-[1.6] text-[var(--fg-dim)]">
              Stuck? The terminal (<kbd className="kbd">Ctrl K</kbd>) takes <code className="font-mono">submit</code> and{" "}
              <code className="font-mono">ctf</code> too.
            </p>
          )}

          {solved.length > 0 && (
            <button
              type="button"
              onClick={() => {
                resetSolved();
                setMessage(null);
              }}
              className="label mt-4 hover:text-[var(--red)] transition-colors"
            >
              Reset progress
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
