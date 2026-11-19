import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { authFx } from "./fx";

export function Particles({ count, still }: { count: number; still: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 16, y: Math.random() * 8 - 3, z: -Math.random() * 10 + 2,
    s: 0.6 + Math.random() * 1.2, v: 0.15 + Math.random() * 0.35, ph: Math.random() * 6.28,
  })), [count]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame((state, dt) => {
    const m = mesh.current; if (!m) return;
    const d = still ? 0 : Math.min(dt, 0.05);
    const boost = 1 + Math.max(0, authFx.burst - Date.now() / 1000) * 8;
    const t = state.clock.elapsedTime;
    data.forEach((p, i) => {
      p.y += p.v * d * boost;
      if (p.y > 5) p.y = -3;
      o.position.set(p.x + Math.sin(t * 0.5 + p.ph) * 0.2, p.y, p.z);
      // distant embers are drawn larger and fainter-looking (cheap depth-of-field)
      const blur = p.z < -4 ? 1.8 : 1;
      o.scale.setScalar(0.022 * p.s * blur);
      o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#f0abfc" transparent opacity={0.8} toneMapped={false} />
    </instancedMesh>
  );
}
