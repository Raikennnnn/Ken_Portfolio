"use client";

import { profile } from "@/content/data";
import { useInView } from "@/lib/useInView";
import { PhotoFrame } from "./PhotoFrame";
import { SectionHeader } from "./SectionHeader";

export function About() {
  const { ref, inView } = useInView();

  return (
    <section id="about" ref={ref} className="py-20 md:py-28 scroll-mt-16">
      <SectionHeader index="01" title="About" />

      <div className={`reveal ${inView ? "in" : ""} grid md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr_240px] gap-10 lg:gap-12`}>
        <PhotoFrame />

        <div className="flex flex-col gap-5 text-[1.03rem] leading-[1.8] text-[var(--fg-muted)] max-w-[560px]">
          {profile.bio.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <dl className="md:col-span-2 lg:col-span-1 border-t border-[var(--line)]">
          {profile.focus.map((item) => (
            <div key={item.label} className="py-4 border-b border-[var(--line)]">
              <dt className="label">{item.label}</dt>
              <dd className="mt-1.5 text-[0.93rem]">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

    </section>
  );
}
