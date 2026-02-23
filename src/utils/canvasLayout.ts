/**
 * Canvas layout utilities for building panel grids and mapping
 * AI analysis results to canvas positions.
 */
import { PANEL_WIDTH, PANEL_HEIGHT } from "@/utils/panelUtils";

// Fallback grid: 2 rows x 5 columns
const COLS = 5;
const MOCK_GAP = 6;
const COL_SPACING = PANEL_WIDTH + MOCK_GAP;
const ROW_SPACING = PANEL_HEIGHT + MOCK_GAP;
const GRID_TOTAL_WIDTH = (COLS - 1) * COL_SPACING + PANEL_WIDTH;
const GRID_TOTAL_HEIGHT = ROW_SPACING + PANEL_HEIGHT;

export { MOCK_GAP };

export function buildMockPanelGrid(canvasWidth: number, canvasHeight: number) {
  const offsetX = Math.round((canvasWidth - GRID_TOTAL_WIDTH) / 2);
  const offsetY = Math.round((canvasHeight - GRID_TOTAL_HEIGHT) / 2);

  return Array.from({ length: 10 }, (_, i) => ({
    x: offsetX + (i % COLS) * COL_SPACING,
    y: offsetY + Math.floor(i / COLS) * ROW_SPACING,
    rotation: 0 as const,
  }));
}

/**
 * Map analysis results to a clean grid layout on the canvas.
 * Clusters AI-detected panels into rows/columns by their center points,
 * then lays them out in a neat grid with standard spacing.
 */
export function mapAnalysisToCanvasPositions(
  panels: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: 0 | 90;
  }[],
  _imageWidth: number,
  _imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  if (panels.length === 0) return [];

  // AI returns center points directly as x, y
  const withCenters = panels.map((p, i) => ({
    index: i,
    cx: p.x,
    cy: p.y,
    rotation: p.rotation,
  }));

  // Compute median panel height (portrait orientation) for row clustering threshold
  const portraitHeights = panels
    .map((p) => (p.rotation === 90 ? p.width : p.height))
    .sort((a, b) => a - b);
  const medianHeight = portraitHeights[Math.floor(portraitHeights.length / 2)];

  // Sort by Y (top to bottom), then cluster into rows
  withCenters.sort((a, b) => a.cy - b.cy);

  const rows: (typeof withCenters)[] = [];
  let currentRow: typeof withCenters = [withCenters[0]];

  for (let i = 1; i < withCenters.length; i++) {
    const gap = withCenters[i].cy - withCenters[i - 1].cy;
    if (gap > medianHeight * 0.5) {
      rows.push(currentRow);
      currentRow = [withCenters[i]];
    } else {
      currentRow.push(withCenters[i]);
    }
  }
  rows.push(currentRow);

  // Sort each row by X (left to right)
  for (const row of rows) {
    row.sort((a, b) => a.cx - b.cx);
  }

  // Determine dominant rotation to set grid cell size
  const landscapeCount = withCenters.filter((p) => p.rotation === 90).length;
  const dominantRotation: 0 | 90 = landscapeCount > withCenters.length / 2 ? 90 : 0;
  const cellW = dominantRotation === 90 ? PANEL_HEIGHT : PANEL_WIDTH;
  const cellH = dominantRotation === 90 ? PANEL_WIDTH : PANEL_HEIGHT;

  // Build grid layout with standard spacing
  const colSpacing = cellW + MOCK_GAP;
  const rowSpacing = cellH + MOCK_GAP;

  // Calculate total grid dimensions for centering
  const maxCols = Math.max(...rows.map((r) => r.length));
  const gridWidth = (maxCols - 1) * colSpacing + cellW;
  const gridHeight = (rows.length - 1) * rowSpacing + cellH;
  const offsetX = Math.round((canvasWidth - gridWidth) / 2);
  const offsetY = Math.round((canvasHeight - gridHeight) / 2);

  // Map each panel to its grid position, preserving original index order
  const result: { index: number; x: number; y: number; rotation: 0 | 90 }[] = [];
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      result.push({
        index: row[colIdx].index,
        x: offsetX + colIdx * colSpacing,
        y: offsetY + rowIdx * rowSpacing,
        rotation: row[colIdx].rotation,
      });
    }
  }

  // Sort back to original panel order so labels/inverter matching stays aligned
  result.sort((a, b) => a.index - b.index);

  return result.map(({ x, y, rotation }) => ({ x, y, rotation }));
}
