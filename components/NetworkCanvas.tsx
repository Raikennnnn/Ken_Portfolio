"use client";

import { useEffect, useRef, useState } from "react";

/**
 * NETWORK TOPOLOGY CANVAS
 *
 * Renders a background canvas with clustered nodes connected by lines,
 * simulating a network topology. Nodes gently drift and respond to the cursor.
 * Hub nodes pulse and have longer connection ranges.
 */

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  pulse: number;
  type: "hub" | "node";
}

const NODE_COUNT = 50;
const CLUSTERS = [
  { cx: 0.2, cy: 0.3, r: 0.15 },
  { cx: 0.7, cy: 0.25, r: 0.12 },
  { cx: 0.5, cy: 0.65, r: 0.18 },
  { cx: 0.85, cy: 0.7, r: 0.1 },
];

export function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const nodesRef = useRef<Node[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let animId: number;

    // Initialize nodes in clusters
    if (nodesRef.current.length === 0) {
      for (let i = 0; i < NODE_COUNT; i++) {
        const cluster = CLUSTERS[i % CLUSTERS.length];
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * cluster.r;
        nodesRef.current.push({
          x: (cluster.cx + Math.cos(angle) * dist) * w,
          y: (cluster.cy + Math.sin(angle) * dist) * h,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          r: Math.random() * 2 + 1,
          pulse: Math.random() * Math.PI * 2,
          type: Math.random() > 0.8 ? "hub" : "node",
        });
      }
    }

    const nodes = nodesRef.current;

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);

    // Accent color
    const accentRGB: [number, number, number] = [34, 211, 238]; // cyan fallback

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      const [ar, ag, ab] = accentRGB;
      const mouse = mouseRef.current;

      // Update nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;

        // Cursor influence
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          n.vx += dx * 0.00005;
          n.vy += dy * 0.00005;
        }

        // Soft wrap
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;

        n.vx *= 0.998;
        n.vy *= 0.998;
        n.pulse += 0.02;
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist =
            nodes[i].type === "hub" || nodes[j].type === "hub" ? 180 : 100;

          if (dist < maxDist) {
            const alpha = 0.08 * (1 - dist / maxDist);
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.strokeStyle = `rgba(${ar},${ag},${ab},${alpha})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        const pulseScale =
          n.type === "hub" ? 1 + Math.sin(n.pulse) * 0.3 : 1;
        const radius = n.r * pulseScale;
        const alpha = n.type === "hub" ? 0.6 : 0.3;

        ctx!.beginPath();
        ctx!.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${ar},${ag},${ab},${alpha})`;
        ctx!.fill();

        if (n.type === "hub") {
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, radius + 4, 0, Math.PI * 2);
          ctx!.strokeStyle = `rgba(${ar},${ag},${ab},0.08)`;
          ctx!.lineWidth = 1;
          ctx!.stroke();
        }
      }

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.6 }}
      aria-hidden
    />
  );
}
