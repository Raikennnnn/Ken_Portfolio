// Menu sounds, synthesised with Web Audio (no audio files).
// Always starts muted on every visit; the visitor turns it on from the header or `sound on`.

export type Cue = "hover" | "select" | "back" | "on" | "step" | "sweep-light" | "sweep-dark";

const EVENT = "ken:sound";
const VOLUME = 0.5; // master; individual cues are already quiet

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
let lastHover = 0;

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = VOLUME;
    master.connect(ctx.destination);
  }
  return { ctx, out: master! };
}

export function isSoundOn() {
  return enabled;
}

export function setSound(on: boolean) {
  enabled = on;
  if (on) {
    // Called from a click, so the browser allows audio to start.
    void audio().ctx.resume();
    play("on");
  }
  window.dispatchEvent(new CustomEvent<boolean>(EVENT, { detail: on }));
}

export function onSoundChange(handler: (on: boolean) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<boolean>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

// The palette follows the NINJA GAIDEN 4 menu clip in ui-reference/05_01_en.mp4 (measured, not
// sampled): a struck-metal clang. Instant attack, a low thump (65–110 Hz) for weight, a spectral
// centre near 3 kHz and a 200–550 ms tail. Every cue mixes three layers: an inharmonic metal
// "ring", shaped noise ("air") and a falling sine ("thump").

let noise: AudioBuffer | null = null;

function noiseBuffer(ctx: AudioContext) {
  if (!noise) {
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); // 1 s, reused
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/** Noise between `hp` and `lp` Hz; the top closes slightly as it fades. */
function air(at: number, hp: number, lp: number, dur: number, gain: number) {
  const { ctx, out } = audio();
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const high = ctx.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = hp;
  const low = ctx.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.setValueAtTime(lp, at);
  low.frequency.exponentialRampToValueAtTime(lp * 0.8, at + dur);
  const env = ctx.createGain();
  env.gain.setValueAtTime(gain, at);
  env.gain.exponentialRampToValueAtTime(0.001, at + dur);
  src.connect(high).connect(low).connect(env).connect(out);
  src.start(at, Math.random() * 0.5);
  src.stop(at + dur + 0.02);
}

/** A low sine that drops in pitch, like a soft impact. */
function thump(at: number, from: number, dur: number, gain: number) {
  const { ctx, out } = audio();
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(from * 0.65, at + dur);
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(gain, at + 0.004);
  env.gain.exponentialRampToValueAtTime(0.001, at + dur);
  osc.connect(env).connect(out);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

// Partials of a struck metal bar (not whole-number multiples, which is what makes it sound like
// metal rather than a note). Higher partials are quieter and die faster, as in real metal.
const METAL = [1, 2.32, 4.25, 6.63];
const METAL_AMPS = [1, 0.7, 0.45, 0.25];

function ring(at: number, base: number, decay: number, gain: number, lp = 9000) {
  const { ctx, out } = audio();
  const bus = ctx.createBiquadFilter();
  bus.type = "lowpass";
  bus.frequency.value = lp;
  bus.connect(out);
  METAL.forEach((ratio, i) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const dur = decay / (1 + i * 0.7);
    osc.frequency.value = base * ratio;
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(gain * METAL_AMPS[i], at + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0005, at + dur);
    osc.connect(env).connect(bus);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  });
}

export function play(cue: Cue) {
  if (!enabled) return;
  const { ctx } = audio();
  const t = ctx.currentTime;
  switch (cue) {
    case "hover": {
      // A small "tink". Throttled, and short so it never piles up while the mouse moves.
      const now = performance.now();
      if (now - lastHover < 45) return;
      lastHover = now;
      ring(t, 1900, 0.16, 0.03);
      air(t, 900, 6500, 0.08, 0.03);
      thump(t, 110, 0.12, 0.03);
      break;
    }
    case "step":
      // a soft footfall on the server room's metal floor
      thump(t, 150, 0.06, 0.035);
      air(t, 1500, 5000, 0.03, 0.012);
      break;
    case "select":
      ring(t, 1400, 0.6, 0.075);
      air(t, 600, 6000, 0.3, 0.06);
      thump(t, 95, 0.75, 0.24);
      break;
    case "back":
      // Lower and damped, like the same metal hit with a hand on it.
      ring(t, 1050, 0.3, 0.065, 5000);
      air(t, 500, 4500, 0.22, 0.05);
      thump(t, 80, 0.5, 0.2);
      break;
    case "on":
      ring(t, 1400, 0.6, 0.075);
      air(t, 600, 6000, 0.3, 0.06);
      thump(t, 95, 0.75, 0.24);
      ring(t + 0.09, 2100, 0.35, 0.03);
      break;
    // Timed to the ~1.6 s "screen breaks" transition: crackles while it tears, a low hit as
    // the new theme spreads, a small metal tick when it settles.
    case "sweep-light":
    case "sweep-dark": {
      const light = cue === "sweep-light";
      for (let i = 0; i < 6; i++) {
        const at = t + 0.03 + Math.random() * 0.45;
        air(at, 2500, 9000, 0.03 + Math.random() * 0.04, 0.05);
        if (Math.random() < 0.4) ring(at, 1800 + Math.random() * 1200, 0.08, 0.015);
      }
      air(t + 0.48, light ? 700 : 500, light ? 6500 : 4500, 0.9, 0.07);
      thump(t + 0.48, light ? 90 : 72, 1.1, 0.24);
      ring(t + 0.48, light ? 1700 : 1100, 0.9, 0.03, light ? 9000 : 5000);
      ring(t + 1.4, light ? 2200 : 1600, 0.2, 0.02);
      break;
    }
  }
}
