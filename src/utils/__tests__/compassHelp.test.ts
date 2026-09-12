import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "bun:test";

const repoRoot = resolve(import.meta.dir, "../../..");

function readSrc(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

const helpSrc = readSrc("src/app/compass-help.tsx");
const layoutSrc = readSrc("src/app/_layout.tsx");
const appJson = JSON.parse(readSrc("app.json")) as {
  expo: { plugins: (string | [string, Record<string, unknown>])[] };
};

function compassHelpScreenOptions(source: string) {
  const match = source.match(
    /name="compass-help"\s*,?\s*options=\{\{([\s\S]*?)\}\}/,
  );
  return match?.[1] ?? "";
}

describe("compass-help collapse", () => {
  it("is one route body — no iOS/Android forks", () => {
    expect(existsSync(resolve(repoRoot, "src/app/compass-help.tsx"))).toBe(true);
    expect(existsSync(resolve(repoRoot, "src/app/compass-help.ios.tsx"))).toBe(
      false,
    );
    expect(existsSync(resolve(repoRoot, "src/app/compass-help.android.tsx"))).toBe(
      false,
    );
  });

  it("ships the product Array Orientation copy", () => {
    expect(helpSrc).toContain('COMPASS_HELP_TITLE = "Array Orientation"');
    expect(helpSrc).toContain("Drag the arrow");
    expect(helpSrc).toContain("panel array faces");
    expect(helpSrc).toContain("orientation for optimal sun exposure");
    expect(helpSrc).not.toContain("Compass help is not yet implemented");
  });

  it("keeps sheet chrome in _layout, not the body", () => {
    expect(helpSrc).not.toContain("ModalBottomSheet");
    expect(helpSrc).not.toContain("formSheet");
    expect(helpSrc).not.toContain("transparentModal");
    expect(helpSrc).not.toContain("sheetAllowedDetents");
    expect(helpSrc).not.toContain("@expo/ui/swift-ui");
    expect(helpSrc).not.toContain("@expo/ui/jetpack-compose");

    const options = compassHelpScreenOptions(layoutSrc);
    expect(options).toContain('presentation: Platform.OS === \'ios\' ? "formSheet" : "transparentModal"');
    expect(options).toContain("sheetGrabberVisible: Platform.OS === 'ios'");
    expect(options).toContain("sheetAllowedDetents: Platform.OS === 'ios' ? [0.3]");
  });

  it("does not collapse Custom (Config is already one file)", () => {
    expect(existsSync(resolve(repoRoot, "src/app/custom.ios.tsx"))).toBe(true);
    expect(existsSync(resolve(repoRoot, "src/app/custom.android.tsx"))).toBe(true);
    expect(existsSync(resolve(repoRoot, "src/app/config.tsx"))).toBe(true);
    expect(existsSync(resolve(repoRoot, "src/app/config.ios.tsx"))).toBe(false);
    expect(existsSync(resolve(repoRoot, "src/app/config.android.tsx"))).toBe(false);
  });

  it("does not flip Hermes V1", () => {
    const buildProps = appJson.expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-build-properties",
    ) as [string, Record<string, unknown>] | undefined;
    expect(buildProps?.[1]?.useHermesV1).toBe(true);
  });
});
