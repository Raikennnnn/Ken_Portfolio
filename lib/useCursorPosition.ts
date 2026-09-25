"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export function useCursorPosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  const onMove = useCallback((e: MouseEvent) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setPosition({ x: e.clientX, y: e.clientY });
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);
    });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [onMove]);

  return position;
}
