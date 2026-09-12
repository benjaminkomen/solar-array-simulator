/**
 * 3D panel list for Simulation. An empty array leaves the WebGPU viewport
 * with no SolarPanelMesh (camera looks at empty sky). Seed one panel so
 * deeplink / chrome-only paths still show panel + sun.
 */

export type SimulationPanel3D = {
  id: string;
  x: number;
  y: number;
  rotation: 0 | 90;
  wattage: number;
};

export const SEEDED_SIMULATION_PANEL_ID = "simulation-seed-panel";

export const SEEDED_SIMULATION_PANEL: SimulationPanel3D = {
  id: SEEDED_SIMULATION_PANEL_ID,
  x: 0,
  y: 0,
  rotation: 0,
  wattage: 0,
};

export function panelsForSimulationScene(
  panels: SimulationPanel3D[],
): SimulationPanel3D[] {
  return panels.length > 0 ? panels : [SEEDED_SIMULATION_PANEL];
}
