// The server room: a small top-down pixel room drawn in code (no image files).
// Racks are projects, the desk opens the terminal, the plaques are credentials, the vault
// opens at 5/5 CTF flags, and Ken stands in the corner.

export const TILE = 16;

// W wall · . floor · R rack · D desk · P plaques (on the wall) · V vault door (in the wall) · K Ken
export const MAP = [
  "WWWWWWWWWWWVVWW",
  "WWWWWWWPPPWVVWW",
  "W.R.R.R.......W",
  "W.R.R.R.......W",
  "W.............W",
  "W.............W",
  "W.............W",
  "W.DDD......K..W",
  "W.............W",
  "WWWWWWW.WWWWWWW",
];
export const COLS = MAP[0].length;
export const ROWS = MAP.length;
export const WIDTH = COLS * TILE;
export const HEIGHT = ROWS * TILE;

const tileAt = (c: number, r: number) => MAP[r]?.[c] ?? "W";
export const walkable = (c: number, r: number) => tileAt(c, r) === ".";

export type Tile = { c: number; r: number };
export type Rect = { c: number; r: number; w: number; h: number };
export type Kind = "rack" | "desk" | "plaques" | "vault" | "ken" | "exit";
export type Interactable = {
  id: string;
  kind: Kind;
  index?: number;
  prompt: string;
  zones: Rect[]; // stand here to interact
  target: Tile; // where tap-to-walk goes
  hit: Rect; // tapping these tiles picks it
};

const rack = (i: number, c: number): Interactable => ({
  id: `rack-${i}`,
  kind: "rack",
  index: i,
  prompt: "inspect rack",
  zones: [{ c, r: 4, w: 1, h: 1 }],
  target: { c, r: 4 },
  hit: { c, r: 1, w: 1, h: 3 },
});

export const INTERACTABLES: Interactable[] = [
  rack(0, 2),
  rack(1, 4),
  rack(2, 6),
  {
    id: "desk",
    kind: "desk",
    prompt: "use terminal",
    zones: [{ c: 2, r: 6, w: 3, h: 1 }, { c: 2, r: 8, w: 3, h: 1 }],
    target: { c: 3, r: 6 },
    hit: { c: 2, r: 6, w: 3, h: 2 },
  },
  { id: "plaques", kind: "plaques", prompt: "read plaques", zones: [{ c: 7, r: 2, w: 3, h: 1 }], target: { c: 8, r: 2 }, hit: { c: 7, r: 1, w: 3, h: 1 } },
  { id: "vault", kind: "vault", prompt: "open vault", zones: [{ c: 11, r: 2, w: 2, h: 1 }], target: { c: 11, r: 2 }, hit: { c: 11, r: 0, w: 2, h: 2 } },
  { id: "ken", kind: "ken", prompt: "talk to Ken", zones: [{ c: 10, r: 6, w: 3, h: 3 }], target: { c: 10, r: 7 }, hit: { c: 11, r: 6, w: 1, h: 2 } },
  { id: "exit", kind: "exit", prompt: "leave room", zones: [{ c: 7, r: 8, w: 1, h: 2 }], target: { c: 7, r: 9 }, hit: { c: 7, r: 9, w: 1, h: 1 } },
];

export const inRect = (t: Tile, z: Rect) => t.c >= z.c && t.c < z.c + z.w && t.r >= z.r && t.r < z.r + z.h;
export const KEN_FEET = { x: 11 * TILE + 8, y: 8 * TILE - 1 };
/** Where the desk meets the floor: characters above this line are behind it. */
export const DESK_BASE = 7 * TILE + 15;

/** The desk and its terminal monitor, drawn with the characters so depth sorts correctly. */
export function drawDesk(ctx: CanvasRenderingContext2D, p: Palette, time: number) {
  const x = 2 * TILE;
  const y = 7 * TILE;
  ctx.fillStyle = p.edge;
  ctx.fillRect(x + 1, y + 4, 3 * TILE - 2, 5);
  ctx.fillRect(x + 3, y + 9, 2, 6);
  ctx.fillRect(x + 3 * TILE - 5, y + 9, 2, 6);
  ctx.fillStyle = p.ink;
  ctx.fillRect(x + 14, y - 10, 21, 14);
  ctx.fillRect(x + 23, y + 4, 3, 1);
  ctx.fillStyle = p.wall;
  ctx.fillRect(x + 15, y - 9, 19, 12);
  ctx.fillStyle = p.red;
  ctx.fillRect(x + 17, y - 6, 1, 1); // ">"
  ctx.fillRect(x + 18, y - 5, 1, 1);
  ctx.fillRect(x + 17, y - 4, 1, 1);
  if (Math.floor(time / 500) % 2) ctx.fillRect(x + 20, y - 4, 3, 1); // "_"
}
export const SPAWN = { x: 7 * TILE + 8, y: 7 * TILE + 13 }; // just inside, clear of the exit

/** Shortest path over floor tiles (4 directions). Null if unreachable. */
export function findPath(from: Tile, to: Tile): Tile[] | null {
  if (!walkable(to.c, to.r)) return null;
  const key = (t: Tile) => t.r * COLS + t.c;
  const prev = new Map<number, Tile | null>([[key(from), null]]);
  const queue: Tile[] = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.c === to.c && cur.r === to.r) {
      const path: Tile[] = [];
      for (let t: Tile | null = cur; t && key(t) !== key(from); t = prev.get(key(t)) ?? null) path.unshift(t);
      return path;
    }
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { c: cur.c + dc, r: cur.r + dr };
      if (walkable(n.c, n.r) && !prev.has(key(n))) {
        prev.set(key(n), cur);
        queue.push(n);
      }
    }
  }
  return null;
}

// ── Palette (read from the site's CSS variables, so the room follows the theme) ──

export type Palette = {
  floor: string; grid: string; wall: string; edge: string; ink: string; dim: string; fg: string; red: string;
  outline: string; light: boolean;
};

export function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (n: string) => css.getPropertyValue(n).trim();
  const light = document.documentElement.dataset.theme === "light";
  return {
    floor: v("--bg-panel"), grid: v("--line"), wall: v("--bg-sunken"), edge: v("--line-strong"),
    ink: v("--fg-muted"), dim: v("--fg-dim"), fg: v("--fg"), red: v("--red"),
    outline: light ? v("--fg") : v("--fg-muted"), light,
  };
}

// ── Sprites: small pixel grids, auto-outlined so they read on either theme ──

const OPERATOR = {
  down: [
    "...bbbb...", "..bbbbbb..", "..bbbbbb..", "..rrrrrr..", "..bbbbbb..", "...bbbb...", "..bbrrbb..",
    ".bbbbbbbb.", ".bbbbbbbb.", ".sbbbbbbs.", "..bbbbbb..",
  ],
  up: [
    "...bbbb...", "..bbbbbb..", "..bbbbbb..", "..bbbbbb..", "..bbbbbb..", "...bbbb...", "..bbrrbb..",
    ".bbbrrbbb.", ".bbbbrbbb.", ".sbbbbbbs.", "..bbbbbb..",
  ],
  right: [
    "...bbbb...", "..bbbbbb..", "..bbbbbbb.", "..bbbbrrr.", "..bbbbbbb.", "...bbbbb..", "rr.bbbrb..",
    ".rrbbbbbb.", "...bbbbbb.", "...bbbbsb.", "...bbbbb..",
  ],
};
const LEGS = {
  front: [
    ["..bb..bb..", "..bb..bb..", "..gg..gg.."],
    ["..bb.bb...", "..bb.bb...", "..gg.gg..."],
    ["...bb.bb..", "...bb.bb..", "...gg.gg.."],
  ],
  side: [
    ["...bb.bb..", "...bb.bb..", "...gg.gg.."],
    ["...bbbb...", "..bb..bb..", "..gg...gg."],
    ["....bbb...", "....bbb...", "....ggg..."],
  ],
};

const KEN = [
  "..h.h..h.h..", ".hhhhhhhhhh.", "hhhhhhhhhhhh", "rhhssssssshr", "rhsesssseshr", "rhsssssssshr",
  "..ssssssss..", "....ssss....", "..cccwwccc..", ".ccccwwcccc.", "cccccwwccccc", "ccrccwwccrcc",
  "sccccccccccs", ".cccccccccc.", ".cccc..cccc.", "..cc....cc..", "..cc....cc..", ".ggg....ggg.",
];

function colours(p: Palette): Record<string, string> {
  return {
    b: p.light ? "#34333a" : "#2c2c34",
    c: p.light ? "#2a292f" : "#22222a",
    h: "#141418",
    s: "#d9b391",
    e: "#141418",
    w: "#e6e2dc",
    g: p.light ? "#55545c" : "#4a4a55",
    r: p.red,
  };
}

/** Draws a pixel grid into a canvas with a 1px outline around it. */
function sprite(rows: string[], p: Palette, mirror = false): HTMLCanvasElement {
  const h = rows.length;
  const w = rows[0].length;
  const pal = colours(p);
  const cv = document.createElement("canvas");
  cv.width = w + 2;
  cv.height = h + 2;
  const ctx = cv.getContext("2d")!;
  const filled = (x: number, y: number) => y >= 0 && y < h && x >= 0 && x < w && rows[y][mirror ? w - 1 - x : x] !== ".";
  for (let y = -1; y <= h; y++) {
    for (let x = -1; x <= w; x++) {
      if (filled(x, y)) {
        ctx.fillStyle = pal[rows[y][mirror ? w - 1 - x : x]] ?? pal.b;
        ctx.fillRect(x + 1, y + 1, 1, 1);
      } else if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) {
        ctx.fillStyle = p.outline;
        ctx.fillRect(x + 1, y + 1, 1, 1);
      }
    }
  }
  return cv;
}

export type Facing = "down" | "up" | "left" | "right";
export type Sprites = {
  operator: Record<Facing, HTMLCanvasElement[]>; // [stand, stepA, stepB]
  ken: { idle: HTMLCanvasElement; breathe: HTMLCanvasElement; blink: HTMLCanvasElement };
};

export function makeSprites(p: Palette): Sprites {
  const body = (top: string[], legs: string[][]) => legs.map((l) => [...top, ...l]);
  const frames = (top: string[], legs: string[][], mirror = false) => body(top, legs).map((rows) => sprite(rows, p, mirror));
  // breathing: the upper body sinks a pixel on the out-breath
  const breathe = [".".repeat(12), ...KEN.slice(0, 13), ...KEN.slice(14)];
  const blink = KEN.map((row) => row.replaceAll("e", "s"));
  return {
    operator: {
      down: frames(OPERATOR.down, LEGS.front),
      up: frames(OPERATOR.up, LEGS.front),
      right: frames(OPERATOR.right, LEGS.side),
      left: frames(OPERATOR.right, LEGS.side, true),
    },
    ken: { idle: sprite(KEN, p), breathe: sprite(breathe, p), blink: sprite(blink, p) },
  };
}

// ── The room itself ──

// Deterministic flicker for rack LEDs, so each one blinks on its own rhythm.
const led = (seed: number, time: number) => {
  const period = 260 + (seed * 97) % 540;
  const n = Math.floor(time / period) * 31 + seed * 17;
  return (n * 2654435761) % 7 > 2;
};

export function drawRoom(ctx: CanvasRenderingContext2D, p: Palette, time: number, vaultOpen: boolean) {
  // floor and walls
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = tileAt(c, r);
      ctx.fillStyle = t === "W" || t === "V" || t === "P" ? p.wall : p.floor;
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
    }
  }
  ctx.fillStyle = p.grid;
  for (let c = 1; c < COLS - 1; c++) ctx.fillRect(c * TILE, 2 * TILE, 1, 7 * TILE);
  for (let r = 3; r < ROWS - 1; r++) ctx.fillRect(TILE, r * TILE, (COLS - 2) * TILE, 1);

  // top wall: panel seams, a red baseline and the 検 mark
  ctx.fillStyle = p.edge;
  for (let c = 1; c < COLS - 1; c += 2) ctx.fillRect(c * TILE, 4, 1, 2 * TILE - 6);
  ctx.fillRect(TILE, 2 * TILE - 1, (COLS - 2) * TILE, 1);
  ctx.fillStyle = p.red;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(TILE, 2 * TILE - 2, (COLS - 2) * TILE, 1);
  ctx.globalAlpha = 1;
  ctx.fillStyle = p.red;
  ctx.font = "11px serif";
  ctx.textBaseline = "top";
  ctx.fillText("検", 3 * TILE + 11, 11);

  // side and bottom wall edges
  ctx.fillStyle = p.edge;
  ctx.fillRect(TILE - 1, 2 * TILE, 1, 7 * TILE);
  ctx.fillRect((COLS - 1) * TILE, 2 * TILE, 1, 7 * TILE);
  ctx.fillRect(TILE, 9 * TILE, 6 * TILE, 1);
  ctx.fillRect(8 * TILE, 9 * TILE, 6 * TILE, 1);

  // exit: chevrons on the floor
  ctx.fillStyle = p.red;
  ctx.globalAlpha = 0.25 + 0.25 * Math.sin(time / 300);
  for (let i = 0; i < 2; i++) {
    const y = 8 * TILE + 4 + i * 5;
    ctx.fillRect(7 * TILE + 5, y, 2, 1);
    ctx.fillRect(7 * TILE + 9, y, 2, 1);
    ctx.fillRect(7 * TILE + 7, y + 1, 2, 1);
  }
  ctx.globalAlpha = 1;

  // racks (projects)
  [2, 4, 6].forEach((c, i) => {
    const x = c * TILE + 2;
    const top = 2 * TILE - 10;
    ctx.fillStyle = p.edge;
    ctx.fillRect(x - 1, top - 1, 14, 2 * TILE + 11);
    ctx.fillStyle = p.wall;
    ctx.fillRect(x, top, 12, 2 * TILE + 9);
    for (let u = 0; u < 7; u++) {
      const y = top + 2 + u * 5;
      ctx.fillStyle = p.grid;
      ctx.fillRect(x + 1, y + 3, 10, 1);
      ctx.fillStyle = led(i * 10 + u, time) ? p.red : p.dim;
      ctx.fillRect(x + 8, y + 1, 1, 1);
      ctx.fillStyle = led(i * 10 + u + 5, time + 130) ? p.ink : p.grid;
      ctx.fillRect(x + 10, y + 1, 1, 1);
    }
  });

  // (the desk is drawn separately by drawDesk, depth-sorted with the characters)

  // plaques (credentials) on the wall
  for (let i = 0; i < 3; i++) {
    const x = (7 + i) * TILE + 3;
    const y = TILE + 1;
    ctx.fillStyle = p.ink;
    ctx.fillRect(x, y, 10, 12);
    ctx.fillStyle = p.wall;
    ctx.fillRect(x + 1, y + 1, 8, 8);
    ctx.fillStyle = p.dim;
    ctx.fillRect(x + 3, y + 3, 4, 1);
    ctx.fillRect(x + 3, y + 5, 3, 1);
    ctx.fillStyle = p.red;
    ctx.fillRect(x + 4, y + 10, 2, 3);
  }

  // vault door
  {
    const x = 11 * TILE;
    const y = 1;
    ctx.fillStyle = p.ink;
    ctx.fillRect(x + 1, y, 2 * TILE - 2, 2 * TILE - 1);
    if (vaultOpen) {
      ctx.fillStyle = "#000";
      ctx.fillRect(x + 3, y + 2, 2 * TILE - 6, 2 * TILE - 4);
      ctx.fillStyle = p.red;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(x + 3, y + 2 * TILE - 6, 2 * TILE - 6, 4);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = p.wall;
      ctx.fillRect(x + 3, y + 2, 2 * TILE - 6, 2 * TILE - 4);
      ctx.strokeStyle = p.ink;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + TILE, y + TILE - 1, 6.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = p.ink;
      ctx.fillRect(x + TILE - 6, y + TILE - 1, 12, 1);
      ctx.fillRect(x + TILE, y + TILE - 7, 1, 12);
    }
    ctx.fillStyle = vaultOpen ? p.fg : Math.floor(time / 700) % 2 ? p.red : p.dim;
    ctx.fillRect(x + 2 * TILE - 6, y + 3, 2, 2);
  }
}
