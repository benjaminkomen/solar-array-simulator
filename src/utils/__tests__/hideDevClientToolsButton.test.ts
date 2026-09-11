import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "bun:test";

const src = readFileSync(
  resolve(import.meta.dir, "../hideDevClientToolsButton.ts"),
  "utf8",
);

describe("hideDevClientToolsButton", () => {
  it("targets the Dev Client Tools overlay, not app chrome", () => {
    expect(src).toContain("setToolsButtonVisible");
    expect(src).toContain("showFloatingActionButton");
    expect(src).toContain("ExpoDevMenu");
    expect(src).toContain("DevMenuPreferences");
    expect(src).toContain("__DEV__");
    expect(src).not.toContain("headerRight");
    expect(src).not.toContain("DropdownMenu");
  });
});
