import { useEffect, useMemo } from "react";
import * as THREE from "three/webgpu";
import { useThree } from "@react-three/fiber";
import { SunLight } from "./SunLight";
import {
  getSolarPosition,
  getSun3DPosition,
  calculateIrradiance,
  type Season,
  getSeasonDate,
  makeDateAtHour,
} from "@/utils/solarCalculations";

interface SimulationSceneProps {
  latitude: number;
  longitude: number;
  season: Season;
  currentHour: number;
}

const NIGHT_COLOR = new THREE.Color(0x0c1445);
const DAWN_COLOR = new THREE.Color(0xff7b54);
const DAY_COLOR = new THREE.Color(0x87ceeb);

function getSkyColor(elevation: number): THREE.Color {
  if (elevation < -6) {
    return NIGHT_COLOR.clone();
  }
  if (elevation < 0) {
    const t = (elevation + 6) / 6;
    return NIGHT_COLOR.clone().lerp(DAWN_COLOR, t);
  }
  if (elevation < 10) {
    const t = elevation / 10;
    return DAWN_COLOR.clone().lerp(DAY_COLOR, t);
  }
  return DAY_COLOR.clone();
}

function applySceneBackground(
  scene: THREE.Scene,
  elevation: number,
): void {
  scene.background = getSkyColor(elevation);
}

function applyCameraPosition(camera: THREE.Camera): void {
  camera.position.set(0, 3, -20);
  camera.lookAt(0, 10, 15);
}

export function SimulationScene({
  latitude,
  longitude,
  season,
  currentHour,
}: SimulationSceneProps) {
  const { camera, scene } = useThree();

  // Calculate sun position using existing solar utilities
  const sunData = useMemo(() => {
    const date = makeDateAtHour(getSeasonDate(season), currentHour);
    const pos = getSolarPosition(latitude, longitude, date);
    const pos3D = getSun3DPosition(pos.elevation, pos.azimuth, 30);
    const irradiance = calculateIrradiance(pos.elevation);
    return {
      position: pos3D,
      intensity: irradiance / 500,
      elevation: pos.elevation,
    };
  }, [latitude, longitude, season, currentHour]);

  // Fixed camera: north side looking south so sun arc sweeps left-to-right
  useEffect(() => {
    applyCameraPosition(camera);
  }, [camera]);

  // Dynamic sky color based on sun elevation
  useEffect(() => {
    applySceneBackground(scene, sunData.elevation);
  }, [scene, sunData.elevation]);

  const ambientIntensity =
    0.3 + Math.max(0, sunData.elevation / 90) * 0.2;

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <SunLight position={sunData.position} intensity={sunData.intensity} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#3a6b35" />
      </mesh>
    </>
  );
}
