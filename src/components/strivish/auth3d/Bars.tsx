import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { authFx } from "./fx";

const HEIGHTS = [0.9, 1.4, 1.1, 1.9, 1.6, 2.3, 2.9];
const GAP = 0.62;

export function Bars({ still }: { still: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const t0 = useRef<number | null>(null);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (t0.current === null) t0.current = t;
    const since = t - t0.current;
    const burstK = Math.max(0, authFx.burst - (Date.now() / 1000));
    refs.current.forEach((g, i) => {
      if (!g) return;
      const rise = still ? 1 : THREE.MathUtils.smoothstep(since - i * 0.12, 0, 0.7);
      const x = (i - 3) * GAP;
      const near = Math.max(0, 1 - Math.abs(authFx.mouseX * 2.2 - x) / 0.9) * (still ? 0 : 0.35);
      const bob = still ? 0 : Math.sin(t * 1.3 + i * 0.7) * 0.05;
      const target = HEIGHTS[i] * rise * (1 + burstK * 1.6) + near;
      g.scale.y = THREE.MathUtils.damp(g.scale.y, Math.max(target, 0.001), 8, Math.min(dt, 0.05));
      g.position.y = bob;
    });
  });
  return (
    <group position={[-2.6, -1.2, 0]}>
      {HEIGHTS.map((_, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }} position={[(i - 3) * GAP, 0, 0]} scale={[1, 0.001, 1]}>
          <RoundedBox args={[0.42, 1, 0.42]} radius={0.08} position={[0, 0.5, 0]}>
            <meshPhysicalMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={0.25 + i * 0.1} roughness={0.12} metalness={0.2} transmission={0.55} thickness={0.6} clearcoat={1} ior={1.4} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}
