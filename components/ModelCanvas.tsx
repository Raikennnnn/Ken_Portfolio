"use client";

import { Suspense, useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

type PageInteraction = {
  pointer: THREE.Vector2;
  pointerSeen: boolean;
  clickTarget: THREE.Vector2;
  clickAt: number;
  scrollAt: number;
  scrollDirection: number;
  scrollY: number;
  reducedMotion: boolean;
};

function usePageInteraction(onLinkClick: () => void) {
  const interaction = useRef<PageInteraction>({
    pointer: new THREE.Vector2(),
    pointerSeen: false,
    clickTarget: new THREE.Vector2(),
    clickAt: -Infinity,
    scrollAt: -Infinity,
    scrollDirection: 1,
    scrollY: 0,
    reducedMotion: false,
  });

  useEffect(() => {
    const state = interaction.current;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    state.reducedMotion = motionQuery.matches;
    state.scrollY = window.scrollY;

    const onMotionChange = () => {
      state.reducedMotion = motionQuery.matches;
    };
    const onPointerMove = (event: PointerEvent) => {
      state.pointer.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        1 - (event.clientY / window.innerHeight) * 2
      );
      state.pointerSeen = true;
    };
    const onScroll = () => {
      const nextY = window.scrollY;
      const movement = nextY - state.scrollY;
      if (Math.abs(movement) > 1) {
        state.scrollDirection = Math.sign(movement);
        state.scrollAt = performance.now() / 1000;
      }
      state.scrollY = nextY;
    };
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest("a[href]");
      if (!link) return;

      const rect = link.getBoundingClientRect();
      const x = event.detail === 0 ? rect.left + rect.width / 2 : event.clientX;
      const y = event.detail === 0 ? rect.top + rect.height / 2 : event.clientY;
      state.clickTarget.set(
        (x / window.innerWidth) * 2 - 1,
        1 - (y / window.innerHeight) * 2
      );
      state.clickAt = performance.now() / 1000;
      if (!state.reducedMotion) onLinkClick();
    };

    motionQuery.addEventListener("change", onMotionChange);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    return () => {
      motionQuery.removeEventListener("change", onMotionChange);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
    };
  }, [onLinkClick]);

  return interaction;
}

// ── Click pulse state shared across components ──
function useClickPulse() {
  const pulse = useRef(0);
  const active = useRef(false);

  const trigger = useCallback(() => {
    pulse.current = 1;
    active.current = true;
  }, []);

  return { pulse, active, trigger };
}

// ── Ambient floating particles around the character ──
function AmbientParticles({ scrollFade }: { scrollFade: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Points>(null);
  const count = 80;

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
      spd[i] = 0.2 + Math.random() * 0.5;
    }
    return [pos, spd];
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const posAttr = meshRef.current.geometry.attributes
      .position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const baseY = ((positions[i * 3 + 1] + t * speeds[i] * 0.3) % 10) - 5;
      posAttr.setY(i, baseY);
      posAttr.setX(
        i,
        positions[i * 3] + Math.sin(t * speeds[i] + i) * 0.3
      );
    }
    posAttr.needsUpdate = true;

    // Fade particles with scroll
    const mat = meshRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.5 * scrollFade.current;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#22d3ee"
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ── Glitch ring effect on click ──
function GlitchRing({ pulse, active, interaction }: {
  pulse: React.MutableRefObject<number>;
  active: React.MutableRefObject<boolean>;
  interaction: React.MutableRefObject<PageInteraction>;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  useFrame(() => {
    if (!ringRef.current || !active.current) return;

    pulse.current *= 0.9;
    const s = 1 + (1 - pulse.current) * 3;
    ringRef.current.scale.set(s, s, s);
    ringRef.current.position.set(
      interaction.current.clickTarget.x * viewport.width / 2,
      0.5 + interaction.current.clickTarget.y * viewport.height / 2,
      0
    );

    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = pulse.current * 0.8;

    if (pulse.current < 0.01) {
      active.current = false;
      ringRef.current.scale.set(1, 1, 1);
      mat.opacity = 0;
    }
  });

  return (
    <mesh ref={ringRef} position={[0, 0, 0]}>
      <ringGeometry args={[0.05, 0.075, 32]} />
      <meshBasicMaterial
        color="#22d3ee"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Character model with full interactivity ──
function CharacterModel({
  scrollFade,
  pulse,
  active,
  interaction,
}: {
  scrollFade: React.MutableRefObject<number>;
  pulse: React.MutableRefObject<number>;
  active: React.MutableRefObject<boolean>;
  interaction: React.MutableRefObject<PageInteraction>;
}) {
  const { scene, animations } = useGLTF("/models/character.glb");
  const { viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const smoothedPointer = useRef(new THREE.Vector2());
  const pointAmount = useRef(0);
  const scrollAmount = useRef(0);
  const baseX = useRef(0);
  const baseY = useRef(0);
  const baseZ = useRef(0);
  const baseScale = useRef(1);
  const hovered = useRef(false);
  const glowIntensity = useRef(0);
  const poseEuler = useMemo(() => new THREE.Euler(), []);
  const poseQuaternion = useMemo(() => new THREE.Quaternion(), []);

  // Clone the scene so React Three Fiber can manage it
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat.color) {
            mat.roughness = 0.7;
            mat.metalness = 0.15;
            // Store original emissive for glow effect
            if (!mat.emissive) mat.emissive = new THREE.Color(0, 0, 0);
            mat.emissiveIntensity = 0;
          }
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    return clone;
  }, [scene]);

  const mixer = useMemo(() => new THREE.AnimationMixer(clonedScene), [clonedScene]);
  const joints = useMemo(() => ({
    head: clonedScene.getObjectByName("head"),
    chest: clonedScene.getObjectByName("chest"),
    shoulderL: clonedScene.getObjectByName("shoulder_L"),
    elbowL: clonedScene.getObjectByName("elbow_L"),
    wristL: clonedScene.getObjectByName("wrist_L"),
    shoulderR: clonedScene.getObjectByName("shoulder_R"),
    elbowR: clonedScene.getObjectByName("elbow_R"),
    wristR: clonedScene.getObjectByName("wrist_R"),
    coatL: clonedScene.getObjectByName("coat_flap_L"),
    coatR: clonedScene.getObjectByName("coat_flap_R"),
    coatBack: clonedScene.getObjectByName("coat_back"),
  }), [clonedScene]);

  useEffect(() => {
    const idleClip = animations.find((clip) => clip.name === "Idle");
    if (!idleClip) return;
    const idle = mixer.clipAction(idleClip);
    idle.reset().play();
    return () => {
      idle.stop();
    };
  }, [animations, mixer]);

  // Scale and position on mount
  useEffect(() => {
    if (!groupRef.current) return;
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const targetHeight = 4;
    const scale = targetHeight / size.y;
    baseScale.current = scale;
    groupRef.current.scale.setScalar(scale);

    baseX.current = viewport.width * 0.28 - center.x * scale;
    groupRef.current.position.x = baseX.current;
    baseZ.current = -center.z * scale;
    groupRef.current.position.z = baseZ.current;
    baseY.current = -center.y * scale + (-size.y / 2) * scale + 0.2;
    groupRef.current.position.y = baseY.current;
  }, [clonedScene, viewport.width]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const now = performance.now() / 1000;
    const page = interaction.current;
    const motion = page.reducedMotion ? 0 : 1;
    mixer.update(delta * motion);

    smoothedPointer.current.lerp(
      page.pointer,
      1 - Math.exp(-delta * 8)
    );
    pointAmount.current = THREE.MathUtils.damp(
      pointAmount.current,
      page.pointerSeen ? motion : 0,
      7,
      delta
    );
    const scrollRecent = THREE.MathUtils.clamp(
      1 - (now - page.scrollAt) / 0.55,
      0,
      1
    );
    scrollAmount.current = THREE.MathUtils.damp(
      scrollAmount.current,
      scrollRecent * motion,
      8,
      delta
    );

    const clickAge = now - page.clickAt;
    const approach = THREE.MathUtils.smoothstep(clickAge, 0, 0.28);
    const retreat = 1 - THREE.MathUtils.smoothstep(clickAge, 0.65, 1.3);
    const lunge = approach * retreat * motion;
    const tap = Math.exp(-Math.pow((clickAge - 0.48) / 0.11, 2)) * motion;
    const aimX = THREE.MathUtils.lerp(smoothedPointer.current.x, page.clickTarget.x, lunge) * motion;
    const aimY = THREE.MathUtils.lerp(smoothedPointer.current.y, page.clickTarget.y, lunge) * motion;
    const scrollLean = scrollAmount.current * page.scrollDirection;

    const clickWorldX = page.clickTarget.x * viewport.width / 2;
    const clickMove = THREE.MathUtils.clamp(
      (clickWorldX - baseX.current) * 0.32,
      -1.1,
      1.1
    ) * lunge;
    groupRef.current.position.x = THREE.MathUtils.damp(
      groupRef.current.position.x,
      baseX.current + aimX * 0.12 + clickMove,
      7,
      delta
    );
    groupRef.current.position.y = baseY.current + Math.sin(t * 1.2) * 0.02 * motion
      + scrollLean * 0.16 + lunge * 0.08;
    groupRef.current.position.z = baseZ.current + lunge * 1.05;
    groupRef.current.scale.setScalar(baseScale.current * (1 + lunge * 0.12));
    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      aimX * 0.3 + scrollLean * 0.2,
      6,
      delta
    );
    groupRef.current.rotation.x = THREE.MathUtils.damp(
      groupRef.current.rotation.x,
      -aimY * 0.1 - lunge * 0.07 + scrollLean * 0.12,
      6,
      delta
    );

    // The mixer restores the idle pose first; these rotations add gestures on top.
    const addPose = (joint: THREE.Object3D | undefined, x: number, y: number, z: number) => {
      if (!joint) return;
      poseQuaternion.setFromEuler(poseEuler.set(x, y, z));
      joint.quaternion.multiply(poseQuaternion);
    };
    addPose(joints.head, -aimY * 0.14 - scrollLean * 0.08, aimX * 0.22, aimX * 0.04);
    addPose(joints.chest, scrollLean * 0.15 - lunge * 0.06, aimX * 0.07, scrollLean * 0.05);
    addPose(joints.coatL, -scrollLean * 0.25, 0, scrollLean * 0.12);
    addPose(joints.coatR, -scrollLean * 0.25, 0, -scrollLean * 0.12);
    addPose(joints.coatBack, -scrollLean * 0.2, 0, 0);

    const shoulderX = (0.5 + groupRef.current.position.x / viewport.width) * window.innerWidth;
    const targetX = (aimX + 1) * window.innerWidth / 2;
    const targetY = (1 - aimY) * window.innerHeight / 2;
    const dx = targetX - shoulderX;
    const dy = window.innerHeight * 0.66 - targetY;
    const angle = Math.atan2(dx, -dy);
    const leftWeight = THREE.MathUtils.smoothstep(dx, -45, 45);
    const rightWeight = 1 - leftWeight;
    const reach = Math.max(pointAmount.current, lunge);
    addPose(joints.shoulderR,
      (-0.6 * reach - 0.3 * tap) * rightWeight,
      0,
      THREE.MathUtils.clamp(angle, -2.55, -0.25) * reach * rightWeight
    );
    addPose(joints.elbowR, -0.2 * reach * rightWeight - 0.28 * tap * rightWeight, 0, 0);
    addPose(joints.wristR, -0.12 * reach * rightWeight, 0, 0);
    addPose(joints.shoulderL,
      (-0.6 * reach - 0.3 * tap) * leftWeight,
      0,
      THREE.MathUtils.clamp(angle, 0.25, 2.55) * reach * leftWeight
    );
    addPose(joints.elbowL, -0.2 * reach * leftWeight - 0.28 * tap * leftWeight, 0, 0);
    addPose(joints.wristL, -0.12 * reach * leftWeight, 0, 0);

    const baseFade = THREE.MathUtils.clamp(1 - page.scrollY / window.innerHeight * 1.5, 0, 1);
    const fade = Math.max(baseFade, scrollAmount.current * 0.26, lunge * 0.85);
    scrollFade.current = fade;
    groupRef.current.visible = fade > 0.01;

    // ── Hover glow + click pulse glow ──
    const targetGlow = hovered.current ? 0.15 : 0;
    glowIntensity.current = THREE.MathUtils.damp(
      glowIntensity.current,
      targetGlow,
      8,
      delta
    );

    const clickGlow = active.current ? pulse.current * 0.4 : 0;
    const totalGlow = glowIntensity.current + clickGlow;

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          // Apply scroll fade
          mat.transparent = true;
          mat.opacity = fade;
          // Apply glow
          mat.emissiveIntensity = totalGlow;
          if (totalGlow > 0) {
            mat.emissive = new THREE.Color("#22d3ee");
          }
        }
      }
    });
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={() => {
        hovered.current = true;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hovered.current = false;
        document.body.style.cursor = "default";
      }}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

// ── Lighting rig — cybersecurity colors ──
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={0.8}
        color="#e2e8f0"
      />
      {/* Cyan rim light from left */}
      <pointLight position={[-3, 2, 2]} intensity={0.6} color="#22d3ee" />
      {/* Purple accent from right */}
      <pointLight position={[3, 1, -1]} intensity={0.4} color="#a855f7" />
      {/* Green ground bounce */}
      <pointLight position={[0, -2, 2]} intensity={0.2} color="#34d399" />
    </>
  );
}

// ── Main canvas component ──
export function ModelCanvas() {
  const [mounted, setMounted] = useState(false);
  const scrollFade = useRef(1);
  const { pulse, active, trigger } = useClickPulse();
  const interaction = usePageInteraction(trigger);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[2]"
      style={{ opacity: 0.9 }}
      onClick={(event) => {
        interaction.current.clickTarget.set(
          (event.clientX / window.innerWidth) * 2 - 1,
          1 - (event.clientY / window.innerHeight) * 2
        );
        interaction.current.clickAt = performance.now() / 1000;
        if (!interaction.current.reducedMotion) trigger();
      }}
    >
      <Canvas
        camera={{ position: [0, 0.5, 5.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Lighting />
        <Suspense fallback={null}>
          <CharacterModel
            scrollFade={scrollFade}
            pulse={pulse}
            active={active}
            interaction={interaction}
          />
          <GlitchRing pulse={pulse} active={active} interaction={interaction} />
          <AmbientParticles scrollFade={scrollFade} />
          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload("/models/character.glb");
