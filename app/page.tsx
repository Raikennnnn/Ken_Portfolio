import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Work } from "@/components/Work";
import { Skills } from "@/components/Skills";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { NetworkCanvas } from "@/components/NetworkCanvas";
import { ModelCanvas } from "@/components/ModelCanvas";

export default function Page() {
  return (
    <>
      {/* Network topology background */}
      <NetworkCanvas />

      {/* 3D model layer — hidden until model is added */}
      {/* <ModelCanvas /> */}

      <main className="mx-auto max-w-[1080px] px-5 md:px-10 relative z-10">
        <Header />
        <Hero />
        <Work />
        <Skills />
        <About />
        <Contact />
      </main>
    </>
  );
}
