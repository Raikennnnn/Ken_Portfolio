"use client";

import { useEffect, useRef, useState } from "react";
import { onThemeChange } from "@/lib/theme";
import { profile } from "@/content/data";

const SRC = "/profile-photo.jpg";
const W = 132; // dither resolution (3:4)
const H = 176;
const SCALE = 2; // canvas is drawn at 2× the dither grid
const IN_MS = 620; // reveal is slower in…
const OUT_MS = 300; // …than out

// 4×4 Bayer matrix, normalised to 0..1
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
// Pixel sizes the photo resolves through, coarse → sharp
const RESOLVE_STEPS = [16, 11, 8, 6, 4, 3, 2, 1];

type RGB = [number, number, number];

function cssColor(name: string): RGB {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace("#", "");
  const n = parseInt(hex.length === 3 ? hex.replace(/./g, "$&$&") : hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

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

export function PhotoFrame() {
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [revealed, setRevealed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);

  // Animation state lives in refs so the rAF loop never re-renders React.
  const img = useRef<HTMLImageElement | null>(null);
  const lum = useRef<Float32Array | null>(null); // normalised luminance at W×H
  const progress = useRef(0); // 0 = dithered portrait, 1 = photo
  const target = useRef(0);
  const raf = useRef(0);
  const offscreen = useRef<HTMLCanvasElement | null>(null);

  /** Draw the ordered dither at a given block size (1 = finest). */
  const drawDither = (ctx: CanvasRenderingContext2D, block: number) => {
    const l = lum.current;
    if (!l) return;
    const light = document.documentElement.dataset.theme === "light";
    const paper = cssColor("--bg-sunken");
    // Quiet ink: mixed towards the paper so the portrait reads as texture.
    const full = cssColor(light ? "--fg" : "--red");
    const mix = light ? 0.8 : 0.62;
    const ink = full.map((v, i) => Math.round(paper[i] + (v - paper[i]) * mix)) as RGB;

    ctx.fillStyle = `rgb(${paper.join(",")})`;
    ctx.fillRect(0, 0, W * SCALE, H * SCALE);
    ctx.fillStyle = `rgb(${ink.join(",")})`;
    for (let by = 0; by < H; by += block) {
      for (let bx = 0; bx < W; bx += block) {
        // average luminance of the block
        let sum = 0, n = 0;
        for (let y = by; y < Math.min(by + block, H); y++)
          for (let x = bx; x < Math.min(bx + block, W); x++) {
            sum += l[y * W + x];
            n++;
          }
        let v = Math.pow(sum / n, light ? 1.4 : 2.3);
        if (light) v = 1 - v; // dark ink on paper: shadows get the dots
        const cellX = bx / block, cellY = by / block;
        if (v > BAYER[(cellY % 4) * 4 + (cellX % 4)]) {
          ctx.fillRect(bx * SCALE, by * SCALE, block * SCALE, block * SCALE);
        }
      }
    }
  };

  /** Draw the real photo pixelated to `block` dither cells. */
  const drawPixelated = (ctx: CanvasRenderingContext2D, block: number) => {
    const image = img.current;
    if (!image) return;
    const off = (offscreen.current ??= document.createElement("canvas"));
    const w = block === 1 ? W * SCALE : Math.max(1, Math.round(W / block));
    const h = Math.max(1, Math.round((w * H) / W));
    off.width = w;
    off.height = h;
    const octx = off.getContext("2d")!;
    const { sx, sy, sw, sh } = coverCrop(image);
    octx.imageSmoothingEnabled = true;
    octx.drawImage(image, sx, sy, sw, sh, 0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, w, h, 0, 0, W * SCALE, H * SCALE);
  };

  /**
   * One frame of the reveal.
   *   0.00–0.18  dither scrambles into coarse blocks
   *   0.18–1.00  photo resolves 16px → 1px, a red scan line sweeps down
   *   1.00       crisp <img> fades in on top
   */
  const render = (p: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    if (p < 0.18) {
      const t = p / 0.18;
      drawDither(ctx, Math.max(1, Math.round(1 + t * 5)));
    } else {
      const t = easeOut((p - 0.18) / 0.82);
      const step = RESOLVE_STEPS[Math.min(RESOLVE_STEPS.length - 1, Math.floor(t * RESOLVE_STEPS.length))];
      drawPixelated(ctx, step);
      // Colour arrives with resolution: coarse pixels start in the theme's ink hue.
      const tint = Math.max(0, 1 - t / 0.65);
      if (tint > 0) {
        const light = document.documentElement.dataset.theme === "light";
        ctx.globalCompositeOperation = "color";
        ctx.globalAlpha = tint;
        ctx.fillStyle = `rgb(${cssColor(light ? "--fg" : "--red").join(",")})`;
        ctx.fillRect(0, 0, W * SCALE, H * SCALE);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }
      if (p < 0.98) {
        const red = cssColor("--red");
        const y = Math.round(t * H * SCALE);
        ctx.fillStyle = `rgba(${red.join(",")},0.55)`;
        ctx.fillRect(0, y, W * SCALE, SCALE);
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
      img.current = image;
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
      render(progress.current);
      setStatus("ready");
    };
    image.onerror = () => setStatus("missing");
    image.src = SRC;

    // Redraw in the new colours when the theme changes (after the CSS vars update).
    const off = onThemeChange(() => requestAnimationFrame(() => render(progress.current)));
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
              width={W * SCALE}
              height={H * SCALE}
              className="absolute inset-0 w-full h-full [image-rendering:pixelated]"
              aria-hidden
            />
            {/* Crisp photo takes over once the resolve reaches full resolution. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={photoRef}
              src={SRC}
              alt={profile.fullName}
              className="absolute inset-0 w-full h-full object-cover object-[50%_30%] transition-opacity duration-150"
              style={{ opacity: 0 }}
            />
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
