"use client";

import { useCallback, useRef, MouseEvent as ReactMouseEvent } from "react";

/** Provides interactive tilt + internal glow on a card element. */
export function useCardTilt(intensity = 8) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;
      const rotY = ((x - midX) / midX) * intensity;
      const rotX = ((midY - y) / midY) * intensity;
      el.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`;
      el.style.setProperty("--card-mx", `${x}px`);
      el.style.setProperty("--card-my", `${y}px`);
    },
    [intensity]
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)";
  }, []);

  return { ref, onMove, onLeave };
}
