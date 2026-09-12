import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "bun:test";
import {
  CUSTOM_ADD_PANEL_A11Y,
  CUSTOM_HEADER_LINK_A11Y,
  resolveCanvasSizeForAdd,
} from "../customChrome";
import { shouldShowWizardFinish } from "../wizardChrome";

const chromeSrc = readFileSync(
  resolve(import.meta.dir, "../../components/CustomChrome.tsx"),
  "utf8",
);
const iosSrc = readFileSync(
  resolve(import.meta.dir, "../../components/screens/CustomScreen.ios.tsx"),
  "utf8",
);
const androidSrc = readFileSync(
  resolve(import.meta.dir, "../../components/screens/CustomScreen.android.tsx"),
  "utf8",
);
const productionSrc = readFileSync(
  resolve(import.meta.dir, "../../app/production.tsx"),
  "utf8",
);
const configSrc = readFileSync(
  resolve(import.meta.dir, "../../app/config.tsx"),
  "utf8",
);
const androidIconSrc = readFileSync(
  resolve(import.meta.dir, "../../components/CustomToolbarAndroidIcon.android.tsx"),
  "utf8",
);
const expoToolbarButtonAndroid = readFileSync(
  resolve(
    import.meta.dir,
    "../../../node_modules/expo-router/build/layouts/stack-utils/toolbar/StackToolbarButton/native.android.js",
  ),
  "utf8",
);

describe("Custom chrome tree", () => {
  it("keeps iOS and Android Custom routes on the same toolbar components", () => {
    expect(iosSrc).toContain("CustomHeaderToolbar");
    expect(iosSrc).toContain("CustomBottomToolbar");
    expect(androidSrc).toContain("CustomHeaderToolbar");
    expect(androidSrc).toContain("CustomBottomToolbar");
    expect(iosSrc).not.toContain("Stack.Toolbar.Button");
    expect(androidSrc).not.toContain("Stack.Toolbar.Button");
    expect(androidSrc).not.toContain("@expo/ui/jetpack-compose");
    expect(androidSrc).not.toContain("Host matchContents");
    expect(androidSrc).not.toContain("<Badge");
    expect(androidSrc).not.toContain("Pressable");
  });

  it("uses Stack.Toolbar.Badge only on the header-right link when unlinkedCount > 0", () => {
    expect(chromeSrc).toContain('placement="right"');
    expect(chromeSrc).toContain("Stack.Toolbar.Badge");
    expect(chromeSrc).toContain("unlinkedCount > 0");
    expect(chromeSrc).toContain("CUSTOM_HEADER_LINK_A11Y");
    expect(CUSTOM_HEADER_LINK_A11Y).toBe("Unlinked panels");

    const rightToolbar =
      chromeSrc.match(/<Stack\.Toolbar placement="right">[\s\S]*?<\/Stack\.Toolbar>/)?.[0] ?? "";
    const bottomToolbar =
      chromeSrc.match(/<Stack\.Toolbar placement="bottom">[\s\S]*?<\/Stack\.Toolbar>/)?.[0] ?? "";
    expect(rightToolbar).toContain("Stack.Toolbar.Badge");
    expect(bottomToolbar).not.toContain("Stack.Toolbar.Badge");
    expect(chromeSrc.split("<Stack.Toolbar.Badge").length - 1).toBe(1);

    expect(iosSrc).not.toContain("Stack.Toolbar.Badge");
    expect(androidSrc).not.toContain("Stack.Toolbar.Badge");
    expect(productionSrc).not.toContain("Stack.Toolbar.Badge");
    expect(configSrc).not.toContain("Stack.Toolbar.Badge");
  });

  it("keeps Add panel on a clickable RN Pressable because Android Toolbar.Button a11y is dead", () => {
    expect(expoToolbarButtonAndroid).toContain("IconButton");
    expect(expoToolbarButtonAndroid).toMatch(/Icon[\s\S]*contentDescription/);
    expect(CUSTOM_ADD_PANEL_A11Y).toBe("Add panel");
    expect(chromeSrc).toContain("CUSTOM_ADD_PANEL_A11Y");
    expect(chromeSrc).toContain('accessibilityRole="button"');
    expect(chromeSrc).toContain("collapsable={false}");
    expect(chromeSrc).toContain("CustomToolbarAndroidIcon");
    expect(chromeSrc).toContain("toolbarIconHit");
    expect(chromeSrc).toContain("cancelable={false}");
    expect(androidIconSrc).toContain("@expo/ui/jetpack-compose");
    expect(androidIconSrc).toContain("<Host");
    expect(androidIconSrc).toContain('pointerEvents="none"');
    expect(androidIconSrc).toContain("<Icon");
    const iconJsx = androidIconSrc.match(/<Icon[\s\S]*?\/>/)?.[0] ?? "";
    expect(iconJsx).toContain("<Icon");
    expect(iconJsx).not.toContain("accessibilityLabel");
    expect(iconJsx).not.toContain("contentDescription");
    expect(chromeSrc).toContain("shouldShowWizardFinish");
    expect(chromeSrc).toContain("Finish");
    expect(chromeSrc).toContain("AndroidToolbarHitOverlay");
    expect(chromeSrc).toContain("AndroidWizardFinishButton");
    expect(chromeSrc).toContain("androidFinishHit");
    expect(chromeSrc).toContain("androidWizardFinishBottom");
    expect(chromeSrc).toContain("androidWizardFinishRight");
    expect(chromeSrc).toContain("androidWizardFinishPressProofLabel");
    expect(chromeSrc).toContain("hidden={!selectedId}");
    const finishBlock =
      chromeSrc.match(/function WizardFinishButton[\s\S]*?export function AndroidWizardFinishButton/)?.[0] ?? "";
    expect(finishBlock).toContain('Platform.OS === "android" || !visible');
    expect(finishBlock).not.toContain("disabled={!visible}");
    expect(finishBlock).not.toContain("if (visible)");
    expect(finishBlock).not.toContain("AndroidToolbarHitOverlay");
    const bottomToolbar =
      chromeSrc.match(/<Stack\.Toolbar placement="bottom">[\s\S]*?<\/Stack\.Toolbar>/)?.[0] ?? "";
    expect(bottomToolbar).toContain('Platform.OS !== "android" && (');
    expect(bottomToolbar).toContain("<WizardFinishButton");
    expect(bottomToolbar.indexOf('Platform.OS !== "android"')).toBeLessThan(
      bottomToolbar.indexOf("<WizardFinishButton"),
    );
    expect(androidSrc).toContain("AndroidWizardFinishButton");
    expect(chromeSrc).toContain("visible={showFinish}");
    expect(chromeSrc).not.toContain("shouldShowWizardFinish(isWizardMode, panelCount) &&");
    expect(shouldShowWizardFinish(true, 0)).toBe(false);
    expect(shouldShowWizardFinish(true, 1)).toBe(true);
    expect(iosSrc).toContain("SolarPanelCanvas");
    expect(androidSrc).toContain("SolarPanelCanvas");
  });

  it("does not let Add silently no-op when the canvas has not measured yet", () => {
    expect(resolveCanvasSizeForAdd(0, 0, 400, 800)).toEqual({ width: 400, height: 800 });
    expect(resolveCanvasSizeForAdd(390, 700, 400, 800)).toEqual({ width: 390, height: 700 });
    expect(resolveCanvasSizeForAdd(0, 0, 0, 0)).toEqual({ width: 400, height: 800 });
  });
});
