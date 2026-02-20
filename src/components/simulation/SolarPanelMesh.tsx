interface SolarPanelMeshProps {
  position: [number, number, number];
  width: number;
  height: number;
}

const PANEL_THICKNESS = 0.05;

export function SolarPanelMesh({ position, width, height }: SolarPanelMeshProps) {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, PANEL_THICKNESS, height]} />
      <meshStandardMaterial color="#3b82f6" metalness={0.2} roughness={0.7} />
    </mesh>
  );
}
