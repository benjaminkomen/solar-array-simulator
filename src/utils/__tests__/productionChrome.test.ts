import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "bun:test";
import {
  PRODUCTION_MENU_A11Y_ANDROID,
  PRODUCTION_MENU_A11Y_IOS,
  PRODUCTION_MENU_ANDROID_SLOT,
} from "../productionChrome";

const androidSrc = readFileSync(
  resolve(import.meta.dir, "../../app/production.android.tsx"),
  "utf8",
);

describe("production menu a11y", () => {
  it("keeps iOS on More options", () => {
    expect(PRODUCTION_MENU_A11Y_IOS).toBe("More options");
  });

  it("does not share Android Dev Client overflow label", () => {
    expect(PRODUCTION_MENU_A11Y_ANDROID).toBe("Configuration options");
    expect(PRODUCTION_MENU_A11Y_ANDROID).not.toBe(PRODUCTION_MENU_A11Y_IOS);
    expect(PRODUCTION_MENU_A11Y_ANDROID).not.toBe("More options");
  });

  it("keeps the Android menu out of the headerRight / Dev Client Tools slot", () => {
    expect(PRODUCTION_MENU_ANDROID_SLOT).toBe("content");
    const rightToolbar =
      androidSrc.match(/<Stack\.Toolbar placement="right">[\s\S]*?<\/Stack\.Toolbar>/)?.[0] ?? "";
    expect(rightToolbar).toContain("Simulate");
    expect(rightToolbar).not.toContain("Toolbar.Menu");
    expect(androidSrc).toContain("DropdownMenu");
    expect(androidSrc).toContain("PRODUCTION_MENU_A11Y_ANDROID");
    expect(androidSrc).not.toMatch(/\bheaderRight\s*:/);
    expect(androidSrc).not.toMatch(/placement="right"[\s\S]*Toolbar\.Menu/);
  });
});
