import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const controlsPath = resolve(import.meta.dir, "../SimulationControls.tsx");
const screenPath = resolve(import.meta.dir, "../../../app/simulation.tsx");
const iosPath = resolve(import.meta.dir, "../../../app/simulation.ios.tsx");
const androidPath = resolve(
  import.meta.dir,
  "../../../app/simulation.android.tsx",
);
const hookPath = resolve(import.meta.dir, "../../../hooks/useSimulationControls.ts");

describe("Simulation controls collapse", () => {
  it("uses one universal Slider/Picker tree from @expo/ui", () => {
    const controls = readFileSync(controlsPath, "utf8");
    expect(controls).toMatch(/from ["']@expo\/ui["']/);
    expect(controls).toContain("Slider");
    expect(controls).toContain("Picker");
    expect(controls).not.toMatch(/from ["']@expo\/ui\/swift-ui["']/);
    expect(controls).not.toMatch(/from ["']@expo\/ui\/jetpack-compose["']/);
  });

  it("keeps SimulationView as the GPU surface on the shared route", () => {
    const screen = readFileSync(screenPath, "utf8");
    expect(screen).toContain('import("@/components/simulation/SimulationView")');
    expect(screen).toContain("SimulationControls");
    expect(screen).not.toContain("not yet implemented");
    expect(screen).not.toMatch(/from ["']@expo\/ui\/swift-ui["']/);
    expect(screen).not.toMatch(/from ["']@expo\/ui\/jetpack-compose["']/);
    expect(existsSync(iosPath)).toBe(false);
    expect(existsSync(androidPath)).toBe(false);
  });

  it("shares the Android hour-slider debounce in the controls hook", () => {
    const hook = readFileSync(hookPath, "utf8");
    expect(hook).toContain("scheduleDebouncedHour");
    expect(hook).toContain("displayHour");
  });
});
