import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, MeshReflectorMaterial } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import * as THREE from "three";
import { Bars } from "./Bars";
import { Ring } from "./Ring";
import { Particles } from "./Particles";
import { authFx } from "./fx";

function Rig({ still, mobile }: { still: boolean; mobile: boolean }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05); const cam = state.camera;
    const orbit = authFx.mode === "up" ? 0.35 : 0;
    const max = THREE.MathUtils.degToRad(5);
    const ax = still ? 0 : authFx.mouseX * max, ay = still ? 0 : authFx.mouseY * max;
    const ang = THREE.MathUtils.damp((cam.userData.ang as number) ?? 0, orbit + ax, 3, d);
    cam.userData.ang = ang;
    const r = mobile ? 7.5 : 8, cx = mobile ? -2.6 : 0;
    cam.position.set(cx + Math.sin(ang) * r, 1 + ay * 6, Math.cos(ang) * r);
    cam.lookAt(mobile ? -2.6 : 0, 0.2, 0);
    if (light.current) light.current.intensity = THREE.MathUtils.damp(light.current.intensity, 30 + authFx.focus * 40, 4, d);
  });
  return <pointLight ref={light} position={[-2.6, 3, 2]} color="#a855f7" intensity={30} distance={14} />;
}

export default function Scene({ low, mobile, onReady }: { low: boolean; mobile: boolean; onReady?: () => void }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const h = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", h); return () => document.removeEventListener("visibilitychange", h);
  }, []);
  return (
    <Canvas dpr={[1, low ? 1.25 : 1.75]} frameloop={visible ? "always" : "never"} camera={{ fov: 42, position: [0, 1, 8] }}
      gl={{ antialias: !low, powerPreference: "high-performance" }} onCreated={() => onReady?.()}>
      <color attach="background" args={["#07060d"]} />
      <fog attach="fog" args={["#07060d", 7, 20]} />
      <ambientLight intensity={0.25} />
      <pointLight position={[2, 2, 3]} color="#d946ef" intensity={18} distance={12} />
      <Rig still={low} mobile={mobile} />
      <Bars still={false} />
      <Ring still={low} />
      <Particles count={low ? 120 : 420} still={low} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -1.21, 0]}>
        <planeGeometry args={[40, 40]} />
        {low ? <meshStandardMaterial color="#0b0914" roughness={0.6} /> :
          <MeshReflectorMaterial resolution={512} mirror={0.6} blur={[300, 80]} mixBlur={1} mixStrength={2} roughness={0.8} color="#0b0914" metalness={0.5} />}
      </mesh>
      <Grid position={[0, -1.2, 0]} args={[40, 40]} cellColor="#2e1065" sectionColor="#6d28d9" sectionSize={3} fadeDistance={22} fadeStrength={1.5} infiniteGrid />
      {!low && (
        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.5} mipmapBlur />
          <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0006)} radialModulation={false} modulationOffset={0} />
          <Vignette darkness={0.65} offset={0.3} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
