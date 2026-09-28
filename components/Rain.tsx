"use client";

import { useEffect, useRef } from "react";
import { onThemeChange } from "@/lib/theme";

type Drop = { x: number; y: number; len: number; speed: number; alpha: number; red: boolean };

const SLANT = 0.22; // horizontal drift per unit of fall, like wind-blown rain
const DENSITY = 1 / 6500; // drops per px² of hero area
const MAX_DROPS = 200;

/**
 * Thin slanted rain behind the hero, after the NINJA GAIDEN 4 menus.
 * Each drop gets a random depth: far drops are short, slow and faint.
 * On the light theme near-black ink reads as scratches, so it uses the softer muted grey there,
 * drawn a little stronger to stay visible. It pauses when the hero is off screen or the tab is
 * hidden, and doesn't run at all with reduced motion.
 */
export function Rain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d")!;

    let w = 0, h = 0, drops: Drop[] = [];
    let ink = "", red = "", fade = 1;
    let raf = 0, last = 0, visible = true;

    const readColors = () => {
      const css = getComputedStyle(document.documentElement);
      const light = document.documentElement.dataset.theme === "light";
      ink = css.getPropertyValue(light ? "--fg-muted" : "--fg").trim();
      red = css.getPropertyValue("--red").trim();
      fade = light ? 1.5 : 1;
    };

    const spawn = (anywhere: boolean): Drop => {
      const depth = Math.random(); // 0 = far, 1 = near
      return {
        x: Math.random() * (w + h * SLANT) - h * SLANT,
        y: anywhere ? Math.random() * h : -30 - Math.random() * h * 0.3,
        len: 14 + depth * 34,
        speed: 420 + depth * 780,
        alpha: 0.035 + depth * 0.1,
        red: Math.random() < 0.035,
      };
    };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(MAX_DROPS, Math.round(w * h * DENSITY));
      drops = Array.from({ length: count }, () => spawn(true));
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        d.y += d.speed * dt;
        d.x += d.speed * SLANT * dt;
        if (d.y - d.len > h) drops[i] = spawn(false);
        ctx.globalAlpha = d.red ? d.alpha * 2.2 : d.alpha * fade; // red is already strong on both themes
        ctx.strokeStyle = d.red ? red : ink;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * SLANT, d.y - d.len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    readColors();
    resize();
    start();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      visible ? start() : stop();
    });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    const offTheme = onThemeChange(() => requestAnimationFrame(readColors));

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      offTheme();
    };
  }, []);

  return (
    <div
      className="absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 -z-10 pointer-events-none [mask-image:linear-gradient(180deg,#000_55%,transparent)]"
      aria-hidden
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
