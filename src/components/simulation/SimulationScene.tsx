import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { RoofModel } from "./RoofModel";
import { PanelMesh } from "./PanelMesh";
import { SunLight } from "./SunLight";
import type { RoofType } from "@/utils/configStore";
import {
  getSolarPosition,
  getSun3DPosition,
  calculateIrradiance,
  type Season,
  getSeasonDate,
  makeDateAtHour,
} from "@/utils/solarCalculations";
import { PANEL_WIDTH, PANEL_HEIGHT } from "@/utils/panelUtils";

interface PanelInfo {
  id: string;
  x: number;
  y: number;
  rotation: 0 | 90;
  inverterId: string | null;
}

interface SimulationSceneProps {
  panels: PanelInfo[];
  roofType: RoofType;
  tiltAngle: number;
  compassDirection: number;
  latitude: number;
  longitude: number;
  season: Season;
  /** Current time as fractional UTC hour (e.g. 14.5 = 2:30 PM UTC) */
  currentHour: number;
  /** Map of panelId -> current wattage */
  wattages: Map<string, number>;
  maxWattage: number;
}

// Scale factor to convert 2D pixel coordinates to 3D world units
const SCALE = 0.05;

export function SimulationScene({
  panels,
  roofType,
  tiltAngle,
  compassDirection,
  latitude,
  longitude,
  season,
  currentHour,
  wattages,
  maxWattage,
}: SimulationSceneProps) {
  const { camera } = useThree();

  // Calculate roof dimensions from panel bounding box
  const roofDimensions = useMemo(() => {
    if (panels.length === 0) return { width: 6, depth: 8 };

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const panel of panels) {
      const pw = panel.rotation === 90 ? PANEL_HEIGHT : PANEL_WIDTH;
      const ph = panel.rotation === 90 ? PANEL_WIDTH : PANEL_HEIGHT;
      minX = Math.min(minX, panel.x);
      minY = Math.min(minY, panel.y);
      maxX = Math.max(maxX, panel.x + pw);
      maxY = Math.max(maxY, panel.y + ph);
    }

    const w = (maxX - minX) * SCALE + 2;
    const d = (maxY - minY) * SCALE + 2;
    return { width: Math.max(4, w), depth: Math.max(4, d), minX, minY, maxX, maxY };
  }, [panels]);

  // Center point of panels in 2D space
  const panelCenter = useMemo(() => {
    if (panels.length === 0) return { x: 0, z: 0 };
    const rd = roofDimensions as typeof roofDimensions & { minX?: number; minY?: number; maxX?: number; maxY?: number };
    if (rd.minX === undefined) return { x: 0, z: 0 };
    return {
      x: ((rd.minX! + rd.maxX!) / 2) * SCALE,
      z: ((rd.minY! + rd.maxY!) / 2) * SCALE,
    };
  }, [panels, roofDimensions]);

  // Sun position
  const sunData = useMemo(() => {
    const date = makeDateAtHour(getSeasonDate(season), currentHour);
    const pos = getSolarPosition(latitude, longitude, date);
    const pos3D = getSun3DPosition(pos.elevation, pos.azimuth, 40);
    const irradiance = calculateIrradiance(pos.elevation);
    return { position: pos3D, intensity: irradiance / 500, elevation: pos.elevation, azimuth: pos.azimuth };
  }, [latitude, longitude, season, currentHour]);

  // Set camera position
  useEffect(() => {
    camera.position.set(8, 10, 12);
    camera.lookAt(0, 1.5, 0);
  }, [camera]);

  const tiltRad = (tiltAngle * Math.PI) / 180;
  const wallHeight = 1.5;
  const roofSurfaceY = wallHeight + 0.15; // Slightly above roof surface

  return (
    <>
      {/* Ambient light — always on for visibility */}
      <ambientLight intensity={0.3} />

      {/* Sun */}
      <SunLight position={sunData.position} intensity={sunData.intensity} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#4a7c59" />
      </mesh>

      {/* Roof */}
      <RoofModel
        roofType={roofType}
        width={roofDimensions.width}
        depth={roofDimensions.depth}
        tiltAngle={tiltAngle}
      />

      {/* Panels on roof */}
      {panels.map((panel) => {
        const pw = panel.rotation === 90 ? PANEL_HEIGHT : PANEL_WIDTH;
        const ph = panel.rotation === 90 ? PANEL_WIDTH : PANEL_HEIGHT;

        // Convert 2D position to 3D roof coordinates
        const cx = (panel.x + pw / 2) * SCALE - panelCenter.x;
        const cz = (panel.y + ph / 2) * SCALE - panelCenter.z;

        const panelW = pw * SCALE;
        const panelH = ph * SCALE;

        return (
          <PanelMesh
            key={panel.id}
            position={[cx, roofSurfaceY, cz]}
            width={panelW}
            height={panelH}
            tiltX={roofType === "flat" ? 0 : -tiltRad * 0.2}
            wattage={wattages.get(panel.id) ?? 0}
            maxWattage={maxWattage}
          />
        );
      })}
    </>
  );
}
