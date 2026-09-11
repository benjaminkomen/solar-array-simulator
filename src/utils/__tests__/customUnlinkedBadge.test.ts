import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "bun:test";

const appDir = resolve(import.meta.dir, "../../app");

function readApp(name: string) {
  return readFileSync(resolve(appDir, name), "utf8");
}

function headerRightToolbar(src: string) {
  return src.match(/<Stack\.Toolbar placement="right">[\s\S]*?<\/Stack\.Toolbar>/)?.[0] ?? "";
}

describe("Custom unlinked-count badge", () => {
  const androidSrc = readApp("custom.android.tsx");
  const iosSrc = readApp("custom.ios.tsx");
  const androidHeader = headerRightToolbar(androidSrc);
  const iosHeader = headerRightToolbar(iosSrc);

  it("uses Stack.Toolbar.Badge on both Custom headers when unlinkedCount > 0", () => {
    expect(androidHeader).toContain("Stack.Toolbar.Badge");
    expect(androidHeader).toContain("unlinkedCount > 0");
    expect(androidHeader).toContain("String(unlinkedCount)");
    expect(iosHeader).toContain("Stack.Toolbar.Badge");
    expect(iosHeader).toContain("unlinkedCount > 0");
  });

  it("does not overlay a Compose Badge or nested Hosts on Android header-right", () => {
    expect(androidSrc).not.toMatch(/from "@expo\/ui\/jetpack-compose".*Badge|Badge.*from "@expo\/ui\/jetpack-compose"/);
    expect(androidSrc).not.toContain("containerColor");
    expect(androidHeader).not.toContain("Stack.Toolbar.View");
    expect(androidHeader).not.toContain("<Host");
    expect(androidHeader).not.toContain("<Badge");
  });

  it("keeps Android Custom bottom chrome (not issue #45)", () => {
    expect(androidSrc).toContain('placement="bottom"');
    expect(androidSrc).toContain("Stack.Toolbar.View");
    expect(androidSrc).toContain("Add panel");
    expect(androidSrc).toContain("shouldShowWizardFinish");
  });

  it("is the only Stack.Toolbar.Badge call site in the app", () => {
    const files = readdirSync(appDir).filter((name) => name.endsWith(".tsx"));
    const badgeFiles = files.filter((name) =>
      readFileSync(resolve(appDir, name), "utf8").includes("Stack.Toolbar.Badge"),
    );
    expect(badgeFiles.sort()).toEqual(["custom.android.tsx", "custom.ios.tsx"]);
  });
});
