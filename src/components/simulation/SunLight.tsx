import { useRef } from "react";
import * as THREE from "three/webgpu";
import { useFrame } from "@react-three/fiber";

interface SunLightProps {
  /** Sun position in world coordinates */
  position: { x: number; y: number; z: number };
  /** Light intensity (0-1 range based on irradiance) */
  intensity: number;
}

const SUN_COLOR = new THREE.Color(0xfff4e6);

export function SunLight({ position, intensity }: SunLightProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null!);
  const sphereRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.position.set(position.x, position.y, position.z);
      lightRef.current.intensity = Math.max(0, intensity);
    }
    if (sphereRef.current) {
      sphereRef.current.position.set(position.x, position.y, position.z);
      // Fade sphere when below horizon
      const opacity = position.y > 0 ? Math.min(1, position.y / 5) : 0;
      (sphereRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  });

  return (
    <>
      <directionalLight
        ref={lightRef}
        position={[position.x, position.y, position.z]}
        intensity={intensity}
        color={SUN_COLOR}
      />
      {/* Visual sun sphere */}
      <mesh ref={sphereRef} position={[position.x, position.y, position.z]}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial
          color={0xffdd44}
          transparent
          opacity={position.y > 0 ? 1 : 0}
        />
      </mesh>
    </>
  );
}
