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

const WARM_SUN = new THREE.Color(0xffaa44);
const WHITE_SUN = new THREE.Color(0xfff8e7);
const WARM_LIGHT = new THREE.Color(0xffcc88);
const WHITE_LIGHT = new THREE.Color(0xfff4e6);

/** Glow layers: radius and base opacity, from inner to outer */
const GLOW_LAYERS = [
  { radius: 3.0, baseOpacity: 0.45 },
  { radius: 4.5, baseOpacity: 0.25 },
  { radius: 7.0, baseOpacity: 0.12 },
  { radius: 10.0, baseOpacity: 0.05 },
  { radius: 14.0, baseOpacity: 0.02 },
];

function updateSunMaterials(
  group: THREE.Group,
  posX: number,
  posY: number,
  posZ: number,
  elevation: number,
): void {
  group.position.set(posX, posY, posZ);

  const aboveHorizon = posY > 0;
  const horizonFade = aboveHorizon ? Math.min(1, posY / 3) : 0;
  const colorT = Math.min(1, Math.max(0, elevation / 30));

  // Child 0 = core sphere
  const core = group.children[0] as THREE.Mesh;
  if (core) {
    const mat = core.material as THREE.MeshBasicMaterial;
    mat.opacity = horizonFade;
    mat.color.copy(WARM_SUN).lerp(WHITE_SUN, colorT);
  }

  // Children 1..N = glow layers
  for (let i = 0; i < GLOW_LAYERS.length; i++) {
    const mesh = group.children[i + 1] as THREE.Mesh | undefined;
    if (!mesh) continue;
    const mat = mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = GLOW_LAYERS[i].baseOpacity * horizonFade;
    mat.color.copy(WARM_SUN).lerp(WHITE_SUN, colorT * 0.6);
  }
}

function updateDirectionalLight(
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

export function SunLight({ position, intensity, elevation }: SunLightProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null!);
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (lightRef.current) {
      updateDirectionalLight(
        lightRef.current,
        position.x,
        position.y,
        position.z,
        intensity,
        elevation,
      );
    }
    if (groupRef.current) {
      updateSunMaterials(
        groupRef.current,
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
      <group ref={groupRef} position={[position.x, position.y, position.z]}>
        {/* Core — bright, solid center */}
        <mesh>
          <sphereGeometry args={[2, 64, 64]} />
          <meshBasicMaterial
            color={0xfff8e7}
            transparent
            opacity={1}
            depthWrite={false}
          />
        </mesh>
        {/* Glow layers — progressively larger and more transparent */}
        {GLOW_LAYERS.map((layer) => (
          <mesh key={layer.radius}>
            <sphereGeometry args={[layer.radius, 32, 32]} />
            <meshBasicMaterial
              color={0xffdd88}
              transparent
              opacity={layer.baseOpacity}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}
