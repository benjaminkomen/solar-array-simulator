import { useEffect, useMemo } from "react";
import * as THREE from "three/webgpu";
import { useThree } from "@react-three/fiber";
import { SunLight } from "./SunLight";
import {
  getSolarPosition,
  calculateIrradiance,
  getSunriseAndSunset,
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

const NIGHT_COLOR = new THREE.Color(0x1a1a2e);
const HORIZON_COLOR = new THREE.Color(0x4a3a5e);
const DAWN_COLOR = new THREE.Color(0xc4856b);
const DAY_COLOR = new THREE.Color(0x87ceeb);

function getSkyColor(elevation: number): THREE.Color {
  if (elevation < -6) {
    return NIGHT_COLOR.clone();
  }
  if (elevation < 0) {
    const t = (elevation + 6) / 6;
    return NIGHT_COLOR.clone().lerp(HORIZON_COLOR, t);
  }
  if (elevation < 8) {
    const t = elevation / 8;
    return HORIZON_COLOR.clone().lerp(DAWN_COLOR, t);
  }
  if (elevation < 20) {
    const t = (elevation - 8) / 12;
    return DAWN_COLOR.clone().lerp(DAY_COLOR, t);
  }
  return DAY_COLOR.clone();
}

/**
 * Visual sun position: a simple left-to-right arc across the viewport.
 * Uses real peak elevation so the arc is higher in summer, lower in winter.
 */
function getVisualSunPosition(
  sunriseHour: number,
  sunsetHour: number,
  currentHour: number,
  peakElevationDeg: number,
): { x: number; y: number; z: number } {
  const dayLength = sunsetHour - sunriseHour;
  const t = dayLength > 0 ? (currentHour - sunriseHour) / dayLength : 0.5;
  const clamped = Math.max(0, Math.min(1, t));
  const angle = clamped * Math.PI; // 0 at sunrise → π at sunset

  const arcWidth = 20;
  const maxHeight =
    15 * Math.sin(Math.min(peakElevationDeg, 75) * (Math.PI / 180));

  return {
    x: arcWidth * Math.cos(angle),
    y: Math.max(0.5, maxHeight * Math.sin(angle)),
    z: 25,
  };
}

function applySceneBackground(scene: THREE.Scene, elevation: number): void {
  scene.background = getSkyColor(elevation);
}

function applyCameraPosition(camera: THREE.Camera): void {
  camera.position.set(0, 2, -5);
  camera.lookAt(0, 10, 25);
}

export function SimulationScene({
  latitude,
  longitude,
  season,
  currentHour,
}: SimulationSceneProps) {
  const { camera, scene } = useThree();

  const { sunriseHour, sunsetHour } = useMemo(() => {
    const date = getSeasonDate(season);
    return getSunriseAndSunset(latitude, longitude, date);
  }, [latitude, longitude, season]);

  // Real solar data for sky color and light intensity
  const solarData = useMemo(() => {
    const date = makeDateAtHour(getSeasonDate(season), currentHour);
    const pos = getSolarPosition(latitude, longitude, date);
    const irradiance = calculateIrradiance(pos.elevation);
    return {
      elevation: pos.elevation,
      intensity: irradiance / 300,
    };
  }, [latitude, longitude, season, currentHour]);

  // Peak solar elevation determines the arc height (higher in summer)
  const peakElevation = useMemo(() => {
    const noonHour = (sunriseHour + sunsetHour) / 2;
    const date = makeDateAtHour(getSeasonDate(season), noonHour);
    const pos = getSolarPosition(latitude, longitude, date);
    return pos.elevation;
  }, [latitude, longitude, season, sunriseHour, sunsetHour]);

  // Visual sun position: always in view, sweeping left to right
  const sunPosition = useMemo(
    () =>
      getVisualSunPosition(
        sunriseHour,
        sunsetHour,
        currentHour,
        peakElevation,
      ),
    [sunriseHour, sunsetHour, currentHour, peakElevation],
  );

  useEffect(() => {
    applyCameraPosition(camera);
  }, [camera]);

  useEffect(() => {
    applySceneBackground(scene, solarData.elevation);
  }, [scene, solarData.elevation]);

  // Low ambient so directional light creates visible contrast on ground
  const ambientIntensity =
    0.1 + Math.max(0, solarData.elevation / 90) * 0.15;

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <SunLight
        position={sunPosition}
        intensity={solarData.intensity}
        elevation={solarData.elevation}
      />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#5a8b55" />
      </mesh>
    </>
  );
}
