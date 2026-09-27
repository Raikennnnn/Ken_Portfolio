/** Numbered section header: index, English title, and the matching kanji with its meaning. */
export function SectionHeader({
  index,
  title,
  kanji,
  meaning,
}: {
  index: string;
  title: string;
  kanji: string;
  meaning: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-10 md:mb-12">
      <span className="font-mono text-[11px] text-[var(--red)]">{index}</span>
      <h2 className="font-serif text-[1.35rem] md:text-[1.5rem] font-medium tracking-tight">{title}</h2>
      <span className="flex-1 h-px bg-[var(--line)]" aria-hidden />
      <span className="flex items-baseline gap-2" title={meaning}>
        <span className="kanji text-[15px] text-[var(--fg-muted)]" lang="ja">
          {kanji}
        </span>
        <span className="label hidden sm:inline">{meaning}</span>
      </span>
    </div>
  );
}
