// The theme switch: the screen "breaks", then rebuilds in the other theme (~1.6 s).
// ("I build systems, then I test how they break.")
//   1. break    strips tear sideways, red glitch lines slash across, the first corrupted
//               blocks of the new theme appear
//   2. resolve  blocks of the new theme spread in a dithered, data-corruption pattern while
//               the tearing calms down
//   3. settle   the last blocks fill in and everything snaps still
// Deliberately choppy (20 fps). Photosensitivity: the new theme only ever spreads, it never
// flickers back, so there's no large dark/light flashing; only small strips and lines flicker.
// Runs on the View Transition pseudo-elements once the snapshots are ready.

const PX = 4; // one cell in CSS px
const BLOCK_W = 10; // corruption block size, in cells (40×16 px)
const BLOCK_H = 4;
const DURATION = 1600;
const STEPS = 32; // 20 per second
const BREAK = 0.3; // share of the timeline before the new theme starts spreading
const SETTLE = 0.88; // fully resolved and still by here

// 4×4 Bayer matrix, normalised to 0..1
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);
const snap = (v: number) => Math.round(v / PX) * PX;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** How much of the new theme is showing at time t (0..1): a trickle while breaking, then it spreads. */
const coverageAt = (t: number) => (t < BREAK ? 0.06 * (t / BREAK) : smooth(clamp01((t - BREAK) / (SETTLE - BREAK))));
/** How violent the tearing is at time t: builds up, peaks as it starts resolving, calms to 0. */
const chaosAt = (t: number) => (t < BREAK ? 0.4 + 0.6 * (t / BREAK) : 1 - clamp01((t - BREAK) / (SETTLE - BREAK)));

type Masks = { key: string; masks: string[]; size: string };

/**
 * One mask image per step, built a frame at a time. Each block of the screen gets a random
 * "arrival" value; a cell is shown once coverage passes that value (with Bayer dither at the
 * block's threshold, so blocks resolve through a dot pattern). Tear strips add thin rows on top,
 * stronger with more chaos.
 */
function maskBuilder(width: number, height: number) {
  const px = Math.max(PX, Math.ceil(width / 480)); // bigger cells on huge screens keep this quick
  const cols = Math.max(1, Math.ceil(width / px)); // never 0: hidden or minimised windows report 0×0
  const rows = Math.max(1, Math.ceil(height / px));
  const bx = Math.ceil(cols / BLOCK_W);
  const by = Math.ceil(rows / BLOCK_H);
  const arrival = Float32Array.from({ length: bx * by }, () => Math.random());

  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const ctx = c.getContext("2d")!;

  const result: Masks = { key: `${width}x${height}`, masks: [], size: `${cols * px}px ${rows * px}px` };
  let s = 0;

  const step = () => {
    const t = s / STEPS;
    if (s === STEPS) {
      ctx.fillRect(0, 0, cols, rows);
    } else {
      const coverage = coverageAt(t);
      const img = ctx.createImageData(cols, rows);
      const d = img.data;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const a = arrival[Math.floor(y / BLOCK_H) * bx + Math.floor(x / BLOCK_W)];
          // how far past this block's arrival we are: <0 hidden, 0..0.12 dithering in, >0.12 solid
          const into = (coverage * 1.12 - a) / 0.12;
          if (into >= BAYER[(y % 4) * 4 + (x % 4)]) d[(y * cols + x) * 4 + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      // tear strips: thin partial rows of the new theme, more of them when it's more chaotic
      const strips = Math.round(chaosAt(t) * 7);
      for (let i = 0; i < strips; i++) {
        const w = Math.round(cols * rand(0.15, 0.6));
        ctx.fillRect(Math.round(rand(-0.1, 1) * cols), Math.round(rand(0, rows)), w, Math.round(rand(1, 3)));
      }
    }
    result.masks.push(`url(${c.toDataURL()})`);
    s++;
  };

  return { result, step, done: () => s > STEPS };
}

const viewportKey = () => `${innerWidth}x${innerHeight}`;

// Frames are prepared ahead of time, a few per idle moment, so a click starts the effect
// instantly. They're rebuilt after each use (a new pattern every time) and after a resize.
let ready: Masks | null = null;
let building: { key: string; cancel: () => void } | null = null;

function prepare() {
  if (innerWidth < 2 || innerHeight < 2) return; // hidden or minimised: the resize after it shows again rebuilds
  const key = viewportKey();
  if (ready?.key === key || building?.key === key) return;
  building?.cancel();
  const b = maskBuilder(innerWidth, innerHeight);
  let handle = 0;
  const idle =
    window.requestIdleCallback?.bind(window) ??
    ((cb: IdleRequestCallback) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 8 }), 50));
  const cancelIdle = window.cancelIdleCallback?.bind(window) ?? window.clearTimeout;
  const work = (deadline: IdleDeadline) => {
    while (!b.done() && deadline.timeRemaining() > 4) b.step();
    if (b.done()) {
      ready = b.result;
      building = null;
    } else handle = idle(work);
  };
  handle = idle(work);
  building = { key, cancel: () => cancelIdle(handle) };
}

/** Call once on the client: prepares the frames in idle time and again after resizes. */
export function initThemeScan() {
  const unused = !("startViewTransition" in document) || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (unused) return () => {};
  prepare();
  let t = 0;
  const onResize = () => {
    window.clearTimeout(t);
    t = window.setTimeout(prepare, 400);
  };
  window.addEventListener("resize", onResize);
  return () => {
    window.removeEventListener("resize", onResize);
    window.clearTimeout(t);
  };
}

function takeMasks(): Masks {
  let m = ready;
  if (m?.key !== viewportKey()) {
    // not prepared yet (or the window changed): build right now
    const b = maskBuilder(innerWidth, innerHeight);
    while (!b.done()) b.step();
    m = b.result;
  }
  ready = null;
  window.setTimeout(prepare, 2500); // after the transition, get the next (different) set ready
  return m;
}

/** Starts the sequence and returns its animations, so the caller can cancel them afterwards. */
export function playThemeScan(): Animation[] {
  const root = document.documentElement;
  const { masks, size } = takeMasks();
  const timing = { duration: DURATION, fill: "both" as const, easing: `steps(${STEPS}, end)` };

  // A random sideways jolt, sized by how chaotic this step is (and sometimes none at all).
  const jolt = (chaos: number, max: number) => (Math.random() < 0.35 + 0.5 * chaos ? snap(rand(-max, max) * chaos) : 0);
  const steps = Array.from({ length: STEPS + 1 }, (_, s) => ({ s, t: s / STEPS, chaos: s === STEPS ? 0 : chaosAt(s / STEPS) }));

  const reveal = root.animate(
    steps.map(({ s, chaos }) => ({
      maskImage: masks[s],
      maskSize: size,
      maskRepeat: "no-repeat",
      imageRendering: "pixelated",
      transform: `translateX(${jolt(chaos, 26)}px)`,
      clipPath: "inset(0)", // lifts the CSS clip that hides it until this starts
    })),
    { ...timing, pseudoElement: "::view-transition-new(root)" }
  );

  // The old screen shakes too, out of step with the new one, so the two layers tear apart.
  const shake = root.animate(
    steps.map(({ chaos }) => ({ transform: `translate(${jolt(chaos, 14)}px, ${jolt(chaos, 4)}px)` })),
    { ...timing, pseudoElement: "::view-transition-old(root)" }
  );

  // Red glitch lines slashing across at random heights and widths, calming with the chaos.
  const slash = (name: string) =>
    root.animate(
      steps.map(({ chaos }) => {
        const on = chaos > 0.05 && Math.random() < 0.3 + 0.6 * chaos;
        return {
          transform: `translate(${snap(rand(-0.3, 0.3) * innerWidth)}px, ${snap(rand(0.05, 0.95) * innerHeight)}px) scale(${rand(0.15, 0.8)}, ${Math.random() < 0.3 ? 3 : 1})`,
          opacity: on ? 1 : 0,
        };
      }),
      { ...timing, pseudoElement: `::view-transition-group(${name})` }
    );

  return [reveal, shake, slash("theme-scan-a"), slash("theme-scan-b")];
}
