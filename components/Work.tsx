import { projects } from "@/content/data";
import { ProjectRow } from "./ProjectRow";

export function Work() {
  return (
    <section id="work" className="py-16 md:py-24">
      <div className="flex items-baseline justify-between border-b border-current pb-3 mb-2">
        <h2 className="font-mono text-xs uppercase tracking-widest">
          § Selected Work
        </h2>
        <span className="font-mono text-xs uppercase tracking-widest opacity-60">
          {projects.length} entries
        </span>
      </div>
      <div>
        {projects.map((p) => (
          <ProjectRow key={p.index} project={p} />
        ))}
      </div>
    </section>
  );
}
