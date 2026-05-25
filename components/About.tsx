import { profile } from "@/content/data";

export function About() {
  return (
    <section id="about" className="py-16 md:py-24">
      <div className="flex items-baseline justify-between border-b border-current pb-3 mb-8">
        <h2 className="font-mono text-xs uppercase tracking-widest">
          § About
        </h2>
        <span className="font-mono text-xs uppercase tracking-widest opacity-60">
          colophon
        </span>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-8">
          <div className="space-y-5 font-serif text-lg md:text-xl leading-relaxed">
            <p>
              I&apos;m {profile.name}. I work as a {profile.title.toLowerCase()},
              with a soft spot for tools that feel quiet, opinionated, and fast.
            </p>
            <p>
              My favourite work tends to live at the boundary between design
              and engineering — the place where a small detail decides whether
              someone trusts the thing or not.
            </p>
            <p>
              Outside of code: long walks, slower coffee, and occasionally
              writing about what I&apos;m learning.
            </p>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 md:pl-8 font-mono text-xs uppercase tracking-widest opacity-70 space-y-3">
          <div>
            <div className="opacity-60">Stack</div>
            <div>TypeScript · React · Node · Postgres</div>
          </div>
          <div>
            <div className="opacity-60">Comfort</div>
            <div>UI systems · APIs · DX tooling</div>
          </div>
          <div>
            <div className="opacity-60">Currently</div>
            <div>Open to interesting work</div>
          </div>
        </div>
      </div>
    </section>
  );
}
