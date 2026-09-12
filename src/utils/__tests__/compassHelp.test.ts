import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "bun:test";

const repoRoot = resolve(import.meta.dir, "../../..");

function readSrc(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

const copySrc = readSrc("src/utils/compassHelpCopy.ts");
const bodySrc = readSrc("src/components/CompassHelpBody.tsx");
const routeSrc = readSrc("src/app/compass-help.tsx");
const iosSrc = readSrc("src/components/screens/CompassHelpScreen.ios.tsx");
const androidSrc = readSrc("src/components/screens/CompassHelpScreen.android.tsx");
const webSrc = readSrc("src/components/screens/CompassHelpScreen.tsx");
const layoutSrc = readSrc("src/app/_layout.tsx");
const uploadSrc = readSrc("src/app/upload.tsx");
const appJson = JSON.parse(readSrc("app.json")) as {
  expo: { plugins: (string | [string, Record<string, unknown>])[] };
};

function compassHelpScreenOptions(source: string) {
  const match = source.match(
    /name="compass-help"\s*,?\s*options=\{\{([\s\S]*?)\}\}/,
  );
  return match?.[1] ?? "";
}

describe("compass-help leftover chrome", () => {
  it("keeps the route as a thin leftover re-export — no src/app forks", () => {
    expect(routeSrc.trim()).toBe(
      'export { default } from "@/components/screens/CompassHelpScreen";',
    );
    expect(existsSync(resolve(repoRoot, "src/app/compass-help.tsx"))).toBe(true);
    expect(existsSync(resolve(repoRoot, "src/app/compass-help.ios.tsx"))).toBe(
      false,
    );
    expect(existsSync(resolve(repoRoot, "src/app/compass-help.android.tsx"))).toBe(
      false,
    );
  });

  it("ships the product Array Orientation copy", () => {
    expect(copySrc).toContain('COMPASS_HELP_TITLE = "Array Orientation"');
    expect(copySrc).toContain("Drag the arrow");
    expect(copySrc).toContain("panel array faces");
    expect(copySrc).toContain("orientation for optimal sun exposure");
    expect(copySrc).not.toContain("Compass help is not yet implemented");
    expect(bodySrc).toContain("COMPASS_HELP_TITLE");
    expect(bodySrc).toContain("COMPASS_HELP_BODY");
    expect(iosSrc).toContain("CompassHelpBody");
    expect(webSrc).toContain("CompassHelpBody");
    expect(androidSrc).toContain("COMPASS_HELP_TITLE");
    expect(androidSrc).toContain("COMPASS_HELP_BODY");
  });

  it("uses leftover Compose ModalBottomSheet on Android, Router formSheet on iOS", () => {
    expect(iosSrc).not.toContain("ModalBottomSheet");
    expect(iosSrc).not.toContain("@expo/ui/jetpack-compose");
    expect(iosSrc).not.toContain("isPresented");
    expect(webSrc).not.toContain("ModalBottomSheet");
    expect(webSrc).not.toContain("<Host");
    expect(routeSrc).not.toContain("ModalBottomSheet");
    expect(routeSrc).not.toContain("formSheet");
    expect(routeSrc).not.toContain("transparentModal");
    expect(routeSrc).not.toContain("isPresented");

    expect(androidSrc).toContain("ModalBottomSheet");
    expect(androidSrc).toContain("@expo/ui/jetpack-compose");
    expect(androidSrc).toContain("onDismissRequest");
    expect(androidSrc).toContain("router.back()");
    expect(androidSrc).not.toContain("isPresented");
    expect(androidSrc).not.toContain("from \"@expo/ui\"");
    expect(androidSrc).not.toContain("showDragHandle={false}");
    expect(androidSrc).not.toContain("community/bottom-sheet");

    const options = compassHelpScreenOptions(layoutSrc);
    expect(options).toContain('presentation: Platform.OS === \'ios\' ? "formSheet" : "transparentModal"');
    expect(options).toContain("sheetGrabberVisible: Platform.OS === 'ios'");
    expect(options).toContain("sheetAllowedDetents: Platform.OS === 'ios' ? [0.3]");
    expect(options).toContain('contentStyle: Platform.OS === \'ios\' ? { backgroundColor: "transparent" } : undefined');
    expect(options).not.toContain("colors.background.primary");
  });

  it("does not put Host on Upload first paint or flip Hermes V1", () => {
    expect(uploadSrc).not.toContain("<Host");
    expect(uploadSrc).not.toContain("entering");

    const buildProps = appJson.expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-build-properties",
    ) as [string, Record<string, unknown>] | undefined;
    expect(buildProps?.[1]?.useHermesV1).toBe(true);
  });
});
