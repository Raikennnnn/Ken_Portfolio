"use client";

import { useEffect, useRef, useState } from "react";
import { onThemeChange } from "@/lib/theme";
import { profile } from "@/content/data";

const SRC = "/profile-photo.jpg";
const W = 132; // dither resolution (3:4)
const H = 176;
const SCALE = 2; // canvas is drawn at 2× the dither grid
const CW = W * SCALE;
const CH = H * SCALE;
const IN_MS = 1000; // lock on and reveal…
const OUT_MS = 380; // …release faster

// Where the face sits in the cropped frame, and the box the brackets lock onto (fractions).
const FACE = { x: 0.47, y: 0.44, w: 0.42, h: 0.36 };
const LOCK = 0.32; // share of the reveal spent locking on
const DOT = 8; // halftone grid spacing, in canvas px
const BAND = 44; // width of the halftone edge

// 4×4 Bayer matrix, normalised to 0..1
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

type RGB = [number, number, number];
type Layers = { dither: HTMLCanvasElement; photo: HTMLCanvasElement; mask: HTMLCanvasElement; masked: HTMLCanvasElement };

function cssColor(name: string): RGB {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace("#", "");
  const n = parseInt(hex.length === 3 ? hex.replace(/./g, "$&$&") : hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Source rectangle that cover-crops the photo to 3:4, biased towards the face. */
function coverCrop(img: HTMLImageElement) {
  const dst = W / H;
  if (img.width / img.height > dst) {
    const sw = img.height * dst;
    return { sx: (img.width - sw) / 2, sy: 0, sw, sh: img.height };
  }
  const sh = img.width / dst;
  return { sx: 0, sy: (img.height - sh) * 0.3, sw: img.width, sh };
}

const layer = () => {
  const c = document.createElement("canvas");
  c.width = CW;
  c.height = CH;
  return c;
};

export function PhotoFrame() {
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [revealed, setRevealed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);

  // Animation state lives in refs so the rAF loop never re-renders React.
  const lum = useRef<Float32Array | null>(null); // normalised luminance at W×H
  const progress = useRef(0); // 0 = dithered portrait, 1 = photo
  const target = useRef(0);
  const raf = useRef(0);
  // cached layers: the dithered portrait, the photo, and scratch space for the masked photo
  const layers = useRef<Layers | null>(null);

  /** Draw the ordered-dither portrait (theme colours) into the dither layer. */
  const paintDither = () => {
    const l = lum.current;
    const L = layers.current;
    if (!l || !L) return;
    const ctx = L.dither.getContext("2d")!;
    const light = document.documentElement.dataset.theme === "light";
    const paper = cssColor("--bg-sunken");
    // Quiet ink: mixed towards the paper so the portrait reads as texture.
    const full = cssColor(light ? "--fg" : "--red");
    const mix = light ? 0.8 : 0.62;
    const ink = full.map((v, i) => Math.round(paper[i] + (v - paper[i]) * mix)) as RGB;
    ctx.fillStyle = `rgb(${paper.join(",")})`;
    ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = `rgb(${ink.join(",")})`;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let v = Math.pow(l[y * W + x], light ? 1.4 : 2.3);
        if (light) v = 1 - v; // dark ink on paper: shadows get the dots
        if (v > BAYER[(y % 4) * 4 + (x % 4)]) ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
      }
    }
  };

  /**
   * One frame of the reveal ("lock-on").
   *   0 → LOCK   brackets close in from the frame corners onto the face, a crosshair appears,
   *              and they flicker as they lock
   *   LOCK → 1   the photo opens outward from the face; its edge is a ring of halftone dots that
   *              swell into the photo, with a faint red scan ring; the brackets fade
   *   1          the crisp <img> takes over
   */
  const render = (p: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    const L = layers.current;
    if (!ctx || !L) return;
    const red = cssColor("--red").join(",");
    const fx = FACE.x * CW;
    const fy = FACE.y * CH;

    ctx.drawImage(L.dither, 0, 0);

    // ── the reveal: a solid disc plus halftone dots, used as a mask over the photo
    const open = easeInOut(clamp01((p - LOCK) / (1 - LOCK)));
    if (open > 0) {
      const far = Math.max(Math.hypot(fx, fy), Math.hypot(CW - fx, fy), Math.hypot(fx, CH - fy), Math.hypot(CW - fx, CH - fy));
      const r = open * (far + BAND);
      const m = L.mask.getContext("2d")!;
      m.clearRect(0, 0, CW, CH);
      m.fillStyle = "#000";
      if (r > BAND) {
        m.beginPath();
        m.arc(fx, fy, r - BAND, 0, Math.PI * 2);
        m.fill();
      }
      // halftone edge: dots grow from nothing at the outer edge to touching at the inner edge
      m.beginPath();
      for (let gy = DOT / 2; gy < CH; gy += DOT) {
        for (let gx = DOT / 2; gx < CW; gx += DOT) {
          const d = Math.hypot(gx - fx, gy - fy);
          if (d > r || d < r - BAND) continue;
          const rad = ((r - d) / BAND) * DOT * 0.75;
          if (rad < 0.4) continue;
          m.moveTo(gx + rad, gy);
          m.arc(gx, gy, rad, 0, Math.PI * 2);
        }
      }
      m.fill();

      const k = L.masked.getContext("2d")!;
      k.globalCompositeOperation = "source-over";
      k.clearRect(0, 0, CW, CH);
      k.drawImage(L.photo, 0, 0);
      k.globalCompositeOperation = "destination-in";
      k.drawImage(L.mask, 0, 0);
      ctx.drawImage(L.masked, 0, 0);

      // faint red scan ring riding the edge
      if (p < 0.98) {
        ctx.strokeStyle = `rgba(${red},${0.55 * (1 - open)})`;
        ctx.lineWidth = SCALE;
        ctx.beginPath();
        ctx.arc(fx, fy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // ── lock-on brackets: from the frame corners onto the face box
    const close = easeOut(clamp01(p / LOCK));
    const alpha = clamp01(p / 0.08) * (1 - clamp01((p - 0.7) / 0.25));
    const flicker = p > LOCK && p < LOCK + 0.07 && Math.floor(p * 140) % 2 === 0;
    if (alpha > 0 && !flicker) {
      const inset = 7;
      const bx0 = lerp(inset, fx - (FACE.w * CW) / 2, close);
      const by0 = lerp(inset, fy - (FACE.h * CH) / 2, close);
      const bx1 = lerp(CW - inset, fx + (FACE.w * CW) / 2, close);
      const by1 = lerp(CH - inset, fy + (FACE.h * CH) / 2, close);
      const arm = lerp(22, 14, close);
      const t = SCALE;
      ctx.fillStyle = `rgba(${red},${alpha})`;
      const corners: [number, number, number, number][] = [[bx0, by0, 1, 1], [bx1, by0, -1, 1], [bx0, by1, 1, -1], [bx1, by1, -1, -1]];
      for (const [x, y, sx, sy] of corners) {
        ctx.fillRect(sx > 0 ? x : x - arm, sy > 0 ? y : y - t, arm, t);
        ctx.fillRect(sx > 0 ? x : x - t, sy > 0 ? y : y - arm, t, arm);
      }
      // crosshair on the face while locking
      const cross = clamp01((p - 0.14) / 0.1) * (1 - clamp01((p - LOCK - 0.12) / 0.12));
      if (cross > 0) {
        ctx.fillStyle = `rgba(${red},${alpha * cross})`;
        ctx.fillRect(fx - 7, fy - t / 2, 5, t);
        ctx.fillRect(fx + 2, fy - t / 2, 5, t);
        ctx.fillRect(fx - t / 2, fy - 7, t, 5);
        ctx.fillRect(fx - t / 2, fy + 2, t, 5);
      }
    }

    if (photoRef.current) photoRef.current.style.opacity = p >= 0.99 ? "1" : "0";
  };

  const animate = () => {
    cancelAnimationFrame(raf.current);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const goingIn = target.current > progress.current;
      const step = reduced ? 1 : dt / (goingIn ? IN_MS : OUT_MS);
      progress.current = goingIn
        ? Math.min(target.current, progress.current + step)
        : Math.max(target.current, progress.current - step);
      render(progress.current);
      if (progress.current !== target.current) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const setReveal = (on: boolean) => {
    if (status !== "ready") return;
    setRevealed(on);
    target.current = on ? 1 : 0;
    animate();
  };

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      // luminance at the dither grid, normalised with a contrast stretch
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const cctx = c.getContext("2d", { willReadFrequently: true })!;
      const { sx, sy, sw, sh } = coverCrop(image);
      cctx.drawImage(image, sx, sy, sw, sh, 0, 0, W, H);
      const px = cctx.getImageData(0, 0, W, H).data;
      const out = new Float32Array(W * H);
      let min = 255, max = 0;
      for (let i = 0; i < W * H; i++) {
        const v = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
        out[i] = v;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      for (let i = 0; i < out.length; i++) out[i] = (out[i] - min) / Math.max(1, max - min);
      lum.current = out;

      const L: Layers = { dither: layer(), photo: layer(), mask: layer(), masked: layer() };
      const pctx = L.photo.getContext("2d")!;
      pctx.imageSmoothingEnabled = true;
      pctx.drawImage(image, sx, sy, sw, sh, 0, 0, CW, CH);
      layers.current = L;
      paintDither();
      render(progress.current);
      setStatus("ready");
    };
    image.onerror = () => setStatus("missing");
    image.src = SRC;

    // Redraw in the new colours when the theme changes (after the CSS vars update).
    const off = onThemeChange(() =>
      requestAnimationFrame(() => {
        paintDither();
        render(progress.current);
      })
    );
    return () => {
      off();
      cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <figure className="photo-frame" onMouseEnter={() => setReveal(true)} onMouseLeave={() => setReveal(false)}>
      <button
        type="button"
        className="photo-inner corners block"
        onClick={() => setReveal(!revealed)}
        aria-pressed={revealed}
        aria-label={revealed ? "Show dithered portrait" : `Show photo of ${profile.fullName}`}
      >
        {status === "missing" ? (
          <span className="absolute inset-0 grid place-items-center label">Add profile-photo.jpg to /public</span>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              width={CW}
              height={CH}
              className="absolute inset-0 w-full h-full [image-rendering:pixelated]"
              aria-hidden
            />
            {/* Crisp photo takes over once the reveal completes. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={photoRef}
              src={SRC}
              alt={profile.fullName}
              className="absolute inset-0 w-full h-full object-cover object-[50%_30%] transition-opacity duration-150"
              style={{ opacity: 0 }}
            />
            {/* the lock-on's last beat */}
            <span
              className={`absolute left-2 bottom-2 label px-1.5 py-0.5 bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] transition-opacity ${
                revealed ? "opacity-100 duration-200 delay-[850ms]" : "opacity-0 duration-100"
              }`}
              aria-hidden
            >
              <span className="text-[var(--red)]">検</span> · verified
            </span>
          </>
        )}
      </button>
      <figcaption className="mt-2.5 flex items-baseline justify-between">
        <span className="label">Portrait</span>
        <span className="label">
          {revealed ? (
            profile.name
          ) : (
            <>
              <span className="hover-only">Hover to reveal</span>
              <span className="touch-only">Tap to reveal</span>
            </>
          )}
        </span>
      </figcaption>
    </figure>
  );
}
