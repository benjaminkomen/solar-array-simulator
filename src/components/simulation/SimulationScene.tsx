import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three/webgpu";
import { useThree, useFrame } from "@react-three/fiber";
import { SunLight } from "./SunLight";
import { SolarPanelMesh } from "./SolarPanelMesh";
import { SkyDome } from "./SkyDome";
import {
  getSolarPosition,
  calculateIrradiance,
  getSeasonDate,
  makeDateAtHour,
} from "@/utils/solarCalculations";
import { sceneState } from "@/utils/sceneState";

export interface Panel3DInfo {
  id: string;
  x: number;
  y: number;
  rotation: 0 | 90;
  wattage: number;
}

interface SimulationSceneProps {
  panels: Panel3DInfo[];
  tiltAngle: number;
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

function applyCameraAndScene(
  camera: THREE.Camera,
  scene: THREE.Scene,
  hasPanels: boolean,
): void {
  if (hasPanels) {
    camera.position.set(0, 8, -8);
    camera.lookAt(0, 4, 20);
  } else {
    camera.position.set(0, 2, -5);
    camera.lookAt(0, 10, 25);
  }
  // Clear flat background — SkyDome renders the sky
  scene.background = null;
  // Exponential fog blends ground into sky at horizon — seamless transition
  scene.fog = new THREE.FogExp2(0x9ab8a8, 0.012);
}

/**
 * Compute solar values from sceneState for a given hour.
 */
function computeSolarValues(hour: number) {
  const date = makeDateAtHour(getSeasonDate(sceneState.season), hour);
  const pos = getSolarPosition(sceneState.latitude, sceneState.longitude, date);
  const irradiance = calculateIrradiance(pos.elevation);
  return { elevation: pos.elevation, intensity: irradiance / 300 };
}

/**
 * Seed sceneState._computed with initial values.
 * Extracted as a module-level function to satisfy React Compiler
 * (mutations of module-level variables must not happen during render).
 */
function seedComputedSceneState(hour: number) {
  const solar = computeSolarValues(hour);
  const sunPos = getVisualSunPosition(
    sceneState.sunriseHour,
    sceneState.sunsetHour,
    hour,
    sceneState.peakElevation,
  );
  sceneState._computed.sunPosition = sunPos;
  sceneState._computed.intensity = solar.intensity;
  sceneState._computed.elevation = solar.elevation;
}

export function SimulationScene({
  panels,
  tiltAngle,
}: SimulationSceneProps) {
  const { camera, scene } = useThree();
  const ambientLightRef = useRef<THREE.AmbientLight>(null!);
  const lastComputedHourRef = useRef(-1);

  // Compute initial ambient intensity for first render (read-only, no mutations)
  const initialAmbientIntensity = useMemo(() => {
    const solar = computeSolarValues(sceneState.currentHour);
    return 0.1 + Math.max(0, solar.elevation / 90) * 0.15;
  }, []);

  // Seed sceneState._computed on mount so child components have valid data.
  // Must be in an effect (not useMemo) to satisfy React Compiler.
  useEffect(() => {
    seedComputedSceneState(sceneState.currentHour);
  }, []);

  // Imperatively update sun position, lighting, and sky every frame when hour changes.
  // This avoids React re-renders — the slider writes to sceneState directly.
  useFrame(() => {
    const hour = sceneState.currentHour;

    // Skip if hour hasn't changed enough (~18 seconds of solar time)
    if (Math.abs(hour - lastComputedHourRef.current) < 0.005) return;
    lastComputedHourRef.current = hour;

    // Compute solar data
    const solar = computeSolarValues(hour);

    // Compute visual sun position
    const sunPos = getVisualSunPosition(
      sceneState.sunriseHour,
      sceneState.sunsetHour,
      hour,
      sceneState.peakElevation,
    );

    // Write to shared computed state (read by SunLight and SkyDome in their useFrame)
    sceneState._computed.sunPosition = sunPos;
    sceneState._computed.intensity = solar.intensity;
    sceneState._computed.elevation = solar.elevation;

    // Update ambient light imperatively
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity =
        0.1 + Math.max(0, solar.elevation / 90) * 0.15;
    }
  });

  const panelLayout = useMemo(() => computePanelLayout(panels), [panels]);

  // Pivot around near edge (min Z, closest to camera) so far edge tilts up
  const nearEdgeZ = useMemo(() => {
    if (panelLayout.length === 0) return 0;
    return Math.min(...panelLayout.map((p) => p.position[2] - p.height / 2));
  }, [panelLayout]);
  const tiltRad = (tiltAngle * Math.PI) / 180;

  // Bounding box of all panels for the roof surface
  const roofBounds = useMemo(() => {
    if (panelLayout.length === 0) return null;
    const PADDING = 0.3;
    const minX = Math.min(...panelLayout.map((p) => p.position[0] - p.width / 2));
    const maxX = Math.max(...panelLayout.map((p) => p.position[0] + p.width / 2));
    const minZ = Math.min(...panelLayout.map((p) => p.position[2] - p.height / 2));
    const maxZ = Math.max(...panelLayout.map((p) => p.position[2] + p.height / 2));
    return {
      centerX: (minX + maxX) / 2,
      centerZ: (minZ + maxZ) / 2,
      width: maxX - minX + PADDING * 2,
      depth: maxZ - minZ + PADDING * 2,
    };
  }, [panelLayout]);

  useEffect(() => {
    applyCameraAndScene(camera, scene, panels.length > 0);
  }, [camera, scene, panels.length]);

  return (
    <>
      <SkyDome />
      <ambientLight ref={ambientLightRef} intensity={initialAmbientIntensity} />
      <SunLight />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#7a9e78" metalness={0.05} roughness={0.9} />
      </mesh>

      {/* Solar panels — tilt like a roof slope, near edge stays, far edge rises */}
      {panelLayout.length > 0 && (
        <group position={[5, 2, 20]}>
          <group position={[0, 0, nearEdgeZ]}>
            <group rotation={[-tiltRad, -0.5, 0.5]}>
              <group position={[0, 3, -nearEdgeZ]}>
                {/* Roof surface behind panels */}
                {roofBounds && (
                  <mesh position={[roofBounds.centerX, -0.06, roofBounds.centerZ]}>
                    <boxGeometry args={[roofBounds.width, 0.04, roofBounds.depth]} />
                    <meshStandardMaterial color="#555555" metalness={0} roughness={1} side={THREE.DoubleSide} />
                  </mesh>
                )}
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
