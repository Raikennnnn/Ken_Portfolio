"use client";

import { Suspense, useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Float, Environment } from "@react-three/drei";
import * as THREE from "three";

// ── Cursor tracker — responsive mouse following ──
function useCursorTracker() {
  const mouse = useRef(new THREE.Vector2(0, 0));
  const smoothed = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame(() => {
    smoothed.current.x = THREE.MathUtils.lerp(
      smoothed.current.x,
      mouse.current.x,
      0.08 // faster response
    );
    smoothed.current.y = THREE.MathUtils.lerp(
      smoothed.current.y,
      mouse.current.y,
      0.08
    );
  });

  return smoothed;
}

// ── Scroll-based opacity (fade out, don't move) ──
function useScrollFade() {
  const opacity = useRef(1);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const viewH = window.innerHeight;
      // Start fading at 20% scroll, fully gone by 80%
      opacity.current = THREE.MathUtils.clamp(1 - (scrollY / viewH) * 1.5, 0, 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return opacity;
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
          count={count}
          array={positions}
          itemSize={3}
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
function GlitchRing({ pulse, active }: { pulse: React.MutableRefObject<number>; active: React.MutableRefObject<boolean> }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ringRef.current || !active.current) return;

    pulse.current *= 0.94; // decay
    const s = 1 + pulse.current * 3;
    ringRef.current.scale.set(s, s, s);

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
      <ringGeometry args={[1.2, 1.4, 32]} />
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
}: {
  scrollFade: React.MutableRefObject<number>;
  pulse: React.MutableRefObject<number>;
  active: React.MutableRefObject<boolean>;
}) {
  const { scene } = useGLTF("/models/character.glb");
  const groupRef = useRef<THREE.Group>(null);
  const cursor = useCursorTracker();
  const baseY = useRef(0);
  const hovered = useRef(false);
  const glowIntensity = useRef(0);

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

  // Scale and position on mount
  useEffect(() => {
    if (!groupRef.current) return;
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const targetHeight = 4;
    const scale = targetHeight / size.y;
    groupRef.current.scale.setScalar(scale);

    groupRef.current.position.x = -center.x * scale;
    groupRef.current.position.z = -center.z * scale;
    baseY.current = -center.y * scale + (-size.y / 2) * scale + 0.2;
    groupRef.current.position.y = baseY.current;
  }, [clonedScene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // ── Responsive cursor-following rotation ──
    const targetRotY = cursor.current.x * 0.7;
    const targetRotX = cursor.current.y * -0.15;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotY,
      0.06
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotX,
      0.06
    );

    // ── Gentle idle breathing ──
    const breathe = Math.sin(t * 1.2) * 0.02;
    groupRef.current.position.y = baseY.current + breathe;

    // ── Slight lateral sway following cursor ──
    const targetX = cursor.current.x * 0.3;
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetX,
      0.03
    );

    // ── Scroll-based fade (opacity on all materials) ──
    const fade = scrollFade.current;
    groupRef.current.visible = fade > 0.01;

    // ── Hover glow + click pulse glow ──
    const targetGlow = hovered.current ? 0.15 : 0;
    glowIntensity.current = THREE.MathUtils.lerp(
      glowIntensity.current,
      targetGlow,
      0.08
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
  const scrollFade = useScrollFade();
  const { pulse, active, trigger } = useClickPulse();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[2]"
      style={{ opacity: 0.9 }}
      onClick={trigger}
    >
      <Canvas
        camera={{ position: [0, 0.5, 5.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Lighting />
        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.3}>
            <CharacterModel
              scrollFade={scrollFade}
              pulse={pulse}
              active={active}
            />
          </Float>
          <GlitchRing pulse={pulse} active={active} />
          <AmbientParticles scrollFade={scrollFade} />
          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload("/models/character.glb");
