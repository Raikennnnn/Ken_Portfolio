"use client";

/**
 * 3D COMPANION
 *
 * One fixed, transparent, click-through canvas draws the character. Each frame
 * the character is placed over a DOM rectangle that blends from the hero slot
 * (#avatar-slot) to a small dock in the corner as you scroll. A DOM <button>
 * follows the same rectangle and handles hover / click / keyboard, so the
 * canvas never steals pointer events from the page.
 *
 * Behaviour
 *  - head + body track the cursor (or the terminal while it is open)
 *  - LEDs pulse; hover lights the coat piping
 *  - points at the link / button you hover; the coat sways when you scroll
 *  - hero clicks cycle: wave → scan (HUD readout) → nod → spin
 *  - 5 clicks in 2s trips the "rate limiter" (glitch + 429)
 *  - docked: comments once per section, click opens the terminal
 *  - the dock scales with the viewport and always stays fully on screen
 */

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { onAvatar, toggleTerminal, type AvatarAction } from "@/lib/avatarBus";
import { profile, projects } from "@/content/data";

const MODEL_URL = "/models/character.glb";
// The model is uncompressed. Keeping the Draco (CDN) and Meshopt (WASM) decoders off
// means the CSP needs neither a third-party script host nor 'wasm-unsafe-eval'.
const USE_DRACO = false;
const USE_MESHOPT = false;
const CAMERA_Z = 10;
const FOV = 25;
const VISIBLE_H = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));

const ACTION_MS: Record<AvatarAction, number> = {
  wave: 1900,
  scan: 1800,
  spin: 1100,
  glitch: 900,
  nod: 800,
};

type Rect = { x: number; y: number; w: number; h: number };

type Shared = {
  rect: Rect;
  /** 0 = hero slot, 1 = docked */
  t: number;
  mouse: { x: number; y: number; active: boolean };
  /** Centre of the hovered/focused link or button, in CSS px. */
  link: { x: number; y: number; active: boolean };
  scroll: { at: number; dir: number };
  hovered: boolean;
  terminalOpen: boolean;
  typingAt: number;
  action: { name: AvatarAction; start: number } | null;
  reducedMotion: boolean;
};

type DomRefs = {
  hit: React.RefObject<HTMLButtonElement>;
  bubble: React.RefObject<HTMLDivElement>;
  hud: React.RefObject<HTMLDivElement>;
  dock: React.RefObject<HTMLDivElement>;
};

const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const smooth = (x: number) => x * x * (3 - 2 * x);

/** 0→1→0 envelope with soft in/out edges. */
function envelope(p: number, edgeIn = 0.15, edgeOut = 0.2) {
  if (p <= 0 || p >= 1) return 0;
  if (p < edgeIn) return smooth(p / edgeIn);
  if (p > 1 - edgeOut) return smooth((1 - p) / edgeOut);
  return 1;
}

// ─────────────────────────────────────────────────────────────────────
//  Layout — where on screen the character lives this frame
// ─────────────────────────────────────────────────────────────────────

function Layout({ shared, dom }: { shared: React.MutableRefObject<Shared>; dom: DomRefs }) {
  const { size } = useThree();

  useFrame(() => {
    const s = shared.current;
    const vw = size.width;
    const vh = size.height;
    const mobile = vw < 768;

    const slotEl = document.getElementById("avatar-slot");
    const slot = slotEl?.getBoundingClientRect();

    // Dock rectangle (bottom-right), sized to the viewport so it stays readable on
    // phones and never takes over short landscape screens.
    const margin = mobile ? 14 : 24;
    const dh = clamp(Math.min(vw * 0.3, vh * 0.26), 118, 176);
    const dw = dh / 1.4;
    const dock: Rect = {
      x: vw - dw - margin,
      y: vh - dh - margin,
      w: dw,
      h: dh,
    };

    // Hero → dock progress, driven by how far the slot has scrolled up.
    let t = 1;
    if (slot && slot.height > 0) {
      t = clamp((vh * 0.72 - slot.bottom) / (vh * 0.42), 0, 1);
    }
    s.t = smooth(t);

    const hero: Rect = slot
      ? { x: slot.left, y: slot.top, w: slot.width, h: slot.height }
      : dock;
    s.rect = {
      x: lerp(hero.x, dock.x, s.t),
      y: lerp(hero.y, dock.y, s.t),
      w: lerp(hero.w, dock.w, s.t),
      h: lerp(hero.h, dock.h, s.t),
    };

    // ── Position the DOM overlays ──
    const { bodyH, feetY, cx } = bodyMetrics(s);
    const hitW = Math.min(s.rect.w, bodyH * 0.5);
    const hitX = cx - hitW / 2;
    const hitY = feetY - bodyH;

    if (dom.hit.current) {
      const el = dom.hit.current;
      el.style.transform = `translate3d(${hitX}px, ${hitY}px, 0)`;
      el.style.width = `${hitW}px`;
      el.style.height = `${bodyH}px`;
      el.dataset.mode = s.t > 0.5 ? "dock" : "hero";
    }

    if (dom.dock.current) {
      const el = dom.dock.current;
      el.style.transform = `translate3d(${dock.x}px, ${dock.y}px, 0)`;
      el.style.width = `${dock.w}px`;
      el.style.height = `${dock.h}px`;
      el.style.opacity = String(clamp((s.t - 0.6) / 0.4, 0, 1));
    }

    if (dom.bubble.current) {
      const el = dom.bubble.current;
      const bw = el.offsetWidth;
      const bh = el.offsetHeight;
      let bx: number, by: number;
      if (s.t < 0.5) {
        // Hero: up and to the left of the head
        bx = hitX - bw + hitW * 0.3;
        by = hitY - 4;
      } else {
        // Dock: above the dock, right-aligned
        bx = dock.x + dock.w - bw;
        by = dock.y - bh - 10;
      }
      bx = clamp(bx, 12, vw - bw - 12);
      by = clamp(by, 64, vh - bh - 12);
      el.style.transform = `translate3d(${bx}px, ${by}px, 0)`;
    }

    if (dom.hud.current) {
      const el = dom.hud.current;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      let x: number, y: number;
      if (s.t < 0.5) {
        x = hitX + hitW - 8;
        y = hitY + bodyH * 0.22;
        if (x + w > vw - 12) {
          // No room on the right: float it over the legs instead of covering the headline.
          x = cx - w / 2;
          y = feetY - bodyH * 0.42;
        }
      } else {
        x = dock.x - w - 12;
        y = dock.y + 8;
      }
      el.style.transform = `translate3d(${clamp(x, 12, vw - w - 12)}px, ${clamp(y, 64, vh - h - 12)}px, 0)`;
    }
  }, -1);

  return null;
}

/** Height of the character on screen and where its feet go, in CSS pixels. */
function bodyMetrics(s: Shared) {
  const r = s.rect;
  const bottomGap = lerp(30, 6, s.t); // hero leaves room for the "click to interact" label
  const topGap = lerp(10, 20, s.t); // dock leaves room for the "ken.exe" label
  const bodyH = Math.max(40, r.h - bottomGap - topGap);
  return { bodyH, feetY: r.y + r.h - bottomGap, cx: r.x + r.w / 2 };
}

// ─────────────────────────────────────────────────────────────────────
//  Character
// ─────────────────────────────────────────────────────────────────────

const GLOW_MATERIALS = ["led_green", "piping_green", "lining_cyan", "headphone_green"];
const CYAN = new THREE.Color("#22d3ee");
const MAGENTA = new THREE.Color("#e879f9");

function Character({ shared }: { shared: React.MutableRefObject<Shared> }) {
  const { scene, animations } = useGLTF(MODEL_URL, USE_DRACO, USE_MESHOPT);
  const outer = useRef<THREE.Group>(null); // placed + scaled to the DOM rect
  const inner = useRef<THREE.Group>(null); // normalises the model to height 1, feet at 0
  const ring = useRef<THREE.Mesh>(null);
  const { size } = useThree();
  const { actions } = useAnimations(animations, inner);

  // Named joints we animate on top of the Idle clip.
  const rig = useMemo(() => {
    const get = (n: string) => scene.getObjectByName(n) ?? null;

    // The asset only ships a left glove. Mirror it under the empty right wrist
    // (once — useGLTF caches the scene) so both hands follow the arm joints.
    const wristL = get("wrist_L");
    const wristR = get("wrist_R");
    if (wristL && wristR && !wristR.getObjectByName("right_hand_restored")) {
      const hand = new THREE.Group();
      hand.name = "right_hand_restored";
      hand.scale.x = -1;
      wristL.children.forEach((part) => hand.add(part.clone(true)));
      wristR.add(hand);
    }

    const joints = {
      head: get("head"),
      neck: get("neck"),
      chest: get("chest"),
      shoulderR: get("shoulder_R"),
      elbowR: get("elbow_R"),
      wristR,
      shoulderL: get("shoulder_L"),
      elbowL: get("elbow_L"),
      wristL,
      coatL: get("coat_flap_L"),
      coatR: get("coat_flap_R"),
      coatBack: get("coat_back"),
    };
    // Joints the Idle clip doesn't touch must be reset each frame before we add offsets.
    const base = new Map<THREE.Object3D, THREE.Quaternion>();
    for (const j of [joints.neck, joints.elbowR, joints.wristR]) {
      if (j) base.set(j, j.quaternion.clone());
    }
    return { ...joints, base };
  }, [scene]);

  const materials = useMemo(() => {
    const all = new Map<string, THREE.MeshStandardMaterial>();
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat?.isMeshStandardMaterial) return;
      mat.roughness = Math.max(mat.roughness, 0.55);
      all.set(mat.name, mat);
    });
    const glow = GLOW_MATERIALS.map((n) => all.get(n)).filter(Boolean) as THREE.MeshStandardMaterial[];
    const baseColor = new Map(glow.map((m) => [m, m.color.clone()]));
    return { all: [...all.values()], glow, baseColor };
  }, [scene]);

  const normalise = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const sz = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    return { scale: 1 / sz.y, offset: new THREE.Vector3(-c.x, -box.min.y, -c.z) };
  }, [scene]);

  useEffect(() => {
    const idle = actions["Idle"];
    idle?.reset().fadeIn(0.3).play();
    return () => void idle?.fadeOut(0.2);
  }, [actions]);

  const look = useRef({ yaw: 0, pitch: 0 });
  const reach = useRef(0);
  const sway = useRef(0);
  const tmpQ = useMemo(() => new THREE.Quaternion(), []);
  const tmpE = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);
  const addRot = (obj: THREE.Object3D | null, x: number, y: number, z: number) => {
    if (!obj) return;
    tmpE.set(x, y, z);
    obj.quaternion.multiply(tmpQ.setFromEuler(tmpE));
  };

  // Runs after useAnimations' mixer update (registered earlier), so offsets layer on the clip.
  useFrame((state, dt) => {
    const s = shared.current;
    if (!outer.current) return;
    const now = performance.now();
    const time = state.clock.elapsedTime;
    const vw = size.width;
    const vh = size.height;

    // ── Place the character over its DOM rect ──
    const { bodyH, feetY, cx } = bodyMetrics(s);
    const wpp = VISIBLE_H / vh;
    const bob = s.reducedMotion ? 0 : Math.sin(time * 1.3) * 0.006;
    outer.current.position.set((cx - vw / 2) * wpp, -(feetY - vh / 2) * wpp, 0);
    outer.current.scale.setScalar(bodyH * wpp);
    if (inner.current) inner.current.position.y = normalise.offset.y * normalise.scale + bob;

    // ── Current action progress ──
    let act: AvatarAction | null = null;
    let p = 0;
    if (s.action) {
      p = (now - s.action.start) / ACTION_MS[s.action.name];
      if (p >= 1) s.action = null;
      else act = s.action.name;
    }

    // ── Look target: terminal > cursor > idle wander ──
    const headY = feetY - bodyH * 0.88;
    let tx: number, ty: number;
    if (s.terminalOpen) {
      tx = vw / 2;
      ty = vh * 0.4;
    } else if (s.mouse.active) {
      tx = s.mouse.x;
      ty = s.mouse.y;
    } else {
      tx = cx + Math.sin(time * 0.4) * vw * 0.25;
      ty = headY + Math.sin(time * 0.27) * 60;
    }
    let yawT = clamp((tx - cx) / Math.max(vw * 0.35, 220), -1, 1) * 0.75;
    let pitchT = clamp((ty - headY) / (vh * 0.5), -1, 1) * 0.35;
    if (act === "wave" || act === "scan") {
      yawT *= 0.15; // face the visitor
      pitchT *= 0.3;
    }
    look.current.yaw = THREE.MathUtils.damp(look.current.yaw, yawT, 7, dt);
    look.current.pitch = THREE.MathUtils.damp(look.current.pitch, pitchT, 7, dt);
    const { yaw, pitch } = look.current;

    // ── Reset un-animated joints, then layer offsets ──
    rig.base.forEach((q, j) => j.quaternion.copy(q));

    let bodyYaw = yaw * 0.35;
    let headTilt = 0;
    let nod = 0;

    if (act === "wave") {
      const e = envelope(p, 0.18, 0.22);
      addRot(rig.shoulderR, -0.1 * e, 0.25 * e, -2.55 * e);
      addRot(rig.elbowR, 0, 0, (-0.25 + Math.sin(p * Math.PI * 7) * 0.42) * e);
      addRot(rig.wristR, 0, 0, Math.sin(p * Math.PI * 7 + 0.6) * 0.2 * e);
      headTilt = 0.12 * e;
    } else if (act === "nod") {
      nod = Math.sin(p * Math.PI * 3) * 0.22 * envelope(p, 0.1, 0.2);
    } else if (act === "spin") {
      const q = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOutQuad
      bodyYaw += q * Math.PI * 2;
    }

    // Typing in the terminal → small attentive nods
    const typing = now - s.typingAt < 350;
    if (typing && !act) nod += Math.sin(time * 18) * 0.03;

    addRot(rig.neck, pitch * 0.4 + nod * 0.5, yaw * 0.35, 0);
    addRot(rig.head, pitch * 0.6 + nod, yaw * 0.45, headTilt);
    outer.current.rotation.y = bodyYaw;

    // ── Point at the hovered link with the arm on that side ──
    const motion = s.reducedMotion ? 0 : 1;
    const wantReach = s.link.active && !act && !s.terminalOpen && !s.hovered ? motion : 0;
    reach.current = THREE.MathUtils.damp(reach.current, wantReach, 6, dt);
    if (reach.current > 0.001) {
      const shoulderY = feetY - bodyH * 0.78;
      const dx = s.link.x - cx;
      const dyUp = shoulderY - s.link.y;
      const angle = Math.atan2(dx, -dyUp); // 0 = arm hanging down, ±π/2 = straight out
      const r = reach.current;
      // Screen-left is the character's right side.
      if (dx < 0) {
        addRot(rig.shoulderR, -0.45 * r, 0, clamp(angle, -2.25, -0.3) * r);
        addRot(rig.elbowR, -0.2 * r, 0, 0);
      } else {
        addRot(rig.shoulderL, -0.45 * r, 0, clamp(angle, 0.3, 2.25) * r);
        addRot(rig.elbowL, -0.2 * r, 0, 0);
      }
    }

    // ── Coat + chest sway right after a scroll ──
    const sinceScroll = (now - s.scroll.at) / 1000;
    sway.current = THREE.MathUtils.damp(sway.current, clamp(1 - sinceScroll / 0.9, 0, 1) * motion, 8, dt);
    const lean = sway.current * s.scroll.dir;
    if (Math.abs(lean) > 0.001) {
      addRot(rig.chest, lean * 0.12, 0, 0);
      addRot(rig.coatL, -lean * 0.42, 0, lean * 0.2);
      addRot(rig.coatR, -lean * 0.42, 0, -lean * 0.2);
      addRot(rig.coatBack, -lean * 0.32, 0, 0);
    }

    // Glitch: positional jitter + squash
    if (act === "glitch") {
      const k = envelope(p, 0.05, 0.3);
      outer.current.position.x += (Math.random() - 0.5) * 0.08 * k;
      outer.current.position.y += (Math.random() - 0.5) * 0.03 * k;
      outer.current.scale.x *= 1 + (Math.random() - 0.5) * 0.25 * k;
    }

    // ── Materials ──
    const hover = s.hovered ? 1 : 0;
    const scanK = act === "scan" ? envelope(p, 0.1, 0.25) : 0;
    const glitchK = act === "glitch" ? envelope(p, 0.05, 0.3) : 0;
    for (const m of materials.glow) {
      const isLed = m.name === "led_green";
      const pulse = isLed
        ? 0.9 + Math.sin(time * (s.terminalOpen ? 6 : 2.4)) * 0.45 + (typing ? Math.random() * 0.8 : 0)
        : 0.06 + hover * 0.55;
      m.emissive.copy(materials.baseColor.get(m)!);
      if (scanK > 0) m.emissive.lerp(CYAN, scanK);
      if (glitchK > 0) m.emissive.copy(Math.random() > 0.5 ? CYAN : MAGENTA);
      m.emissiveIntensity = pulse + scanK * 1.4 + glitchK * Math.random() * 2;
    }
    if (glitchK > 0 || scanK > 0) {
      for (const m of materials.all) {
        if (materials.baseColor.has(m)) continue;
        m.emissive.copy(glitchK > 0 ? MAGENTA : CYAN);
        m.emissiveIntensity = glitchK > 0 ? (Math.random() > 0.7 ? 0.35 : 0) * glitchK : 0;
      }
    }

    // ── Scan ring sweeps head → feet ──
    if (ring.current) {
      const mat = ring.current.material as THREE.MeshBasicMaterial;
      ring.current.visible = scanK > 0;
      if (scanK > 0) {
        const sweep = (p * 1.6) % 1; // two passes
        ring.current.position.y = 1.04 - sweep * 1.08;
        mat.opacity = 0.9 * scanK;
      }
    }
  });

  return (
    <group ref={outer}>
      <group ref={inner} scale={normalise.scale} position={normalise.offset.clone().multiplyScalar(normalise.scale)}>
        <primitive object={scene} />
      </group>
      <mesh ref={ring} rotation-x={Math.PI / 2} visible={false}>
        <torusGeometry args={[0.26, 0.004, 8, 72]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

// Directional lights only, so lighting is identical wherever the character sits on screen.
function Lighting() {
  return (
    <>
      <hemisphereLight args={["#cbd5e1", "#0c0c1d", 0.9]} />
      <directionalLight position={[2, 3, 5]} intensity={1.1} color="#e2e8f0" />
      <directionalLight position={[-4, 2, -3]} intensity={1.4} color="#22d3ee" />
      <directionalLight position={[4, 1, -2]} intensity={0.8} color="#a855f7" />
    </>
  );
}

// If WebGL or the model fails, the page simply shows no companion.
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────
//  Companion — canvas + DOM overlays + behaviour
// ─────────────────────────────────────────────────────────────────────

const SECTION_LINES: Record<string, string> = {
  work: "These are real repos. Expand one to read its security notes.",
  skills: "No skill bars here — every skill links to where I actually used it.",
  activity: "Pulled live from GitHub, refreshed hourly.",
  about: "That photo is encrypted. Hover it to decrypt.",
  contact: "Scrolled all the way down? Let's talk.",
};

const QUIPS = [
  "I'm server-authoritative. Your clicks are merely suggestions.",
  "No trackers on this site. I checked — it's in the CSP.",
  "Try `help` in my terminal. Ctrl+K opens it.",
  "Stonebound tip: the server owns the currency. Don't bother editing the client.",
];

const SCAN_LINES = [
  "> scanning subject…",
  `id ......... ${profile.name.toLowerCase()}`,
  `role ....... ${profile.title.toLowerCase()}`,
  `projects ... ${String(projects.length).padStart(2, "0")} shipped`,
  "clearance .. GRANTED",
];

export function Companion() {
  const [mounted, setMounted] = useState(false);
  const [bubble, setBubble] = useState<{ text: string; id: number } | null>(null);
  const [typed, setTyped] = useState("");
  const [hud, setHud] = useState<string[] | null>(null);
  const [docked, setDocked] = useState(false);

  const shared = useRef<Shared>({
    rect: { x: 0, y: 0, w: 0, h: 0 },
    t: 0,
    mouse: { x: 0, y: 0, active: false },
    link: { x: 0, y: 0, active: false },
    scroll: { at: -Infinity, dir: 1 },
    hovered: false,
    terminalOpen: false,
    typingAt: 0,
    action: null,
    reducedMotion: false,
  });
  const dom: DomRefs = {
    hit: useRef<HTMLButtonElement>(null),
    bubble: useRef<HTMLDivElement>(null),
    hud: useRef<HTMLDivElement>(null),
    dock: useRef<HTMLDivElement>(null),
  };

  const clicks = useRef<number[]>([]);
  const step = useRef(0);
  const lastGlitch = useRef(0);
  const lastInteraction = useRef(0);
  const saidSections = useRef(new Set<string>());
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    shared.current.reducedMotion = mq.matches;
  }, []);

  // ── Speech ──
  const bubbleUntil = useRef(0);
  const say = (text: string, ms = 4200) => {
    const id = Date.now();
    bubbleUntil.current = performance.now() + ms;
    setBubble({ text, id });
    const t = window.setTimeout(() => setBubble((b) => (b?.id === id ? null : b)), ms);
    timers.current.push(t);
  };

  // Typewriter for the bubble
  useEffect(() => {
    if (!bubble) return setTyped("");
    if (shared.current.reducedMotion) return setTyped(bubble.text);
    let i = 0;
    setTyped("");
    const id = window.setInterval(() => {
      i += 2;
      setTyped(bubble.text.slice(0, i));
      if (i >= bubble.text.length) window.clearInterval(id);
    }, 18);
    return () => window.clearInterval(id);
  }, [bubble]);

  const play = (name: AvatarAction) => {
    if (shared.current.reducedMotion && (name === "spin" || name === "glitch")) name = "nod";
    shared.current.action = { name, start: performance.now() };
    if (name === "scan") runScanHud();
  };

  const runScanHud = () => {
    setHud([]);
    SCAN_LINES.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setHud(SCAN_LINES.slice(0, i + 1)), 250 + i * 320));
    });
    timers.current.push(window.setTimeout(() => setHud(null), 4600));
  };

  const onClick = () => {
    const now = performance.now();
    lastInteraction.current = now;
    clicks.current = clicks.current.filter((t) => now - t < 2000);
    clicks.current.push(now);

    if (clicks.current.length >= 5 && now - lastGlitch.current > 4000) {
      lastGlitch.current = now;
      clicks.current = [];
      play("glitch");
      say("429 Too Many Requests. Good news: the rate limiter works.", 3800);
      return;
    }

    if (shared.current.t > 0.5) {
      toggleTerminal();
      return;
    }

    const i = step.current++;
    if (i === 0) {
      play("wave");
      say(`Hey, I'm ${profile.name}. Poke around — or press Ctrl+K to use my terminal.`, 5200);
    } else {
      const cycle = (i - 1) % 3;
      if (cycle === 0) {
        play("scan");
        say("Hold still. Running a quick identity check…", 2600);
      } else if (cycle === 1) {
        play("nod");
        say(QUIPS[Math.floor((i - 1) / 3) % QUIPS.length]);
      } else {
        play("spin");
        say(QUIPS[(Math.floor((i - 1) / 3) + 2) % QUIPS.length]);
      }
    }
  };

  // ── Global listeners: mouse, bus events, sections, idle nudge ──
  useEffect(() => {
    if (!mounted) return;
    const s = shared.current;

    const trackLink = (target: EventTarget | null) => {
      const el = target instanceof Element ? target.closest("a[href], button") : null;
      if (!el || el.classList.contains("companion-hit")) return void (s.link.active = false);
      const r = el.getBoundingClientRect();
      s.link.x = r.left + r.width / 2;
      s.link.y = r.top + r.height / 2;
      s.link.active = true;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      s.mouse.x = e.clientX;
      s.mouse.y = e.clientY;
      s.mouse.active = true;
      trackLink(e.target);
    };
    const onFocusIn = (e: FocusEvent) => trackLink(e.target);
    const onFocusOut = () => (s.link.active = false);
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 1) {
        s.scroll.dir = Math.sign(y - lastY);
        s.scroll.at = performance.now();
        s.link.active = false; // the hovered element moved; re-acquire on next pointermove
      }
      lastY = y;
    };
    const onLeave = () => {
      s.mouse.active = false;
      s.link.active = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.documentElement.addEventListener("mouseleave", onLeave);

    const offBus = onAvatar((ev) => {
      if (ev.type === "action") play(ev.action);
      else if (ev.type === "say") say(ev.text, ev.ms);
      else if (ev.type === "terminal") s.terminalOpen = ev.open;
      else if (ev.type === "typing") s.typingAt = performance.now();
    });

    // Comment once per section, only once docked, never on phones (the bubble would cover content).
    // Measured at speak time, so a queued line is dropped if you've already scrolled past.
    const onScreen = (id: string) => {
      const r = document.getElementById(id)?.getBoundingClientRect();
      return !!r && r.top < window.innerHeight * 0.65 && r.bottom > window.innerHeight * 0.35;
    };
    const sayFor = (id: string) => {
      if (!onScreen(id) || saidSections.current.has(id) || s.terminalOpen) return;
      saidSections.current.add(id);
      say(SECTION_LINES[id], 4600);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (!entry.isIntersecting || !SECTION_LINES[id]) continue;
          if (saidSections.current.has(id) || s.t < 0.9 || window.innerWidth < 768) continue;
          // Don't talk over a bubble that's still up; re-check visibility when it's done.
          const wait = Math.max(0, bubbleUntil.current - performance.now());
          if (wait === 0) sayFor(id);
          else timers.current.push(window.setTimeout(() => sayFor(id), wait + 300));
        }
      },
      { threshold: 0.35 }
    );
    document.querySelectorAll("section[id]").forEach((el) => io.observe(el));

    // Dock state for aria labels; idle nudge in the hero.
    lastInteraction.current = performance.now();
    let nudged = false;
    const poll = window.setInterval(() => {
      setDocked(s.t > 0.5);
      if (!nudged && step.current === 0 && s.t < 0.1 && performance.now() - lastInteraction.current > 14000) {
        nudged = true;
        play("wave");
        say("Psst — I'm interactive. Click me.", 3600);
      }
    }, 400);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      offBus();
      io.disconnect();
      window.clearInterval(poll);
      timers.current.forEach((t) => window.clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      {/* Dock backdrop — fades in once the character is docked */}
      <div
        ref={dom.dock}
        aria-hidden
        className="companion-dock fixed left-0 top-0 z-[44] pointer-events-none"
        style={{ opacity: 0 }}
      >
        <span className="companion-dock-label">
          <span className="sec-dot" /> ken.exe
        </span>
      </div>

      <SceneBoundary>
        <Canvas
          camera={{ position: [0, 0, CAMERA_Z], fov: FOV, near: 0.1, far: 50 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 46 }}
          aria-hidden
        >
          <Lighting />
          <Layout shared={shared} dom={dom} />
          <Suspense fallback={null}>
            <Character shared={shared} />
          </Suspense>
        </Canvas>
      </SceneBoundary>

      {/* Hit area — follows the character; real button for keyboard + screen readers */}
      <button
        ref={dom.hit}
        type="button"
        onClick={onClick}
        onPointerEnter={() => (shared.current.hovered = true)}
        onPointerLeave={() => (shared.current.hovered = false)}
        onFocus={() => (shared.current.hovered = true)}
        onBlur={() => (shared.current.hovered = false)}
        aria-label={docked ? "Open Ken's terminal" : "Ken's 3D avatar — click to interact"}
        title={docked ? "open terminal" : undefined}
        className="companion-hit fixed left-0 top-0 z-[47]"
      />

      {/* Speech bubble */}
      <div
        ref={dom.bubble}
        role="status"
        aria-live="polite"
        className={`companion-bubble fixed left-0 top-0 z-[48] ${bubble ? "is-visible" : ""}`}
      >
        <span className="text-[var(--accent)]">ken&gt;</span> {typed}
        {bubble && typed.length < bubble.text.length && <span className="cursor-blink !h-3 !w-1.5" />}
      </div>

      {/* Scan HUD */}
      <div
        ref={dom.hud}
        aria-hidden
        className={`companion-hud fixed left-0 top-0 z-[48] ${hud ? "is-visible" : ""}`}
      >
        {(hud ?? []).map((line) => (
          <div key={line} className={line.includes("GRANTED") ? "text-[var(--green)]" : undefined}>
            {line}
          </div>
        ))}
      </div>
    </>
  );
}

useGLTF.preload(MODEL_URL, USE_DRACO, USE_MESHOPT);
