import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { authFx } from "./fx";

export function Ring({ still }: { still: boolean }) {
  const g = useRef<THREE.Group>(null);
  const speed = useRef(0.25);
  useFrame((_, dt) => {
    if (!g.current || still) return;
    const d = Math.min(dt, 0.05);
    speed.current = THREE.MathUtils.damp(speed.current, 0.25 + authFx.focus * 1.4, 4, d);
    g.current.rotation.y += speed.current * d;
    g.current.rotation.x = Math.sin(performance.now() / 3000) * 0.15 + 1.2;
  });
  return (
    <group ref={g} position={[-2.6, 0.3, 0]} rotation={[1.2, 0, 0]}>
      <mesh>
        <torusGeometry args={[2.6, 0.035, 16, 160]} />
        <meshStandardMaterial color="#e9d5ff" emissive="#c026d3" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
    </group>
  );
}
