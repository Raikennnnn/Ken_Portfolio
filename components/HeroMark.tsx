/**
 * Hero emblem, after NG4's menu "eclipse": a thin ring on a centre line with a
 * vertical kanji motto. 検証防御 (kenshō bōgyo) — "verify, defend": test the
 * system, then harden it. 検 is also read "ken".
 */
export function HeroMark() {
  return (
    <div className="panel corners relative h-[340px] md:h-[min(68vh,520px)] overflow-hidden" aria-hidden>
      <div className="rain" />

      {/* centre line with ticks */}
      <div className="absolute left-1/2 top-6 bottom-6 w-px bg-[var(--red-line)]" />
      {[14, 30, 70, 86].map((top) => (
        <div
          key={top}
          className="absolute left-1/2 w-2 h-px -translate-x-1/2 bg-[var(--red-line)]"
          style={{ top: `${top}%` }}
        />
      ))}

      {/* eclipse ring */}
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[62%] max-w-[300px] aspect-square overflow-visible"
        viewBox="0 0 200 200"
      >
        <defs>
          <radialGradient id="ecl" r="0.5">
            <stop offset="0.72" stopColor="var(--red)" stopOpacity="0" />
            <stop offset="0.8" stopColor="var(--red)" stopOpacity="0.14" />
            <stop offset="1" stopColor="var(--red)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="100" fill="url(#ecl)" />
        <circle cx="100" cy="100" r="72" fill="var(--bg-panel)" stroke="var(--red)" strokeWidth="1" />
        <g className="origin-center animate-[spin_60s_linear_infinite]" style={{ transformBox: "fill-box" }}>
          <circle cx="100" cy="100" r="86" fill="none" stroke="var(--red-line)" strokeWidth="0.6" strokeDasharray="2 6" />
        </g>
      </svg>

      {/* kanji column */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-[var(--red-line)] bg-[var(--bg-panel)] px-1.5 py-2.5">
        <span
          className="kanji block text-[var(--red)] text-[22px] md:text-[26px] leading-[1.35]"
          style={{ writingMode: "vertical-rl" }}
          lang="ja"
        >
          検証防御
        </span>
      </div>

      {/* captions */}
      <div className="absolute left-4 top-4 label">検 · ken · to inspect</div>
      <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-4">
        <span className="label">Verify · Defend</span>
        <span className="label text-right">kenshō bōgyo</span>
      </div>
    </div>
  );
}
