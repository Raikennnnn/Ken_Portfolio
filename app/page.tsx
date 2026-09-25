import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Work } from "@/components/Work";
import { Skills } from "@/components/Skills";
import { Activity } from "@/components/Activity";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { NetworkCanvas } from "@/components/NetworkCanvas";
import { CompanionLoader } from "@/components/CompanionLoader";
import { Terminal } from "@/components/Terminal";
import { profile } from "@/content/data";
import { getGithubSnapshot, timeAgo } from "@/lib/github";

// Re-render at most hourly so the GitHub data stays fresh.
export const revalidate = 3600;

export default async function Page() {
  const github = await getGithubSnapshot(profile.github);
  const lastPush = github?.repos[0] ? timeAgo(github.repos[0].pushedAt) : null;

  return (
    <>
      {/* Network topology background */}
      <NetworkCanvas />

      <Header />

      <main className="mx-auto max-w-[1080px] px-5 md:px-10 relative z-10">
        <Hero lastPush={lastPush} publicRepos={github?.publicRepos ?? null} />
        <Work />
        <Skills />
        <Activity user={profile.github} snapshot={github} />
        <About />
        <Contact />
      </main>

      {/* 3D companion (hero → corner dock) and the Ctrl+K terminal */}
      <CompanionLoader />
      <Terminal />
    </>
  );
}
