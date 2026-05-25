import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Work } from "@/components/Work";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-5 md:px-8">
      <Header />
      <Hero />
      <Work />
      <About />
      <Contact />
    </main>
  );
}
