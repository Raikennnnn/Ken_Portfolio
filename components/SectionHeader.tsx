/** Numbered section header: index, title and a hairline to the right edge. */
export function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-10 md:mb-12">
      <span className="font-mono text-[11px] text-[var(--red)]">{index}</span>
      <h2 className="font-serif text-[1.35rem] md:text-[1.5rem] font-medium tracking-tight">{title}</h2>
      <span className="flex-1 h-px bg-[var(--line)]" aria-hidden />
    </div>
  );
}
