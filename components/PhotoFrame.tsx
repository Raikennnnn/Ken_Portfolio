"use client";

import { useEffect, useRef, useState } from "react";

const SRC = "/profile-photo.jpg";
const W = 132; // dither resolution (3:4)
const H = 176;

// 4×4 Bayer matrix, normalised to 0..1
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

/** Draws the photo as an ordered-dither in the accent colour — the "encrypted" state. */
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
      const n = Math.pow((lum[i] - min) / Math.max(1, max - min), 1.7);
      const on = n > BAYER[(y % 4) * 4 + (x % 4)];
      // on → accent cyan, off → terminal background
      px[i * 4] = on ? 28 : 10;
      px[i * 4 + 1] = on ? 178 : 10;
      px[i * 4 + 2] = on ? 204 : 24;
      px[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(data, 0, 0);
}

export function PhotoFrame() {
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (canvasRef.current) ditherInto(canvasRef.current, img);
      setStatus("ready");
    };
    img.onerror = () => setStatus("missing");
    img.src = SRC;
  }, []);

  return (
    <div
      className="photo-frame-wrapper"
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
    >
      <div className="reticle-corner reticle-tl" />
      <div className="reticle-corner reticle-tr" />
      <div className="reticle-corner reticle-bl" />
      <div className="reticle-corner reticle-br" />
      <div className="scan-border" />

      <button
        type="button"
        className="photo-inner block w-full"
        onClick={() => setRevealed((r) => !r)}
        aria-pressed={revealed}
        aria-label={revealed ? "Hide photo of Ken" : "Decrypt photo of Ken"}
      >
        {status === "missing" ? (
          <div className="placeholder-avatar">
            <span className="font-mono text-[9px] text-[var(--fg-muted)] tracking-wider uppercase">
              Add profile-photo.jpg to /public
            </span>
          </div>
        ) : (
          <>
            {/* Encrypted (dithered) layer */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full [image-rendering:pixelated]"
              aria-hidden
            />
            {/* Decrypted layer — wipes in from the top */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SRC}
              alt="Ken"
              className="absolute inset-0 w-full h-full object-cover object-[50%_30%] transition-[clip-path] duration-700 ease-out"
              style={{ clipPath: revealed ? "inset(0 0 0 0)" : "inset(0 0 100% 0)" }}
            />
            <div className="scan-line" />
          </>
        )}
      </button>

      <div className="photo-status">
        <span className="flex items-center gap-1.5">
          <span className="sec-dot" />
          <span>{revealed ? "identity verified" : "identity encrypted"}</span>
        </span>
        <span className="text-[var(--fg-muted)]">
          {status === "missing" ? "awaiting upload" : revealed ? "decrypted" : "hover to decrypt"}
        </span>
      </div>
    </div>
  );
}
