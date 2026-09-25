"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const HEX_CHARS = "0123456789abcdef";

function randomHex(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += HEX_CHARS[(Math.random() * 16) | 0];
  return s;
}

export function PhotoFrame() {
  const [hovered, setHovered] = useState(false);
  const [hexLines, setHexLines] = useState<string[]>([]);
  const [scanY, setScanY] = useState(0);
  const [imgError, setImgError] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Generate hex overlay data
  useEffect(() => {
    const lines: string[] = [];
    for (let i = 0; i < 12; i++) {
      const addr = (0x0040 + i * 16).toString(16).padStart(4, "0");
      lines.push(`0x${addr}  ${randomHex(8)} ${randomHex(8)}`);
    }
    setHexLines(lines);
  }, []);

  // Scan line animation
  useEffect(() => {
    let start = 0;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      setScanY((elapsed * 0.03) % 100);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const hasPhoto = !imgError;

  return (
    <div
      ref={frameRef}
      className="photo-frame-wrapper"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Outer reticle corners */}
      <div className="reticle-corner reticle-tl" />
      <div className="reticle-corner reticle-tr" />
      <div className="reticle-corner reticle-bl" />
      <div className="reticle-corner reticle-br" />

      {/* Scanning border animation */}
      <div className="scan-border" />

      {/* Main photo container */}
      <div className="photo-inner">
        {/* Image or placeholder */}
        {hasPhoto ? (
          <Image
            src="/profile-photo.jpg"
            alt="Ken"
            fill
            className={`object-cover transition-all duration-700 ${
              hovered ? "scale-105 brightness-110" : "scale-100 brightness-90"
            }`}
            onError={() => setImgError(true)}
            sizes="(max-width: 768px) 100vw, 280px"
            priority
          />
        ) : (
          <div className="placeholder-avatar">
            <svg viewBox="0 0 80 80" className="w-16 h-16 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="40" cy="28" r="14" />
              <path d="M12 72c0-15.5 12.5-28 28-28s28 12.5 28 28" />
            </svg>
            <span className="font-mono text-[9px] text-[var(--fg-muted)] mt-2 tracking-wider uppercase">
              Add profile-photo.jpg to /public
            </span>
          </div>
        )}

        {/* Hex data overlay — fades on hover */}
        <div
          className={`hex-overlay transition-opacity duration-500 ${
            hovered ? "opacity-0" : "opacity-70"
          }`}
        >
          {hexLines.map((line, i) => (
            <div
              key={i}
              className="font-mono text-[8px] leading-[1.6] text-[var(--accent)] whitespace-pre"
              style={{ opacity: 0.3 + (i / hexLines.length) * 0.4 }}
            >
              {line}
            </div>
          ))}
        </div>

        {/* Moving scan line */}
        <div
          className="scan-line"
          style={{ top: `${scanY}%` }}
        />

        {/* Glitch layers on hover */}
        {hovered && hasPhoto && (
          <>
            <div className="glitch-layer glitch-r" />
            <div className="glitch-layer glitch-b" />
          </>
        )}
      </div>

      {/* Status bar below photo */}
      <div className="photo-status">
        <span className="flex items-center gap-1.5">
          <span className="sec-dot" />
          <span>identity verified</span>
        </span>
        <span className="text-[var(--fg-muted)]">
          {hasPhoto ? "img.encrypted" : "awaiting upload"}
        </span>
      </div>
    </div>
  );
}
