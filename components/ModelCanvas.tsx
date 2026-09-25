"use client";

import { Suspense, useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Float, Environment } from "@react-three/drei";
import * as THREE from "three";

// ── Cursor tracker — smoothly follows mouse position ──
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
      0.04
    );
    smoothed.current.y = THREE.MathUtils.lerp(
      smoothed.current.y,
      mouse.current.y,
      0.04
    );
  });

  return smoothed;
}

// ── Scroll offset tracker ──
function useScrollOffset() {
  const offset = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      offset.current = window.scrollY / window.innerHeight;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return offset;
}

// ── Ambient floating particles around the character ──
function AmbientParticles() {
  const meshRef = useRef<THREE.Points>(null);
  const count = 60;

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
        size={0.03}
        color="#22d3ee"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ── Character model ──
function CharacterModel() {
  const { scene } = useGLTF("/models/character.glb");
  const groupRef = useRef<THREE.Group>(null);
  const cursor = useCursorTracker();
  const scrollOffset = useScrollOffset();
  const baseY = useRef(0);

  // Clone the scene so React Three Fiber can manage it
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    // Apply toon-like materials for the anime aesthetic
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          // Keep original colors but make them pop with some emissive
          if (mat.color) {
            mat.roughness = 0.8;
            mat.metalness = 0.1;
          }
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    return clone;
  }, [scene]);

  // Find a good scale and position on mount
  useEffect(() => {
    if (!groupRef.current) return;
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Scale to fit nicely — target ~4 units tall
    const targetHeight = 4;
    const scale = targetHeight / size.y;
    groupRef.current.scale.setScalar(scale);

    // Center the model and place feet near the bottom
    groupRef.current.position.x = -center.x * scale;
    groupRef.current.position.z = -center.z * scale;
    baseY.current = -center.y * scale + (-size.y / 2) * scale + 0.2;
    groupRef.current.position.y = baseY.current;
  }, [clonedScene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Subtle rotation following cursor
    const targetRotY = cursor.current.x * 0.3;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotY,
      0.03
    );

    // Gentle idle breathing sway
    const breathe = Math.sin(t * 1.2) * 0.02;
    groupRef.current.position.y =
      baseY.current + breathe - scrollOffset.current * 1.5;

    // Fade out as user scrolls
    groupRef.current.visible = scrollOffset.current < 2;
  });

  return (
    <group ref={groupRef}>
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
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[2] pointer-events-none"
      style={{ opacity: 0.9 }}
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
            <CharacterModel />
          </Float>
          <AmbientParticles />
          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload("/models/character.glb");
