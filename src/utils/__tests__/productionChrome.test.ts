import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "bun:test";
import {
  ANDROID_APPBAR_HEIGHT,
  ANDROID_CARD_INSET_EXTRA,
  IOS_CARD_INSET_EXTRA,
  PRODUCTION_MENU_A11Y_ANDROID,
  PRODUCTION_MENU_A11Y_IOS,
  PRODUCTION_MENU_ANDROID_SLOT,
  productionCardMarginTop,
  productionMenuA11y,
} from "../productionChrome";

const appDir = resolve(import.meta.dir, "../../app");
const productionSrc = readFileSync(resolve(appDir, "production.tsx"), "utf8");
const layoutSrc = readFileSync(resolve(appDir, "_layout.tsx"), "utf8");

describe("production menu a11y", () => {
  it("keeps iOS on More options", () => {
    expect(PRODUCTION_MENU_A11Y_IOS).toBe("More options");
    expect(productionMenuA11y("ios")).toBe("More options");
    expect(productionSrc).toContain("Stack.Toolbar.Menu");
    expect(productionSrc).toContain("productionMenuA11y");
  });

  it("does not share Android Dev Client overflow label", () => {
    expect(PRODUCTION_MENU_A11Y_ANDROID).toBe("Configuration options");
    expect(PRODUCTION_MENU_A11Y_ANDROID).not.toBe(PRODUCTION_MENU_A11Y_IOS);
    expect(PRODUCTION_MENU_A11Y_ANDROID).not.toBe("More options");
    expect(productionMenuA11y("android")).toBe("Configuration options");
    expect(productionMenuA11y("android")).not.toBe("More options");
  });

  it("keeps the Android menu in the header-right slot next to Simulate", () => {
    expect(PRODUCTION_MENU_ANDROID_SLOT).toBe("header");
    const rightToolbar =
      productionSrc.match(/<Stack\.Toolbar placement="right">[\s\S]*?<\/Stack\.Toolbar>/)?.[0] ?? "";
    expect(rightToolbar).toContain("Simulate");
    expect(rightToolbar).toContain("AndroidToolbarIconButton");
    expect(rightToolbar).toContain('accessibilityLabel="Simulate"');
    expect(rightToolbar).toContain('icon="sun.max"');
    expect(rightToolbar).toContain("Toolbar.Menu");
    expect(rightToolbar).toContain("productionMenuA11y");
    expect(rightToolbar).toContain("Edit Configuration");
    expect(rightToolbar).toContain("Delete Configuration");
    expect(productionSrc).not.toContain("DropdownMenu");
    expect(productionSrc).not.toContain("cardMenu");
    expect(productionSrc).not.toContain("<Host");
  });

  it("forks icons, a11y, and card inset via Platform — not sibling route files", () => {
    expect(existsSync(resolve(appDir, "production.ios.tsx"))).toBe(false);
    expect(existsSync(resolve(appDir, "production.android.tsx"))).toBe(false);
    expect(productionSrc).toContain("Platform.OS");
    expect(productionSrc).toContain("productionCardMarginTop");
    expect(productionCardMarginTop(10, "ios")).toBe(10 + IOS_CARD_INSET_EXTRA);
    expect(productionCardMarginTop(10, "android")).toBe(
      10 + ANDROID_APPBAR_HEIGHT + ANDROID_CARD_INSET_EXTRA,
    );
  });

  it("hides the Dev Client Tools overlay from the root layout", () => {
    expect(layoutSrc).toContain("hideDevClientToolsButton");
  });
});
