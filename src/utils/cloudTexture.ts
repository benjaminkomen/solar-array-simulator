import * as THREE from "three/webgpu";

/**
 * Simple 2D hash function returning a pseudo-random value in [0, 1].
 * Deterministic for the same (x, y) input.
 */
function hash2D(x: number, y: number): number {
  const dot = x * 127.1 + y * 311.7;
  return ((Math.sin(dot) * 43758.5453) % 1 + 1) % 1;
}

/** Smooth interpolation (Hermite) */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** 2D value noise with bilinear interpolation */
function valueNoise2D(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smoothstep(x - ix);
  const fy = smoothstep(y - iy);

  const v00 = hash2D(ix, iy);
  const v10 = hash2D(ix + 1, iy);
  const v01 = hash2D(ix, iy + 1);
  const v11 = hash2D(ix + 1, iy + 1);

  const top = v00 + (v10 - v00) * fx;
  const bottom = v01 + (v11 - v01) * fx;
  return top + (bottom - top) * fy;
}

/**
 * Generate a DataTexture with cloud-like noise.
 * RGB = white, A = cloud density. React Native safe (no DOM Canvas).
 */
export function createCloudTexture(
  width: number = 256,
  height: number = 256,
): THREE.DataTexture {
  const size = width * height;
  const data = new Uint8Array(size * 4);

  for (let i = 0; i < size; i++) {
    const x = (i % width) / width;
    const y = Math.floor(i / width) / height;

    // Layer 4 octaves of value noise
    let noise = 0;
    noise += valueNoise2D(x * 4, y * 4) * 0.5;
    noise += valueNoise2D(x * 8 + 50, y * 8 + 50) * 0.25;
    noise += valueNoise2D(x * 16 + 100, y * 16 + 100) * 0.125;
    noise += valueNoise2D(x * 32 + 200, y * 32 + 200) * 0.0625;

    // Threshold to create distinct cloud shapes
    const cloud = Math.max(0, (noise - 0.35) / 0.65);
    const alpha = Math.floor(cloud * 240); // max ~94% opacity

    const idx = i * 4;
    data[idx] = 255; // R
    data[idx + 1] = 255; // G
    data[idx + 2] = 255; // B
    data[idx + 3] = alpha; // A
  }

  const texture = new THREE.DataTexture(data, width, height);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}
