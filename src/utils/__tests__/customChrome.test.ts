import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "bun:test";
import { CUSTOM_ADD_PANEL_A11Y, CUSTOM_HEADER_LINK_A11Y } from "../customChrome";
import { shouldShowWizardFinish } from "../wizardChrome";

const chromeSrc = readFileSync(
  resolve(import.meta.dir, "../../components/CustomChrome.tsx"),
  "utf8",
);
const iosSrc = readFileSync(
  resolve(import.meta.dir, "../../app/custom.ios.tsx"),
  "utf8",
);
const androidSrc = readFileSync(
  resolve(import.meta.dir, "../../app/custom.android.tsx"),
  "utf8",
);
const productionIosSrc = readFileSync(
  resolve(import.meta.dir, "../../app/production.ios.tsx"),
  "utf8",
);
const productionAndroidSrc = readFileSync(
  resolve(import.meta.dir, "../../app/production.android.tsx"),
  "utf8",
);
const configIosSrc = readFileSync(
  resolve(import.meta.dir, "../../app/config.ios.tsx"),
  "utf8",
);
const configAndroidSrc = readFileSync(
  resolve(import.meta.dir, "../../app/config.android.tsx"),
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
    expect(productionIosSrc).not.toContain("Stack.Toolbar.Badge");
    expect(productionAndroidSrc).not.toContain("Stack.Toolbar.Badge");
    expect(configIosSrc).not.toContain("Stack.Toolbar.Badge");
    expect(configAndroidSrc).not.toContain("Stack.Toolbar.Badge");
  });

  it("keeps Add panel and Finish gates Maestro can drive", () => {
    expect(CUSTOM_ADD_PANEL_A11Y).toBe("Add panel");
    expect(chromeSrc).toContain("CUSTOM_ADD_PANEL_A11Y");
    expect(chromeSrc).toContain("shouldShowWizardFinish");
    expect(chromeSrc).toContain("Finish");
    expect(chromeSrc).toContain('Platform.OS === "ios"');
    expect(chromeSrc).toContain('Platform.OS === "android"');
    expect(shouldShowWizardFinish(true, 0)).toBe(false);
    expect(shouldShowWizardFinish(true, 1)).toBe(true);
    expect(iosSrc).toContain("SolarPanelCanvas");
    expect(androidSrc).toContain("SolarPanelCanvas");
  });
});
