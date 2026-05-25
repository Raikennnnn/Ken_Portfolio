import { links, meta } from "@/content/data";

export function Contact() {
  return (
    <section id="contact" className="py-16 md:py-24">
      <div className="flex items-baseline justify-between border-b border-current pb-3 mb-8">
        <h2 className="font-mono text-xs uppercase tracking-widest">
          § Contact
        </h2>
        <span className="font-mono text-xs uppercase tracking-widest opacity-60">
          end of record
        </span>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <p className="col-span-12 md:col-span-7 font-serif text-3xl md:text-5xl leading-tight tracking-tight">
          Have a project, a question, or a half-formed idea? Send a note —
          quietly enthusiastic replies guaranteed.
        </p>
        <ul className="col-span-12 md:col-span-5 md:pl-8 space-y-3">
          {links.map((l) => (
            <li key={l.label} className="flex items-baseline justify-between border-b border-current/20 py-2">
              <span className="font-mono text-xs uppercase tracking-widest opacity-60">
                {l.label}
              </span>
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="row-link font-mono text-sm"
              >
                {l.href.replace(/^mailto:/, "").replace(/^https?:\/\//, "")}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-16 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest opacity-50">
        <span>{meta.copy}</span>
        <span>made with next.js + vercel</span>
      </div>
    </section>
  );
}
