import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "bun:test";

const appDir = resolve(import.meta.dir, "../../app");
const uploadSrc = readFileSync(resolve(appDir, "upload.tsx"), "utf8");
const layoutSrc = readFileSync(resolve(appDir, "_layout.tsx"), "utf8");

function uploadScreenBlock(source: string): string {
  const match = source.match(
    /<Stack\.Screen\s+name="upload"[\s\S]*?\/>/,
  );
  return match?.[0] ?? "";
}

describe("upload route collapse", () => {
  it("uses one route file and deletes the platform forks", () => {
    expect(existsSync(resolve(appDir, "upload.tsx"))).toBe(true);
    expect(existsSync(resolve(appDir, "upload.ios.tsx"))).toBe(false);
    expect(existsSync(resolve(appDir, "upload.android.tsx"))).toBe(false);
  });

  it("does not put a Host or Reanimated entering on first paint", () => {
    expect(uploadSrc).not.toMatch(/@expo\/ui/);
    expect(uploadSrc).not.toMatch(/\bHost\b/);
    expect(uploadSrc).not.toMatch(/jetpack-compose|swift-ui/);
    expect(uploadSrc).not.toMatch(/react-native-reanimated/);
    expect(uploadSrc).not.toMatch(/\bentering\s*=/);
    expect(uploadSrc).not.toMatch(/\bFadeIn\b/);
  });

  it("shares one Skip toolbar that Android Maestro can tap", () => {
    expect(uploadSrc).toContain('Stack.Toolbar placement="bottom"');
    expect(uploadSrc).toContain("handleSkip");
    expect(uploadSrc).toMatch(/hidden=\{!isWizardMode\}/);
    expect(uploadSrc).toContain("Skip");
    expect(uploadSrc).toContain('Platform.OS === "android"');
    expect(uploadSrc).toContain("Stack.Toolbar.View");
    expect(uploadSrc).toContain("toolbarTextButton");
    expect(uploadSrc).toContain('accessibilityLabel="Skip"');
    expect(uploadSrc).toContain("Stack.Toolbar.Button");
  });

  it("keeps header options in the root layout, not the route file", () => {
    expect(uploadSrc).not.toContain("Stack.Screen");
    expect(uploadSrc).not.toContain("BackButton");
    const uploadScreen = uploadScreenBlock(layoutSrc);
    expect(uploadScreen).toContain('name="upload"');
    expect(uploadScreen).toContain('headerBackButtonDisplayMode: "minimal"');
  });

  it("keeps the same picker testIDs and title copy", () => {
    expect(uploadSrc).toContain("Take or Select Photo");
    expect(uploadSrc).toContain('testID="take-photo-button"');
    expect(uploadSrc).toContain('testID="choose-gallery-button"');
  });

  it("exposes wizard-only Continue without photo for empty galleries", () => {
    expect(uploadSrc).toContain("ANALYZE_CONTINUE_WITHOUT_PHOTO_TEST_ID");
    expect(uploadSrc).toContain("handleContinueWithoutPhoto");
    expect(uploadSrc).toContain("{isWizardMode && (");
  });
});
