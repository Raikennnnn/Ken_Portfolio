import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Work, type OtherRepo } from "@/components/Work";
import { Security } from "@/components/Security";
import { Ctf } from "@/components/Ctf";
import { Skills } from "@/components/Skills";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Terminal } from "@/components/Terminal";
import { profile, projects } from "@/content/data";
import { getRepos, timeAgo } from "@/lib/github";

// Re-render at most hourly so the GitHub data stays fresh.
export const revalidate = 3600;

const key = (url: string) => url.toLowerCase().replace(/\/$/, "");

export default async function Page() {
  const repos = (await getRepos(profile.github)) ?? [];
  const projectRepos = new Set(projects.flatMap((p) => (p.repo ? [key(p.repo)] : [])));

  // Formatted here so server and client render the same text.
  const lastPush: Record<string, string> = {};
  const others: OtherRepo[] = [];
  for (const r of repos) {
    if (projectRepos.has(key(r.url))) lastPush[key(r.url)] = timeAgo(r.pushedAt);
    else others.push({ name: r.name, description: r.description, language: r.language, url: r.url, ago: timeAgo(r.pushedAt) });
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1120px] px-5 md:px-8">
        <Hero />
        <Work lastPush={lastPush} others={others} />
        <Security />
        <Ctf />
        <Skills />
        <About />
        <Contact />
      </main>
      <Terminal />
    </>
  );
}
