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
const iosSrc = readFileSync(
  resolve(import.meta.dir, "../../app/production.ios.tsx"),
  "utf8",
);
const layoutSrc = readFileSync(
  resolve(import.meta.dir, "../../app/_layout.tsx"),
  "utf8",
);

describe("production menu a11y", () => {
  it("keeps iOS on More options", () => {
    expect(PRODUCTION_MENU_A11Y_IOS).toBe("More options");
    expect(iosSrc).toContain("Stack.Toolbar.Menu");
    expect(iosSrc).toContain("PRODUCTION_MENU_A11Y_IOS");
  });

  it("does not share Android Dev Client overflow label", () => {
    expect(PRODUCTION_MENU_A11Y_ANDROID).toBe("Configuration options");
    expect(PRODUCTION_MENU_A11Y_ANDROID).not.toBe(PRODUCTION_MENU_A11Y_IOS);
    expect(PRODUCTION_MENU_A11Y_ANDROID).not.toBe("More options");
  });

  it("keeps the Android menu in the header-right slot next to Simulate", () => {
    expect(PRODUCTION_MENU_ANDROID_SLOT).toBe("header");
    const rightToolbar =
      androidSrc.match(/<Stack\.Toolbar placement="right">[\s\S]*?<\/Stack\.Toolbar>/)?.[0] ?? "";
    expect(rightToolbar).toContain("Simulate");
    expect(rightToolbar).toContain("Toolbar.Menu");
    expect(rightToolbar).toContain("PRODUCTION_MENU_A11Y_ANDROID");
    expect(rightToolbar).toContain("Edit Configuration");
    expect(rightToolbar).toContain("Delete Configuration");
    expect(androidSrc).not.toContain("DropdownMenu");
    expect(androidSrc).not.toContain("cardMenu");
  });

  it("hides the Dev Client Tools overlay from the root layout", () => {
    expect(layoutSrc).toContain("hideDevClientToolsButton");
  });
});
