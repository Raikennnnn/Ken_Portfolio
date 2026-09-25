"use client";

import dynamic from "next/dynamic";

// three.js is ~150 kB; load it after the page is interactive so text paints first.
export const CompanionLoader = dynamic(
  () => import("./Companion").then((m) => m.Companion),
  { ssr: false }
);
