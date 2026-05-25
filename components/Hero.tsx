"use client";

import Image from "next/image";
import { profile } from "@/content/data";

export function Hero() {
  return (
    <section className="grid grid-cols-12 gap-6 py-16 md:py-24">
      {/* Left: portrait + meta */}
      <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
        <div className="relative aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-sm grayscale hover:grayscale-0 transition duration-700">
          <Image
            src={profile.image}
            alt={profile.name}
            fill
            sizes="(max-width: 768px) 80vw, 280px"
            className="object-cover"
            priority
          />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest opacity-60 max-w-[280px]">
          <div className="flex justify-between border-b border-current/20 py-1">
            <span>name</span>
            <span>{profile.name}</span>
          </div>
          <div className="flex justify-between border-b border-current/20 py-1">
            <span>role</span>
            <span>{profile.title}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>loc</span>
            <span>{profile.location}</span>
          </div>
        </div>
      </div>

      {/* Right: large editorial bio */}
      <div className="col-span-12 md:col-span-8 flex flex-col justify-end">
        <p className="font-mono text-xs uppercase tracking-widest opacity-60 mb-6">
          — Vol. 01 / Personal record
        </p>
        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
          {profile.bio[0]}
        </h1>
        <div className="mt-8 max-w-xl space-y-3 text-base md:text-lg opacity-80">
          {profile.bio.slice(1).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
