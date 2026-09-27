"use client";

import { useEffect, useRef, useState } from "react";
import { onThemeChange } from "@/lib/theme";

const SRC = "/profile-photo.jpg";
const W = 132; // dither resolution (3:4)
const H = 176;

// 4×4 Bayer matrix, normalised to 0..1
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

function cssColor(name: string): [number, number, number] {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace("#", "");
  const n = parseInt(hex.length === 3 ? hex.replace(/./g, "$&$&") : hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Ordered-dither portrait in the theme's ink and paper colours. */
function ditherInto(canvas: HTMLCanvasElement, img: HTMLImageElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  canvas.width = W;
  canvas.height = H;

  // cover-crop to 3:4
  const srcRatio = img.width / img.height;
  const dstRatio = W / H;
  let sw = img.width, sh = img.height, sx = 0, sy = 0;
  if (srcRatio > dstRatio) {
    sw = img.height * dstRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / dstRatio;
    sy = (img.height - sh) * 0.3;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

  const light = document.documentElement.dataset.theme === "light";
  const paper = cssColor("--bg-sunken");
  // Keep it quiet: the ink is mixed toward the paper so the portrait reads as texture, not a red block.
  const full = cssColor(light ? "--fg" : "--red");
  const mix = light ? 0.8 : 0.62;
  const ink = full.map((v, i) => Math.round(paper[i] + (v - paper[i]) * mix)) as [number, number, number];

  const data = ctx.getImageData(0, 0, W, H);
  const px = data.data;
  // luminance with a contrast curve so the face reads at low resolution
  let min = 255, max = 0;
  const lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const l = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    lum[i] = l;
    if (l < min) min = l;
    if (l > max) max = l;
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let n = Math.pow((lum[i] - min) / Math.max(1, max - min), light ? 1.4 : 2.3);
      if (light) n = 1 - n; // dark ink on paper: shadows get the dots
      const c = n > BAYER[(y % 4) * 4 + (x % 4)] ? ink : paper;
      px[i * 4] = c[0];
      px[i * 4 + 1] = c[1];
      px[i * 4 + 2] = c[2];
      px[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(data, 0, 0);
}

export function PhotoFrame() {
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      if (canvasRef.current) ditherInto(canvasRef.current, img);
      setStatus("ready");
    };
    img.onerror = () => setStatus("missing");
    img.src = SRC;

    // Redraw in the new colours when the theme changes (after the CSS vars update).
    return onThemeChange(() =>
      requestAnimationFrame(() => {
        if (canvasRef.current && imgRef.current) ditherInto(canvasRef.current, imgRef.current);
      })
    );
  }, []);

  return (
    <figure className="photo-frame" onMouseEnter={() => setRevealed(true)} onMouseLeave={() => setRevealed(false)}>
      <button
        type="button"
        className="photo-inner corners block"
        onClick={() => setRevealed((r) => !r)}
        aria-pressed={revealed}
        aria-label={revealed ? "Show dithered portrait" : "Show photo of Ken"}
      >
        {status === "missing" ? (
          <span className="absolute inset-0 grid place-items-center label">Add profile-photo.jpg to /public</span>
        ) : (
          <>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full [image-rendering:pixelated]" aria-hidden />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SRC}
              alt="Ken"
              className="absolute inset-0 w-full h-full object-cover object-[50%_30%] transition-[clip-path] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ clipPath: revealed ? "inset(0 0 0 0)" : "inset(0 0 100% 0)" }}
            />
            {!revealed && <div className="scan-line" />}
          </>
        )}
      </button>
      <figcaption className="mt-2.5 flex items-baseline justify-between">
        <span className="label">Portrait</span>
        <span className="label">{revealed ? "Ken" : "Hover to reveal"}</span>
      </figcaption>
    </figure>
  );
}
