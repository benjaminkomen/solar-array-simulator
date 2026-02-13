import { useMemo } from "react";
import * as THREE from "three/webgpu";
import type { RoofType } from "@/utils/configStore";

interface RoofModelProps {
  roofType: RoofType;
  width: number;
  depth: number;
  tiltAngle: number; // degrees
}

const ROOF_COLOR = "#8B7355";
const WALL_COLOR = "#D4C5A9";

/**
 * 3D roof geometry based on roof type.
 * The roof is centered at the origin, sitting on Y=0.
 */
export function RoofModel({ roofType, width, depth, tiltAngle }: RoofModelProps) {
  switch (roofType) {
    case "flat":
      return <FlatRoof width={width} depth={depth} tiltAngle={tiltAngle} />;
    case "gable":
      return <GableRoof width={width} depth={depth} tiltAngle={tiltAngle} />;
    case "hip":
      return <HipRoof width={width} depth={depth} tiltAngle={tiltAngle} />;
    case "shed":
      return <ShedRoof width={width} depth={depth} tiltAngle={tiltAngle} />;
  }
}

function FlatRoof({ width, depth, tiltAngle }: Omit<RoofModelProps, "roofType">) {
  const wallHeight = 1.5;
  const tiltRad = (tiltAngle * Math.PI) / 180;
  const rise = width * Math.sin(tiltRad) * 0.5;

  return (
    <group>
      {/* Walls */}
      <mesh position={[0, wallHeight / 2, 0]}>
        <boxGeometry args={[width + 0.2, wallHeight, depth + 0.2]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* Roof surface — slight tilt */}
      <mesh
        position={[0, wallHeight + rise / 2, 0]}
        rotation={[0, 0, -tiltRad * 0.1]}
      >
        <boxGeometry args={[width + 0.4, 0.1, depth + 0.4]} />
        <meshStandardMaterial color={ROOF_COLOR} />
      </mesh>
    </group>
  );
}

function safeSlopeLength(halfWidth: number, tiltRad: number): number {
  const cosTilt = Math.cos(tiltRad);
  if (Math.abs(cosTilt) < 0.001) return halfWidth * 100; // Near-vertical fallback
  return halfWidth / cosTilt;
}

function GableRoof({ width, depth, tiltAngle }: Omit<RoofModelProps, "roofType">) {
  const wallHeight = 1.5;
  const tiltRad = (tiltAngle * Math.PI) / 180;
  const ridgeHeight = (width / 2) * Math.tan(Math.min(tiltAngle, 89) * Math.PI / 180);
  const slopeLength = safeSlopeLength(width / 2, tiltRad);

  const leftGeom = useMemo(() => {
    const geom = new THREE.PlaneGeometry(slopeLength, depth + 0.4);
    return geom;
  }, [slopeLength, depth]);

  const rightGeom = useMemo(() => {
    const geom = new THREE.PlaneGeometry(slopeLength, depth + 0.4);
    return geom;
  }, [slopeLength, depth]);

  return (
    <group>
      {/* Walls */}
      <mesh position={[0, wallHeight / 2, 0]}>
        <boxGeometry args={[width + 0.2, wallHeight, depth + 0.2]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* Left slope */}
      <mesh
        position={[-width / 4, wallHeight + ridgeHeight / 2, 0]}
        rotation={[0, 0, tiltRad]}
        geometry={leftGeom}
      >
        <meshStandardMaterial color={ROOF_COLOR} side={THREE.DoubleSide} />
      </mesh>
      {/* Right slope */}
      <mesh
        position={[width / 4, wallHeight + ridgeHeight / 2, 0]}
        rotation={[0, 0, -tiltRad]}
        geometry={rightGeom}
      >
        <meshStandardMaterial color={ROOF_COLOR} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function HipRoof({ width, depth, tiltAngle }: Omit<RoofModelProps, "roofType">) {
  const wallHeight = 1.5;
  const tiltRad = (tiltAngle * Math.PI) / 180;
  const ridgeHeight = (width / 2) * Math.tan(Math.min(tiltAngle, 89) * Math.PI / 180);
  const ridgeLength = Math.max(0, depth - width) * 0.6;
  const slopeLength = safeSlopeLength(width / 2, tiltRad);

  return (
    <group>
      {/* Walls */}
      <mesh position={[0, wallHeight / 2, 0]}>
        <boxGeometry args={[width + 0.2, wallHeight, depth + 0.2]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* Front and back slopes (along Z) */}
      <mesh
        position={[-width / 4, wallHeight + ridgeHeight / 2, 0]}
        rotation={[0, 0, tiltRad]}
      >
        <planeGeometry args={[slopeLength, ridgeLength > 0 ? ridgeLength + width * 0.3 : depth * 0.7]} />
        <meshStandardMaterial color={ROOF_COLOR} side={THREE.DoubleSide} />
      </mesh>
      <mesh
        position={[width / 4, wallHeight + ridgeHeight / 2, 0]}
        rotation={[0, 0, -tiltRad]}
      >
        <planeGeometry args={[slopeLength, ridgeLength > 0 ? ridgeLength + width * 0.3 : depth * 0.7]} />
        <meshStandardMaterial color={ROOF_COLOR} side={THREE.DoubleSide} />
      </mesh>
      {/* End slopes (triangular, approximated with planes) */}
      <mesh
        position={[0, wallHeight + ridgeHeight / 2, depth / 2]}
        rotation={[tiltRad, 0, 0]}
      >
        <planeGeometry args={[width * 0.8, slopeLength * 0.5]} />
        <meshStandardMaterial color={ROOF_COLOR} side={THREE.DoubleSide} />
      </mesh>
      <mesh
        position={[0, wallHeight + ridgeHeight / 2, -depth / 2]}
        rotation={[-tiltRad, 0, 0]}
      >
        <planeGeometry args={[width * 0.8, slopeLength * 0.5]} />
        <meshStandardMaterial color={ROOF_COLOR} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function ShedRoof({ width, depth, tiltAngle }: Omit<RoofModelProps, "roofType">) {
  const wallHeight = 1.5;
  const tiltRad = (tiltAngle * Math.PI) / 180;
  const rise = width * Math.sin(tiltRad);
  const slopeLength = safeSlopeLength(width, tiltRad);

  return (
    <group>
      {/* Walls — taller on one side */}
      <mesh position={[0, (wallHeight + rise / 2) / 2, 0]}>
        <boxGeometry args={[width + 0.2, wallHeight + rise / 2, depth + 0.2]} />
        <meshStandardMaterial color={WALL_COLOR} />
      </mesh>
      {/* Single slope */}
      <mesh
        position={[0, wallHeight + rise / 2, 0]}
        rotation={[0, 0, -tiltRad]}
      >
        <planeGeometry args={[slopeLength, depth + 0.4]} />
        <meshStandardMaterial color={ROOF_COLOR} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
