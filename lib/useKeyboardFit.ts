"use client";

import { useEffect, useState } from "react";

/**
 * Phones: the on-screen keyboard covers the bottom of the layout viewport, so a fixed panel
 * sized to the screen ends up with its input hidden. This returns a top/height that fits the
 * *visible* area (the visual viewport) instead, updating as the keyboard opens and closes.
 * Null on wider screens or when inactive, so callers fall back to their normal layout.
 */
export function useKeyboardFit(active: boolean, gap = 10) {
  const [fit, setFit] = useState<{ top: number; height: number } | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) {
      setFit(null);
      return;
    }
    const update = () => {
      if (window.innerWidth > 640) return setFit(null);
      setFit({ top: vv.offsetTop + gap, height: Math.max(180, vv.height - gap * 2) });
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [active, gap]);

  return fit;
}
