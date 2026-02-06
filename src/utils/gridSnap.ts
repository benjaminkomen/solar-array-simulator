export const GRID_SIZE = 30;

/**
 * Snap a value to the nearest grid position.
 */
export function snapToGrid(value: number): number {
  "worklet";
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

/**
 * Snap both x and y coordinates to the grid.
 */
export function snapPositionToGrid(x: number, y: number): { x: number; y: number } {
  "worklet";
  return {
    x: snapToGrid(x),
    y: snapToGrid(y),
  };
}
