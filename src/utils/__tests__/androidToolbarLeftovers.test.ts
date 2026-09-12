import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "bun:test";

const src = (...parts: string[]) => resolve(import.meta.dir, "../..", ...parts);

const configSrc = readFileSync(src("app/config.tsx"), "utf8");
const productionSrc = readFileSync(src("app/production.tsx"), "utf8");
const chromeSrc = readFileSync(src("components/CustomChrome.tsx"), "utf8");
const uploadSrc = readFileSync(src("app/upload.tsx"), "utf8");
const iconButtonSrc = readFileSync(src("components/AndroidToolbarIconButton.tsx"), "utf8");
const appJson = readFileSync(resolve(import.meta.dir, "../../../app.json"), "utf8");

function androidBranch(source: string, marker: string): string {
  const idx = source.indexOf(marker);
  return idx === -1 ? "" : source.slice(idx, idx + 500);
}

describe("Android Toolbar.Button leftovers (#74)", () => {
  it("puts Config Add inverter on View+Pressable, iOS keeps Toolbar.Button", () => {
    expect(configSrc).toContain("AndroidToolbarIconButton");
    expect(configSrc).toContain('accessibilityLabel="Add inverter"');
    expect(configSrc).toContain('icon="plus"');
    const androidAdd = androidBranch(configSrc, "AndroidToolbarIconButton");
    expect(androidAdd).toContain("Add inverter");
    expect(androidAdd).not.toContain("Stack.Toolbar.Button");
    expect(configSrc).toMatch(
      /<Stack\.Toolbar\.Button[\s\S]*icon="plus"[\s\S]*accessibilityLabel="Add inverter"/,
    );
  });

  it("puts Production Simulate on View+Pressable, iOS keeps Toolbar.Button", () => {
    expect(productionSrc).toContain("AndroidToolbarIconButton");
    expect(productionSrc).toContain('accessibilityLabel="Simulate"');
    expect(productionSrc).toContain('icon="sun.max"');
    const androidSim = androidBranch(productionSrc, "source={WbSunny}");
    expect(androidSim).toContain("AndroidToolbarIconButton");
    expect(androidSim).toContain("Simulate");
    expect(androidSim).not.toContain("Stack.Toolbar.Button");
    expect(productionSrc).toMatch(
      /<Stack\.Toolbar\.Button[\s\S]*icon="sun.max"[\s\S]*accessibilityLabel="Simulate"/,
    );
    expect(productionSrc).toContain("Toolbar.Menu");
  });

  it("puts the Custom header-right link on View+Pressable and keeps iOS Badge", () => {
    const rightToolbar =
      chromeSrc.match(/<Stack\.Toolbar placement="right">[\s\S]*?<\/Stack\.Toolbar>/)?.[0] ?? "";
    expect(rightToolbar).toContain("AndroidToolbarIconButton");
    expect(rightToolbar).toContain("ignoreHeaderLinkPress");
    expect(rightToolbar).toContain("unlinkedCount > 0 ? String(unlinkedCount)");
    expect(rightToolbar).toContain("Stack.Toolbar.Badge");
    expect(rightToolbar).toContain("CUSTOM_HEADER_LINK_A11Y");
    expect(rightToolbar).toMatch(
      /Platform\.OS === "android" \? \([\s\S]*AndroidToolbarIconButton[\s\S]*\) : \([\s\S]*Stack\.Toolbar\.Button/,
    );
  });

  it("keeps the shared Android icon control on a labeled Pressable above an unlabeled Host", () => {
    expect(iconButtonSrc).toContain("Stack.Toolbar.View");
    expect(iconButtonSrc).toContain("AndroidToolbarHitOverlay");
    expect(iconButtonSrc).toContain("collapsable={false}");
    expect(iconButtonSrc).toContain("cancelable={false}");
    expect(iconButtonSrc).toContain("CustomToolbarAndroidIcon");
    expect(iconButtonSrc).not.toContain("Stack.Toolbar.Button");
  });

  it("does not regress Custom Finish, Upload first paint, or Hermes V1", () => {
    expect(chromeSrc).toContain("AndroidWizardFinishButton");
    expect(chromeSrc).toContain('from "react-native-gesture-handler"');
    expect(chromeSrc).toContain("GesturePressable");
    const finishBlock =
      chromeSrc.match(/export function AndroidWizardFinishButton[\s\S]*?export function CustomBottomToolbar/)?.[0] ?? "";
    expect(finishBlock).not.toContain("Stack.Toolbar.Button");
    expect(finishBlock).not.toContain("AndroidToolbarIconButton");
    expect(uploadSrc).not.toMatch(/<Host[\s>]/);
    expect(uploadSrc).not.toContain("@expo/ui/jetpack-compose");
    expect(appJson).toContain('"useHermesV1": true');
  });
});
