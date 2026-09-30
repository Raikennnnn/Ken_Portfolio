"use client";

import { useEffect, useRef, useState } from "react";
import { onThemeChange } from "@/lib/theme";
import { profile } from "@/content/data";

const SRC = "/profile-photo.jpg";
const CW = 528; // overlay canvas, 3:4 at 2× the displayed size
const CH = 704;
const LOCK_MS = 1200;

// Where the face sits in the cropped frame, and the box the brackets lock onto (fractions).
const FACE = { x: 0.47, y: 0.45, w: 0.4, h: 0.34 };
const LOCK = 0.4; // share of the sequence spent closing in
const DOT = 14; // halftone grid spacing, in canvas px
const BAND = 0.15; // bottom share of the frame that breaks up into halftone

type RGB = [number, number, number];

function cssColor(name: string): RGB {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace("#", "");
  const n = parseInt(hex.length === 3 ? hex.replace(/./g, "$&$&") : hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The photo is always visible. On top of it sits a canvas that draws:
 *   - a halftone edge where the bottom of the photo breaks up into the frame
 *   - a one-time "lock-on" when the frame first scrolls into view (and again on hover):
 *     a red scan line sweeps down, brackets close from the frame corners onto the face,
 *     flicker as they lock, then fade and leave the verified tag
 */
export function PhotoFrame() {
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [locked, setLocked] = useState(false);
  const frameRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const raf = useRef(0);
  const running = useRef(false);

  const render = (p: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CW, CH);

    // ── halftone edge: dots in the frame colour, growing until they merge at the bottom
    const paper = cssColor("--bg-sunken").join(",");
    const top = CH * (1 - BAND);
    ctx.fillStyle = `rgb(${paper})`;
    ctx.beginPath();
    for (let row = 0, gy = top + DOT / 2; gy < CH + DOT; gy += DOT * 0.866, row++) {
      const t = clamp01((gy - top) / (CH - top));
      const rad = Math.pow(t, 1.3) * DOT * 0.62;
      if (rad < 0.5) continue;
      for (let gx = row % 2 ? DOT / 2 : 0; gx < CW + DOT; gx += DOT) {
        ctx.moveTo(gx + rad, gy);
        ctx.arc(gx, gy, rad, 0, Math.PI * 2);
      }
    }
    ctx.fill();

    if (p <= 0 || p >= 1) return;
    const red = cssColor("--red").join(",");
    const fx = FACE.x * CW;
    const fy = FACE.y * CH;

    // ── scan line sweeping down with a faint trail
    const s = clamp01(p / 0.6);
    if (s < 1) {
      const y = easeInOut(s) * CH;
      const fade = 1 - clamp01((s - 0.8) / 0.2);
      const trail = ctx.createLinearGradient(0, y - 70, 0, y);
      trail.addColorStop(0, `rgba(${red},0)`);
      trail.addColorStop(1, `rgba(${red},${0.16 * fade})`);
      ctx.fillStyle = trail;
      ctx.fillRect(0, y - 70, CW, 70);
      ctx.fillStyle = `rgba(${red},${0.85 * fade})`;
      ctx.fillRect(0, y - 1, CW, 2);
    }

    // ── lock-on brackets: from the frame corners onto the face box
    const close = easeOut(clamp01(p / LOCK));
    const alpha = clamp01(p / 0.06) * (1 - clamp01((p - 0.72) / 0.24));
    const flicker = p > LOCK && p < LOCK + 0.07 && Math.floor(p * 140) % 2 === 0;
    if (alpha > 0 && !flicker) {
      const inset = 14;
      const bx0 = lerp(inset, fx - (FACE.w * CW) / 2, close);
      const by0 = lerp(inset, fy - (FACE.h * CH) / 2, close);
      const bx1 = lerp(CW - inset, fx + (FACE.w * CW) / 2, close);
      const by1 = lerp(CH - inset, fy + (FACE.h * CH) / 2, close);
      const arm = lerp(44, 26, close);
      const t = 3;
      ctx.fillStyle = `rgba(${red},${alpha})`;
      const corners: [number, number, number, number][] = [[bx0, by0, 1, 1], [bx1, by0, -1, 1], [bx0, by1, 1, -1], [bx1, by1, -1, -1]];
      for (const [x, y, sx, sy] of corners) {
        ctx.fillRect(sx > 0 ? x : x - arm, sy > 0 ? y : y - t, arm, t);
        ctx.fillRect(sx > 0 ? x : x - t, sy > 0 ? y : y - arm, t, arm);
      }
      // small crosshair while locking
      const cross = clamp01((p - 0.14) / 0.1) * (1 - clamp01((p - LOCK - 0.1) / 0.12));
      if (cross > 0) {
        ctx.fillStyle = `rgba(${red},${alpha * cross})`;
        ctx.fillRect(fx - 14, fy - t / 2, 9, t);
        ctx.fillRect(fx + 5, fy - t / 2, 9, t);
        ctx.fillRect(fx - t / 2, fy - 14, t, 9);
        ctx.fillRect(fx - t / 2, fy + 5, t, 9);
      }
    }
  };

  const lockOn = () => {
    if (running.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      render(1);
      setLocked(true);
      return;
    }
    running.current = true;
    setLocked(false);
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / LOCK_MS);
      render(p);
      if (p > 0.8) setLocked(true);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else running.current = false;
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const ready = () => {
      setStatus("ready");
      render(0);
    };
    if (img.complete) {
      if (img.naturalWidth > 0) ready();
      else setStatus("missing");
    } else {
      img.addEventListener("load", ready, { once: true });
      img.addEventListener("error", () => setStatus("missing"), { once: true });
    }

    // Redraw the halftone edge in the new colours when the theme changes.
    const off = onThemeChange(() => requestAnimationFrame(() => !running.current && render(0)));
    return () => {
      off();
      cancelAnimationFrame(raf.current);
      running.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play the lock-on once, the first time the frame is properly in view.
  useEffect(() => {
    if (status !== "ready" || !frameRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        lockOn();
      },
      { threshold: 0.6 }
    );
    io.observe(frameRef.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <figure ref={frameRef} className="photo-frame" onMouseEnter={() => status === "ready" && lockOn()}>
      <div className="photo-inner corners block">
        {status === "missing" ? (
          <span className="absolute inset-0 grid place-items-center label">Add profile-photo.jpg to /public</span>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={SRC}
              alt={profile.fullName}
              width={960}
              height={959}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-[50%_30%] [filter:saturate(0.88)_contrast(1.04)]"
            />
            {/* soft vignette so the photo sits in the frame */}
            <span
              className="absolute inset-0 pointer-events-none shadow-[inset_0_0_48px_color-mix(in_srgb,var(--bg-sunken)_45%,transparent)]"
              aria-hidden
            />
            <canvas ref={canvasRef} width={CW} height={CH} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden />
            <span
              className={`absolute left-2 bottom-2 label px-1.5 py-0.5 bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] transition-opacity ${
                locked ? "opacity-100 duration-300" : "opacity-0 duration-100"
              }`}
              aria-hidden
            >
              <span className="text-[var(--red)]">検</span> · verified
            </span>
          </>
        )}
      </div>
      <figcaption className="mt-2.5 flex items-baseline justify-between">
        <span className="label">Portrait</span>
        <span className="label">{profile.name}</span>
      </figcaption>
    </figure>
  );
}
