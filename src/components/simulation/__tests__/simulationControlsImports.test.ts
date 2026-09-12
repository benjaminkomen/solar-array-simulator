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
const seasonPath = resolve(import.meta.dir, "../SeasonPicker.tsx");
const seasonIosPath = resolve(import.meta.dir, "../SeasonPicker.ios.tsx");
const seasonAndroidPath = resolve(import.meta.dir, "../SeasonPicker.android.tsx");
const chipsPath = resolve(import.meta.dir, "../../SegmentedChips.tsx");
const communitySegmentedIosPath = resolve(
  import.meta.dir,
  "../../../../node_modules/@expo/ui/src/community/segmented-control/SegmentedControl.ios.tsx",
);
const communitySegmentedAndroidPath = resolve(
  import.meta.dir,
  "../../../../node_modules/@expo/ui/src/community/segmented-control/SegmentedControl.android.tsx",
);
const hookPath = resolve(import.meta.dir, "../../../hooks/useSimulationControls.ts");
const pickerTypesPath = resolve(
  import.meta.dir,
  "../../../../node_modules/@expo/ui/src/universal/Picker/types.ts",
);

describe("Simulation controls collapse", () => {
  it("keeps a universal Slider and collapses season onto community segmented-control", () => {
    const controls = readFileSync(controlsPath, "utf8");
    const season = readFileSync(seasonPath, "utf8");
    const chips = readFileSync(chipsPath, "utf8");
    const pickerTypes = readFileSync(pickerTypesPath, "utf8");
    const communityIos = readFileSync(communitySegmentedIosPath, "utf8");
    const communityAndroid = readFileSync(communitySegmentedAndroidPath, "utf8");

    expect(controls).toMatch(/from ["']@expo\/ui["']/);
    expect(controls).toContain("Slider");
    expect(controls).toContain("SeasonPicker");
    expect(controls).toContain('width: "100%"');
    expect(controls).not.toMatch(/<Picker[\s>]/);
    expect(controls).not.toMatch(/from ["']@expo\/ui\/swift-ui["']/);
    expect(controls).not.toMatch(/from ["']@expo\/ui\/jetpack-compose["']/);

    expect(pickerTypes).toContain("'wheel' | 'menu'");
    expect(pickerTypes).not.toMatch(/segmented/);
    expect(existsSync(seasonIosPath)).toBe(false);
    expect(existsSync(seasonAndroidPath)).toBe(false);
    expect(season).toContain("SegmentedChips");
    expect(season).not.toMatch(/<Picker[\s>]/);
    expect(chips).toContain('@expo/ui/community/segmented-control');
    expect(communityIos).toContain("pickerStyle('segmented')");
    expect(communityAndroid).toContain("SingleChoiceSegmentedButtonRow");
    expect(communityAndroid).toContain("SegmentedButton");
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

  it("seeds an empty array in the hook, not inside SimulationView", () => {
    const hook = readFileSync(hookPath, "utf8");
    const view = readFileSync(
      resolve(import.meta.dir, "../SimulationView.tsx"),
      "utf8",
    );
    expect(hook).toContain("panelsForSimulationScene");
    expect(view).not.toContain("panelsForSimulationScene");
    expect(view).not.toContain("simulation-seed-panel");
  });
});
