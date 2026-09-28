"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FLAGS, getSolved, onSolvedChange } from "@/lib/ctf";
import { onOpenRoom } from "@/lib/roomBus";
import { play } from "@/lib/sound";
import { onToggleTerminal } from "@/lib/terminalBus";
import { getVisitor, type Visitor } from "@/lib/visitor";
import { DeskScreen, KenDialogue, PlaqueScreen, RackScreen, VaultScreen } from "./RoomScreens";
import {
  DESK_BASE, HEIGHT, INTERACTABLES, KEN_FEET, SPAWN, TILE, WIDTH,
  drawDesk, drawRoom, findPath, inRect, makeSprites, readPalette, walkable,
  type Facing, type Interactable, type Tile,
} from "@/lib/room";

const SPEED = 62; // px per second, in room pixels
const CLOSE_MS = 220;
const KEYS: Record<string, [number, number]> = {
  w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1],
  a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0],
};

type Panel = { id: string; kind: Interactable["kind"]; index?: number };

/** The feet box (8×4 px) fits on floor tiles only. */
function canStand(x: number, y: number) {
  const pts = [[x - 4, y - 4], [x + 3, y - 4], [x - 4, y - 1], [x + 3, y - 1]];
  return pts.every(([px, py]) => walkable(Math.floor(px / TILE), Math.floor(py / TILE)));
}

export function Room() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [scale, setScale] = useState(3);
  const [prompt, setPrompt] = useState<Interactable | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [solved, setSolved] = useState(0);
  const [touch, setTouch] = useState(false);
  // phones: device screens go straight on the page, full screen (the room window's transform
  // would otherwise trap them inside its box)
  const [small, setSmall] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  // game state lives in refs so the loop never re-renders React
  const game = useRef({
    x: SPAWN.x, y: SPAWN.y, facing: "up" as Facing, walking: false, stepTime: 0, stepSound: 0,
    keys: new Set<string>(), path: [] as Tile[], pending: null as string | null, current: null as string | null,
  });
  const panelRef = useRef<Panel | null>(null);
  panelRef.current = panel;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const vaultOpen = useRef(false);

  // flags can be inserted at the vault (or the desk console): the door opens live
  useEffect(
    () =>
      onSolvedChange((ids) => {
        setSolved(ids.length);
        vaultOpen.current = ids.length >= FLAGS.length;
      }),
    []
  );

  // open from anywhere (hero button, terminal `room`); step out if the terminal opens
  useEffect(() => onOpenRoom(() => setOpen(true)), []);
  useEffect(() => onToggleTerminal((next) => next !== false && setOpen(false)), []);

  // mount on open; play the exit animation before unmounting
  useEffect(() => {
    if (open) {
      setClosing(false);
      setMounted(true);
      setVisitor(getVisitor());
      setSolved(getSolved().length);
      setTouch(window.matchMedia("(pointer: coarse)").matches);
      lastFocus.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = "hidden";
      Object.assign(game.current, { x: SPAWN.x, y: SPAWN.y, facing: "up", path: [], pending: null });
      requestAnimationFrame(() => stageRef.current?.focus({ preventScroll: true }));
      return;
    }
    if (!mounted) return;
    setClosing(true);
    setPanel(null);
    document.body.style.overflow = "";
    const t = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
      lastFocus.current?.focus?.({ preventScroll: true });
    }, CLOSE_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // pixel-perfect scale: whole numbers when there's room, fractional on small phones
  useEffect(() => {
    if (!mounted) return;
    const fit = () => {
      const s = Math.min((innerWidth - 32) / WIDTH, (innerHeight - 200) / HEIGHT);
      setScale(s >= 2 ? Math.floor(s) : Math.max(1.2, s));
      setSmall(innerWidth <= 640);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [mounted]);

  const interact = (it: Interactable) => {
    if (it.kind === "exit") return setOpen(false);
    play("select");
    setPanel({ id: it.id, kind: it.kind, index: it.index });
  };

  // keyboard
  useEffect(() => {
    if (!mounted) return;
    const g = game.current;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // typing in a device screen (console, vault): only Esc means anything to the room
      const t = e.target as HTMLElement;
      if ((t.tagName === "INPUT" || t.tagName === "TEXTAREA") && k !== "escape") return;
      // the terminal's own shortcuts: step out so it isn't hidden behind the room
      if (((e.ctrlKey || e.metaKey) && k === "k") || k === "/" || k === "`") return setOpen(false);
      if (k === "escape") {
        e.preventDefault();
        if (panelRef.current) setPanel(null);
        else setOpen(false);
        return;
      }
      if (panelRef.current) return;
      if (KEYS[k]) {
        e.preventDefault();
        g.keys.add(k);
        g.path = [];
        g.pending = null;
      } else if (k === "e" || k === "enter" || k === " ") {
        const it = INTERACTABLES.find((i) => i.id === g.current);
        if (it) {
          e.preventDefault();
          interact(it);
        }
      }
    };
    const up = (e: KeyboardEvent) => g.keys.delete(e.key.toLowerCase());
    const blur = () => g.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      g.keys.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // the game loop
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const g = game.current;
    let pal = readPalette();
    let sprites = makeSprites(pal);
    const retheme = new MutationObserver(() => {
      pal = readPalette();
      sprites = makeSprites(pal);
    });
    retheme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    vaultOpen.current = getSolved().length >= FLAGS.length;
    let raf = 0;
    let last = performance.now();
    let nextBlink = last + 2500;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // movement: keys win over tap-to-walk
      let dx = 0;
      let dy = 0;
      if (!panelRef.current) {
        g.keys.forEach((k) => {
          dx += KEYS[k]?.[0] ?? 0;
          dy += KEYS[k]?.[1] ?? 0;
        });
        if (!dx && !dy && g.path.length) {
          const next = g.path[0];
          const tx = next.c * TILE + 8;
          const ty = next.r * TILE + 12;
          const ddx = tx - g.x;
          const ddy = ty - g.y;
          if (Math.abs(ddx) < 1.5 && Math.abs(ddy) < 1.5) {
            g.x = tx;
            g.y = ty;
            g.path.shift();
          } else {
            dx = Math.abs(ddx) > 1 ? Math.sign(ddx) : 0;
            dy = Math.abs(ddy) > 1 ? Math.sign(ddy) : 0;
          }
        }
      }
      g.walking = !!(dx || dy);
      if (g.walking) {
        const len = Math.hypot(dx, dy);
        const step = (SPEED * dt) / len;
        if (canStand(g.x + dx * step, g.y)) g.x += dx * step;
        if (canStand(g.x, g.y + dy * step)) g.y += dy * step;
        g.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
        g.stepTime += dt;
        if (now - g.stepSound > 300) {
          g.stepSound = now;
          play("step");
        }
      } else g.stepTime = 0;

      // what's in reach
      const feet = { c: Math.floor(g.x / TILE), r: Math.floor((g.y - 1) / TILE) };
      const near = INTERACTABLES.find((it) => it.zones.some((z) => inRect(feet, z))) ?? null;
      if ((near?.id ?? null) !== g.current) {
        g.current = near?.id ?? null;
        setPrompt(near);
      }
      if (g.pending && !g.path.length) {
        const it = INTERACTABLES.find((i) => i.id === g.pending);
        g.pending = null;
        if (it && near?.id === it.id) interact(it);
      }

      // draw
      drawRoom(ctx, pal, now, vaultOpen.current);
      const frame = g.walking ? 1 + (Math.floor(g.stepTime / 0.14) % 2) : 0;
      const me = sprites.operator[g.facing][frame];
      if (now > nextBlink + 140) nextBlink = now + 2500 + Math.random() * 3000;
      const ken = now > nextBlink ? sprites.ken.blink : Math.floor(now / 900) % 2 ? sprites.ken.breathe : sprites.ken.idle;
      // depth sort: whatever stands lower on screen is drawn in front (the desk included)
      const actors: { y: number; draw: () => void }[] = [
        { y: DESK_BASE, draw: () => drawDesk(ctx, pal, now) },
        ...[
          { img: ken, x: KEN_FEET.x, y: KEN_FEET.y },
          { img: me, x: Math.round(g.x), y: Math.round(g.y) },
        ].map((a) => ({ y: a.y, draw: () => ctx.drawImage(a.img, Math.round(a.x - a.img.width / 2), a.y - a.img.height + 1) })),
      ];
      actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());

      // name tag follows the player (DOM, so the text stays crisp)
      const s = scaleRef.current;
      if (tagRef.current) tagRef.current.style.transform = `translate(${g.x * s}px, ${(g.y - 19) * s}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      retheme.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // tap / click to walk, or tap an object to walk up to it and use it
  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (panel) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const t = {
      c: Math.floor(((e.clientX - rect.left) / rect.width) * WIDTH / TILE),
      r: Math.floor(((e.clientY - rect.top) / rect.height) * HEIGHT / TILE),
    };
    const g = game.current;
    const from = { c: Math.floor(g.x / TILE), r: Math.floor((g.y - 1) / TILE) };
    const it = INTERACTABLES.find((i) => inRect(t, i.hit) || i.zones.some((z) => inRect(t, z)));
    if (it && it.zones.some((z) => inRect(from, z))) return interact(it);
    const dest = it ? it.target : t;
    const path = findPath(from, dest);
    if (path) {
      g.path = path;
      g.pending = it?.id ?? null;
    }
  };

  if (!mounted) return null;

  const closePanel = () => {
    play("back");
    setPanel(null);
    requestAnimationFrame(() => stageRef.current?.focus({ preventScroll: true }));
  };

  const screen =
    panel?.kind === "rack" ? <RackScreen index={panel.index ?? 0} onClose={closePanel} />
    : panel?.kind === "desk" ? <DeskScreen user={visitor?.name ?? "guest"} onClose={closePanel} />
    : panel?.kind === "plaques" ? <PlaqueScreen onClose={closePanel} />
    : panel?.kind === "vault" ? <VaultScreen onClose={closePanel} />
    : panel?.kind === "ken" ? <KenDialogue visitor={visitor?.name ?? "there"} onClose={closePanel} />
    : null;

  return (
    <>
      <div
        className={`term-backdrop fixed inset-0 z-[63] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-sm ${closing ? "closing" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Server room"
        className={`term-window fixed z-[64] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-3 ${closing ? "closing" : ""}`}
      >
        <div className="flex items-center gap-3" style={{ width: WIDTH * scale }}>
          <span className="kanji text-[14px] text-[var(--red)] tracking-normal" lang="ja">
            検
          </span>
          <span className="label text-[var(--fg-muted)]">Server room</span>
          <span className="label hidden sm:inline ml-3">
            {touch ? "tap to walk · tap things to use them" : "wasd / arrows · e to use · esc to leave"}
          </span>
          <button type="button" onClick={() => setOpen(false)} className="ml-auto label hover:text-[var(--red)] transition-colors">
            Leave ✕
          </button>
        </div>

        <div
          ref={stageRef}
          tabIndex={-1}
          className="relative panel corners outline-none overflow-hidden"
          style={{ width: WIDTH * scale, height: HEIGHT * scale }}
        >
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            onPointerDown={onPointer}
            className="absolute inset-0 w-full h-full [image-rendering:pixelated] cursor-pointer touch-none"
            aria-label="A small pixel server room. Racks are projects, the desk opens the terminal, the plaques are credentials and the vault opens once all five CTF flags are found."
          />

          {/* name tag over the player (positioned by the game loop, in screen px so it stays crisp) */}
          <div ref={tagRef} className="absolute left-0 top-0 pointer-events-none will-change-transform">
            {visitor && (
              <span className="absolute -translate-x-1/2 -translate-y-full whitespace-nowrap font-mono text-[10px] leading-[1.4] text-[var(--fg)] bg-[color-mix(in_srgb,var(--bg)_75%,transparent)] px-1">
                {visitor.name} <span className="text-[var(--fg-dim)]">· {visitor.device}</span>
              </span>
            )}
          </div>

          {prompt && !panel && (
            <button
              type="button"
              onClick={() => interact(prompt)}
              className="absolute left-1/2 bottom-3 -translate-x-1/2 btn bg-[var(--bg-panel)]"
            >
              <kbd className="kbd">{touch ? "tap" : "E"}</kbd> {prompt.prompt}
            </button>
          )}

          {/* everything you use opens here, inside the room (full screen on phones) */}
          {screen && (small ? createPortal(screen, document.body) : screen)}
        </div>

        <div className="flex items-center justify-between gap-4" style={{ width: WIDTH * scale }}>
          <span className="label">
            flags {solved}/{FLAGS.length} · vault {solved >= FLAGS.length ? "open" : "locked"}
          </span>
          <span className="label">you&apos;re {visitor?.name}</span>
        </div>
      </div>
    </>
  );
}
