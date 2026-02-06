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
 * Tries center first, then spirals outward.
 */
export function findFreePosition(
  canvasWidth: number,
  canvasHeight: number,
  panels: PanelState[],
  rotation: 0 | 90 = 0
): { x: number; y: number } | null {
  const dims = getPanelDimensions(rotation);
  const panelRects = panels.map((p) => ({ ...getPanelRect(p), id: p.id }));

  // Try center first
  const centerX = snapToGrid((canvasWidth - dims.width) / 2);
  const centerY = snapToGrid((canvasHeight - dims.height) / 2);

  const centerRect: Rect = { x: centerX, y: centerY, ...dims };
  if (!collidesWithAny(centerRect, panelRects)) {
    return { x: centerX, y: centerY };
  }

  // Spiral outward from center
  const maxRadius = Math.max(canvasWidth, canvasHeight);
  for (let radius = GRID_SIZE; radius < maxRadius; radius += GRID_SIZE) {
    // Try positions in a square pattern around center
    for (let dx = -radius; dx <= radius; dx += GRID_SIZE) {
      for (let dy = -radius; dy <= radius; dy += GRID_SIZE) {
        // Only check perimeter of the square
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

        const x = snapToGrid(centerX + dx);
        const y = snapToGrid(centerY + dy);

        // Check bounds
        if (x < 0 || y < 0 || x + dims.width > canvasWidth || y + dims.height > canvasHeight) {
          continue;
        }

        const testRect: Rect = { x, y, ...dims };
        if (!collidesWithAny(testRect, panelRects)) {
          return { x, y };
        }
      }
    }
  }

  // Fallback: grid scan from top-left
  for (let y = 0; y + dims.height <= canvasHeight; y += GRID_SIZE) {
    for (let x = 0; x + dims.width <= canvasWidth; x += GRID_SIZE) {
      const testRect: Rect = { x, y, ...dims };
      if (!collidesWithAny(testRect, panelRects)) {
        return { x, y };
      }
    }
  }

  return null; // No free position found
}

/**
 * Generate a unique panel ID.
 */
export function generatePanelId(): string {
  return `panel-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
