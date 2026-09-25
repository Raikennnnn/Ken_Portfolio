"use client";

import { useCursorPosition } from "@/lib/useCursorPosition";

export function CursorProvider({ children }: { children: React.ReactNode }) {
  useCursorPosition();
  return <>{children}</>;
}
