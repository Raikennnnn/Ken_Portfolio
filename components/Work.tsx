"use client";

import { projects } from "@/content/data";
import { ProjectRow } from "./ProjectRow";
import { useInView } from "@/lib/useInView";

function fakeHash(seed: number): string {
  let h = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < 8; i++) {
    h += chars[((seed * (i + 7) * 31) % 16) | 0];
  }
  return h;
}

export function Work() {
  const { ref, inView } = useInView();

  return (
    <section id="work" className="py-16 md:py-24" ref={ref}>
      {/* Section header */}
      <div className="section-header">
        <span className="section-id">01</span>
        <span className="section-label">Selected Work</span>
        <div className="section-line" />
        <span className="section-hash">sha:{fakeHash(3)}</span>
      </div>

      {/* Project cards */}
      <div
        className={`transition-all duration-700 ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {projects.map((p, i) => (
          <ProjectRow key={p.index} project={p} delay={i * 100} />
        ))}
      </div>
    </section>
  );
}
