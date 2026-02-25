import { useRef, useMemo } from "react";
import * as THREE from "three/webgpu";
import { useFrame } from "@react-three/fiber";
import { createCloudTexture } from "@/utils/cloudTexture";
import { sceneState } from "@/utils/sceneState";

const SKY_RADIUS = 100;
const CLOUD_RADIUS = 95;

// Time-of-day color pairs: [horizon, zenith]
const NIGHT_HORIZON = new THREE.Color(0x1a1a2e);
const NIGHT_ZENITH = new THREE.Color(0x0a0a15);
const TWILIGHT_HORIZON = new THREE.Color(0x4a3a5e);
const TWILIGHT_ZENITH = new THREE.Color(0x1a1a3e);
const DAWN_HORIZON = new THREE.Color(0xc4856b);
const DAWN_ZENITH = new THREE.Color(0x4a6a8e);
const DAY_HORIZON = new THREE.Color(0x9ec5d6);
const DAY_ZENITH = new THREE.Color(0x4488cc);

// Scratch colors to avoid allocations in the update loop
const _horizonColor = new THREE.Color();
const _zenithColor = new THREE.Color();
const _vertexColor = new THREE.Color();

function getHorizonAndZenith(
  elevation: number,
  horizon: THREE.Color,
  zenith: THREE.Color,
): void {
  if (elevation < -6) {
    horizon.copy(NIGHT_HORIZON);
    zenith.copy(NIGHT_ZENITH);
  } else if (elevation < 0) {
    const t = (elevation + 6) / 6;
    horizon.copy(NIGHT_HORIZON).lerp(TWILIGHT_HORIZON, t);
    zenith.copy(NIGHT_ZENITH).lerp(TWILIGHT_ZENITH, t);
  } else if (elevation < 8) {
    const t = elevation / 8;
    horizon.copy(TWILIGHT_HORIZON).lerp(DAWN_HORIZON, t);
    zenith.copy(TWILIGHT_ZENITH).lerp(DAWN_ZENITH, t);
  } else if (elevation < 20) {
    const t = (elevation - 8) / 12;
    horizon.copy(DAWN_HORIZON).lerp(DAY_HORIZON, t);
    zenith.copy(DAWN_ZENITH).lerp(DAY_ZENITH, t);
  } else {
    horizon.copy(DAY_HORIZON);
    zenith.copy(DAY_ZENITH);
  }
}

function updateSkyColors(
  geometry: THREE.BufferGeometry,
  positions: THREE.BufferAttribute,
  colorAttr: THREE.BufferAttribute,
  elevation: number,
): void {
  getHorizonAndZenith(elevation, _horizonColor, _zenithColor);

  for (let i = 0; i < positions.count; i++) {
    // Normalize Y: 0 at equator/horizon, 1 at top pole
    const y = positions.getY(i);
    const t = Math.max(0, y / SKY_RADIUS);
    _vertexColor.copy(_horizonColor).lerp(_zenithColor, t);
    colorAttr.setXYZ(i, _vertexColor.r, _vertexColor.g, _vertexColor.b);
  }
  colorAttr.needsUpdate = true;
}

function updateCloudMaterial(
  material: THREE.MeshBasicMaterial,
  elevation: number,
  delta: number,
): void {
  // Clouds brighter during day, dimmer at night
  if (elevation < -6) {
    material.opacity = 0.08;
  } else if (elevation < 0) {
    const t = (elevation + 6) / 6;
    material.opacity = 0.08 + t * 0.22;
  } else if (elevation < 20) {
    const t = Math.min(1, elevation / 20);
    material.opacity = 0.3 + t * 0.6;
  } else {
    material.opacity = 0.9;
  }

  // Slow cloud drift
  if (material.map) {
    material.map.offset.x += delta * 0.003;
  }
}

export function SkyDome() {
  const skyMeshRef = useRef<THREE.Mesh>(null!);
  const cloudMaterialRef = useRef<THREE.MeshBasicMaterial>(null!);
  const lastElevationRef = useRef(-999);

  // Pre-build sky geometry with vertex colors
  const { skyGeometry, positionsAttr, colorAttr } = useMemo(() => {
    const geo = new THREE.SphereGeometry(SKY_RADIUS, 32, 32);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);

    // Initialize with day colors
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = Math.max(0, y / SKY_RADIUS);
      _vertexColor.copy(DAY_HORIZON).lerp(DAY_ZENITH, t);
      colors[i * 3] = _vertexColor.r;
      colors[i * 3 + 1] = _vertexColor.g;
      colors[i * 3 + 2] = _vertexColor.b;
    }

    const colAttr = new THREE.BufferAttribute(colors, 3);
    geo.setAttribute("color", colAttr);
    return { skyGeometry: geo, positionsAttr: pos, colorAttr: colAttr };
  }, []);

  // Pre-build sky material
  const skyMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );

  // Cloud texture — generated once
  const cloudTexture = useMemo(() => createCloudTexture(), []);

  // Cloud material
  const cloudMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: cloudTexture,
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        opacity: 0.7,
      }),
    [cloudTexture],
  );

  // Store refs for the cloud material
  const cloudMatRefCallback = (mat: THREE.MeshBasicMaterial) => {
    cloudMaterialRef.current = mat;
  };

  useFrame((_, delta) => {
    const elevation = sceneState._computed.elevation;

    // Only recompute vertex colors when elevation changes meaningfully (~0.5°)
    if (skyMeshRef.current && Math.abs(elevation - lastElevationRef.current) > 0.5) {
      updateSkyColors(skyGeometry, positionsAttr, colorAttr, elevation);
      lastElevationRef.current = elevation;
    }
    if (cloudMaterialRef.current) {
      updateCloudMaterial(cloudMaterialRef.current, elevation, delta);
    }
  });

  return (
    <>
      {/* Sky gradient dome */}
      <mesh
        ref={skyMeshRef}
        geometry={skyGeometry}
        material={skyMaterial}
        renderOrder={-2}
      />

      {/* Cloud layer */}
      <mesh renderOrder={-1}>
        <sphereGeometry args={[CLOUD_RADIUS, 16, 16]} />
        <meshBasicMaterial
          ref={cloudMatRefCallback}
          map={cloudTexture}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          opacity={0.7}
          fog={false}
        />
      </mesh>
    </>
  );
}
