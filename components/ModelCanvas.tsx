"use client";

import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import * as THREE from "three";

/**
 * 3D MODEL SCAFFOLD
 *
 * This component is ready for your custom character model.
 * To add your model:
 *
 * 1. Export your 3D model as .glb or .gltf
 * 2. Place it in /public/models/character.glb
 * 3. Uncomment the CharacterModel component below
 * 4. The model will automatically follow the cursor and scroll
 *
 * Currently shows animated floating particles as a placeholder.
 */

// ── Cursor tracker — makes an object smoothly look at the mouse ──
function useCursorTracker() {
  const mouse = useRef(new THREE.Vector2(0, 0));
  const target = useRef(new THREE.Vector3(0, 0, 5));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame(() => {
    target.current.x = THREE.MathUtils.lerp(
      target.current.x,
      mouse.current.x * 3,
      0.05
    );
    target.current.y = THREE.MathUtils.lerp(
      target.current.y,
      mouse.current.y * 2,
      0.05
    );
  });

  return target;
}

// ── Scroll tracker — shifts the model Y position with scroll ──
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

// ── Placeholder particles — replace with your character model ──
function FloatingParticles() {
  const meshRef = useRef<THREE.Points>(null);
  const cursorTarget = useCursorTracker();
  const scrollOffset = useScrollOffset();
  const count = 120;

  const positions = useRef<Float32Array>();
  const sizes = useRef<Float32Array>();

  if (!positions.current) {
    positions.current = new Float32Array(count * 3);
    sizes.current = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions.current[i * 3] = (Math.random() - 0.5) * 12;
      positions.current[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions.current[i * 3 + 2] = (Math.random() - 0.5) * 8;
      sizes.current[i] = Math.random() * 3 + 1;
    }
  }

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Gentle rotation influenced by cursor
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      cursorTarget.current.x * 0.3,
      0.02
    );
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      cursorTarget.current.y * 0.2 + t * 0.05,
      0.02
    );

    // Scroll offset moves particles up
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      -scrollOffset.current * 2,
      0.05
    );
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.current}
          itemSize={3}
          args={[positions.current, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes.current!}
          itemSize={1}
          args={[sizes.current!, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#7c5cfc"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/*
// ── YOUR CHARACTER MODEL — uncomment when ready ──
// 1. Install: npx gltfjsx public/models/character.glb
// 2. Import the generated component, or use useGLTF directly:
//
// import { useGLTF } from "@react-three/drei";
//
// function CharacterModel() {
//   const { scene } = useGLTF("/models/character.glb");
//   const modelRef = useRef<THREE.Group>(null);
//   const cursorTarget = useCursorTracker();
//   const scrollOffset = useScrollOffset();
//
//   useFrame(() => {
//     if (!modelRef.current) return;
//     // Look toward cursor
//     modelRef.current.lookAt(cursorTarget.current);
//     // Follow scroll
//     modelRef.current.position.y = THREE.MathUtils.lerp(
//       modelRef.current.position.y,
//       -scrollOffset.current * 2 + 0.5,
//       0.05
//     );
//   });
//
//   return (
//     <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
//       <primitive ref={modelRef} object={scene} scale={1.2} />
//     </Float>
//   );
// }
*/

// ── Ambient light rig ──
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#7c5cfc" />
      <pointLight position={[-5, -5, 3]} intensity={0.3} color="#a78bfa" />
    </>
  );
}

// ── Main canvas ──
export function ModelCanvas() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.7 }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Lighting />
        <Suspense fallback={null}>
          <FloatingParticles />
          {/* Replace FloatingParticles with <CharacterModel /> when ready */}
          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  );
}
