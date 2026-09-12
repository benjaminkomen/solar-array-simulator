import { describe, it, expect } from "bun:test";
import {
  SEEDED_SIMULATION_PANEL,
  SEEDED_SIMULATION_PANEL_ID,
  panelsForSimulationScene,
  type SimulationPanel3D,
} from "../simulationPanels";

const realPanel: SimulationPanel3D = {
  id: "user-panel",
  x: 30,
  y: 60,
  rotation: 90,
  wattage: 400,
};

describe("panelsForSimulationScene", () => {
  it("keeps the user's array when it is not empty", () => {
    expect(panelsForSimulationScene([realPanel])).toEqual([realPanel]);
  });

  it("seeds one panel so an empty array still has panel + sun in view", () => {
    const seeded = panelsForSimulationScene([]);
    expect(seeded).toHaveLength(1);
    expect(seeded[0]).toEqual(SEEDED_SIMULATION_PANEL);
    expect(seeded[0].id).toBe(SEEDED_SIMULATION_PANEL_ID);
    expect(seeded[0].rotation).toBe(0);
  });
});
