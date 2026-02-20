import { useEffect, useMemo } from "react";
import * as THREE from "three/webgpu";
import { useThree } from "@react-three/fiber";
import { SunLight } from "./SunLight";
import { SolarPanelMesh } from "./SolarPanelMesh";
import {
  getSolarPosition,
  calculateIrradiance,
  getSunriseAndSunset,
  type Season,
  getSeasonDate,
  makeDateAtHour,
} from "@/utils/solarCalculations";

export interface Panel3DInfo {
  id: string;
  x: number;
  y: number;
  rotation: 0 | 90;
  wattage: number;
}

interface SimulationSceneProps {
  latitude: number;
  longitude: number;
  season: Season;
  currentHour: number;
  panels: Panel3DInfo[];
  tiltAngle: number;
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
  const maxHeight = Math.max(
    5,
    15 * Math.sin(Math.min(peakElevationDeg, 75) * (Math.PI / 180)),
  );

  return {
    x: arcWidth * Math.cos(angle),
    y: Math.max(0.5, maxHeight * Math.sin(angle)),
    z: 25,
  };
}

function applySceneBackground(scene: THREE.Scene, elevation: number): void {
  scene.background = getSkyColor(elevation);
}

// 2D canvas panel dimensions (px)
const CANVAS_PANEL_W = 60;
const CANVAS_PANEL_H = 120;
const WORLD_SIZE = 10;

function computePanelLayout(
  panels: Panel3DInfo[],
): { position: [number, number, number]; width: number; height: number }[] {
  if (panels.length === 0) return [];

  // Compute each panel's center and dimensions in canvas coords
  const rects = panels.map((p) => {
    const w = p.rotation === 90 ? CANVAS_PANEL_H : CANVAS_PANEL_W;
    const h = p.rotation === 90 ? CANVAS_PANEL_W : CANVAS_PANEL_H;
    return { cx: p.x + w / 2, cy: p.y + h / 2, w, h };
  });

  // Bounding box center
  const xs = rects.map((r) => r.cx);
  const ys = rects.map((r) => r.cy);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

  // Scale so the array fits within WORLD_SIZE world units
  const minX = Math.min(...rects.map((r) => r.cx - r.w / 2));
  const maxX = Math.max(...rects.map((r) => r.cx + r.w / 2));
  const minY = Math.min(...rects.map((r) => r.cy - r.h / 2));
  const maxY = Math.max(...rects.map((r) => r.cy + r.h / 2));
  const maxSpan = Math.max(maxX - minX, maxY - minY, 1);
  const scale = WORLD_SIZE / maxSpan;

  return rects.map((r) => ({
    position: [
      (r.cx - centerX) * scale,
      0,
      (r.cy - centerY) * scale,
    ] as [number, number, number],
    width: r.w * scale,
    height: r.h * scale,
  }));
}

function applyCameraPosition(camera: THREE.Camera, hasPanels: boolean): void {
  if (hasPanels) {
    camera.position.set(0, 8, -8);
    camera.lookAt(0, 4, 20);
  } else {
    camera.position.set(0, 2, -5);
    camera.lookAt(0, 10, 25);
  }
}

export function SimulationScene({
  latitude,
  longitude,
  season,
  currentHour,
  panels,
  tiltAngle,
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

  const panelLayout = useMemo(() => computePanelLayout(panels), [panels]);

  // Pivot around right edge so left side tilts up
  const rightEdgeX = useMemo(() => {
    if (panelLayout.length === 0) return 0;
    return Math.max(...panelLayout.map((p) => p.position[0] + p.width / 2));
  }, [panelLayout]);
  const tiltRad = (tiltAngle * Math.PI) / 180;

  useEffect(() => {
    applyCameraPosition(camera, panels.length > 0);
  }, [camera, panels.length]);

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

      {/* Solar panels — pivot around right edge so left tilts up */}
      {panelLayout.length > 0 && (
        <group position={[0, 1, 20]}>
          <group position={[rightEdgeX, 0, 0]}>
            <group rotation={[0, 0, -tiltRad]}>
              <group position={[-rightEdgeX, 0, 0]}>
                {panelLayout.map((p, i) => (
                  <SolarPanelMesh
                    key={panels[i].id}
                    position={p.position}
                    width={p.width}
                    height={p.height}
                  />
                ))}
              </group>
            </group>
          </group>
        </group>
      )}
    </>
  );
}
