import { useRef } from "react";
import * as THREE from "three/webgpu";
import { useFrame } from "@react-three/fiber";

interface PanelMeshProps {
  /** World position on the roof surface */
  position: [number, number, number];
  /** Panel dimensions in world units */
  width: number;
  height: number;
  /** Rotation around Y axis in radians */
  rotationY?: number;
  /** Tilt angle matching roof slope in radians */
  tiltX?: number;
  /** Current wattage output (for color coding) */
  wattage: number;
  /** Maximum possible wattage */
  maxWattage: number;
}

const PANEL_THICKNESS = 0.05;

// Colors matching production screen coding
const COLOR_HIGH = new THREE.Color(0x22c55e); // Green: >80%
const COLOR_MED = new THREE.Color(0xeab308); // Yellow: 40-80%
const COLOR_LOW = new THREE.Color(0xef4444); // Red: <40%
const COLOR_OFF = new THREE.Color(0x6b7280); // Gray: 0W / unlinked

export function PanelMesh({
  position,
  width,
  height,
  rotationY = 0,
  tiltX = 0,
  wattage,
  maxWattage,
}: PanelMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame(() => {
    if (!materialRef.current) return;
    const ratio = maxWattage > 0 ? wattage / maxWattage : 0;
    let color: THREE.Color;
    if (wattage <= 0) {
      color = COLOR_OFF;
    } else if (ratio > 0.8) {
      color = COLOR_HIGH;
    } else if (ratio > 0.4) {
      color = COLOR_MED;
    } else {
      color = COLOR_LOW;
    }
    materialRef.current.color.lerp(color, 0.1);
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[tiltX, rotationY, 0]}
    >
      <boxGeometry args={[width, PANEL_THICKNESS, height]} />
      <meshStandardMaterial
        ref={materialRef}
        color={COLOR_OFF}
        metalness={0.6}
        roughness={0.3}
      />
    </mesh>
  );
}
