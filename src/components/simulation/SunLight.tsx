import { useRef } from "react";
import * as THREE from "three/webgpu";
import { useFrame } from "@react-three/fiber";

interface SunLightProps {
  /** Sun position in world coordinates */
  position: { x: number; y: number; z: number };
  /** Light intensity based on irradiance */
  intensity: number;
  /** Real solar elevation in degrees (for color temperature) */
  elevation: number;
}

const WARM_LIGHT = new THREE.Color(0xffcc88);
const WHITE_LIGHT = new THREE.Color(0xfff4e6);

function updateLight(
  light: THREE.DirectionalLight,
  posX: number,
  posY: number,
  posZ: number,
  intensity: number,
  elevation: number,
): void {
  light.position.set(posX, posY, posZ);
  light.intensity = Math.max(0, intensity);
  const t = Math.min(1, Math.max(0, elevation / 30));
  light.color.copy(WARM_LIGHT).lerp(WHITE_LIGHT, t);
}

function updateSunMesh(
  mesh: THREE.Mesh,
  posX: number,
  posY: number,
  posZ: number,
  elevation: number,
): void {
  mesh.position.set(posX, posY, posZ);
  const mat = mesh.material as THREE.MeshBasicMaterial;

  // Fade when below horizon
  mat.opacity = posY > 0 ? Math.min(1, posY / 3) : 0;

  // Warm orange near horizon, bright white-yellow when high
  const t = Math.min(1, Math.max(0, elevation / 30));
  // Brightness > 1.0 ensures bloom catches this (toneMapped: false)
  const brightness = 1.2 + t * 0.3;
  mat.color.setRGB(brightness, brightness * 0.88, brightness * 0.55);
}

export function SunLight({ position, intensity, elevation }: SunLightProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (lightRef.current) {
      updateLight(
        lightRef.current,
        position.x,
        position.y,
        position.z,
        intensity,
        elevation,
      );
    }
    if (meshRef.current) {
      updateSunMesh(
        meshRef.current,
        position.x,
        position.y,
        position.z,
        elevation,
      );
    }
  });

  return (
    <>
      <directionalLight
        ref={lightRef}
        position={[position.x, position.y, position.z]}
        intensity={intensity}
        color={WHITE_LIGHT}
      />
      {/* Sun sphere — toneMapped: false pushes color above bloom threshold */}
      <mesh ref={meshRef} position={[position.x, position.y, position.z]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color={0xffdd88}
          toneMapped={false}
          transparent
          depthWrite={true}
          fog={false}
        />
      </mesh>
    </>
  );
}
