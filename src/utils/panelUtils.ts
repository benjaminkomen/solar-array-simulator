import type { Rect } from "./collision";
import { collidesWithAny } from "./collision";
import { snapToGrid, GRID_SIZE } from "./gridSnap";

export const PANEL_WIDTH = 60;
export const PANEL_HEIGHT = 120;

export interface PanelState {
  id: string;
  x: number;
  y: number;
  rotation: 0 | 90;
}

/**
 * Get the bounding box dimensions for a panel based on its rotation.
 */
export function getPanelDimensions(rotation: 0 | 90): { width: number; height: number } {
  "worklet";
  if (rotation === 90) {
    return { width: PANEL_HEIGHT, height: PANEL_WIDTH };
  }
  return { width: PANEL_WIDTH, height: PANEL_HEIGHT };
}

/**
 * Get the bounding rectangle for a panel.
 */
export function getPanelRect(panel: PanelState): Rect {
  "worklet";
  const dims = getPanelDimensions(panel.rotation);
  return {
    x: panel.x,
    y: panel.y,
    width: dims.width,
    height: dims.height,
  };
}

/**
 * Check if a touch point is within a panel's bounds.
 */
export function isTouchInPanel(
  touchX: number,
  touchY: number,
  panel: PanelState
): boolean {
  "worklet";
  const dims = getPanelDimensions(panel.rotation);
  return (
    touchX >= panel.x &&
    touchX <= panel.x + dims.width &&
    touchY >= panel.y &&
    touchY <= panel.y + dims.height
  );
}

/**
 * Hit test panels in reverse order (top panel first).
 * Returns the id of the hit panel, or null if no panel was hit.
 */
export function hitTestPanels(
  touchX: number,
  touchY: number,
  panels: PanelState[]
): string | null {
  "worklet";
  for (let i = panels.length - 1; i >= 0; i--) {
    if (isTouchInPanel(touchX, touchY, panels[i])) {
      return panels[i].id;
    }
  }
  return null;
}

/**
 * Find a free position for a new panel on the canvas.
 * Tries center of the visible area first, then spirals outward.
 * Works with infinite canvas - no bounds checking.
 *
 * @param canvasWidth - Visible canvas width
 * @param canvasHeight - Visible canvas height
 * @param panels - Existing panels
 * @param rotation - Panel rotation
 * @param viewportOffsetX - X offset of the viewport in world coordinates
 * @param viewportOffsetY - Y offset of the viewport in world coordinates
 */
export function findFreePosition(
  canvasWidth: number,
  canvasHeight: number,
  panels: PanelState[],
  rotation: 0 | 90 = 0,
  viewportOffsetX: number = 0,
  viewportOffsetY: number = 0
): { x: number; y: number } | null {
  const dims = getPanelDimensions(rotation);
  const panelRects = panels.map((p) => ({ ...getPanelRect(p), id: p.id }));

  // Calculate center in world coordinates (accounting for viewport)
  const centerX = snapToGrid(viewportOffsetX + (canvasWidth - dims.width) / 2);
  const centerY = snapToGrid(viewportOffsetY + (canvasHeight - dims.height) / 2);

  const centerRect: Rect = { x: centerX, y: centerY, ...dims };
  if (!collidesWithAny(centerRect, panelRects)) {
    return { x: centerX, y: centerY };
  }

  // Spiral outward from center - infinite canvas, so keep searching
  const maxRadius = 10000; // Large enough to find space
  for (let radius = GRID_SIZE; radius < maxRadius; radius += GRID_SIZE) {
    // Try positions in a square pattern around center
    for (let dx = -radius; dx <= radius; dx += GRID_SIZE) {
      for (let dy = -radius; dy <= radius; dy += GRID_SIZE) {
        // Only check perimeter of the square
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

        const x = snapToGrid(centerX + dx);
        const y = snapToGrid(centerY + dy);

        const testRect: Rect = { x, y, ...dims };
        if (!collidesWithAny(testRect, panelRects)) {
          return { x, y };
        }
      }
    }
  }

  return null; // No free position found (shouldn't happen with infinite canvas)
}

/**
 * Generate a unique panel ID.
 */
export function generatePanelId(): string {
  return `panel-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Find a valid position for a panel after rotation.
 * Tries the current position first, then searches in expanding circles.
 * Returns the new position, or null if no valid position found.
 */
export function findValidPositionAfterRotation(
  currentX: number,
  currentY: number,
  newRotation: 0 | 90,
  panelId: string,
  allPanels: PanelState[]
): { x: number; y: number } | null {
  const newDims = getPanelDimensions(newRotation);
  const otherPanelRects = allPanels
    .filter((p) => p.id !== panelId)
    .map((p) => ({ ...getPanelRect(p), id: p.id }));

  // Try current position first
  const currentRect: Rect = { x: currentX, y: currentY, ...newDims };
  if (!collidesWithAny(currentRect, otherPanelRects)) {
    return { x: currentX, y: currentY };
  }

  // Search in expanding circles for a valid position
  const maxSearchRadius = 300; // Max distance to search
  const step = GRID_SIZE;

  for (let radius = step; radius <= maxSearchRadius; radius += step) {
    // Try 8 directions: cardinal + diagonal
    const directions = [
      { dx: 0, dy: -1 },  // up
      { dx: 1, dy: -1 },  // up-right
      { dx: 1, dy: 0 },   // right
      { dx: 1, dy: 1 },   // down-right
      { dx: 0, dy: 1 },   // down
      { dx: -1, dy: 1 },  // down-left
      { dx: -1, dy: 0 },  // left
      { dx: -1, dy: -1 }, // up-left
    ];

    for (const dir of directions) {
      const testX = snapToGrid(currentX + dir.dx * radius);
      const testY = snapToGrid(currentY + dir.dy * radius);

      const testRect: Rect = { x: testX, y: testY, ...newDims };
      if (!collidesWithAny(testRect, otherPanelRects)) {
        return { x: testX, y: testY };
      }
    }
  }

  return null; // No valid position found
}
