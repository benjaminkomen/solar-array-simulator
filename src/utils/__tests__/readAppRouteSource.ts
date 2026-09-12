import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const SCREEN_FILES: Record<string, string> = {
  custom: "CustomScreen",
  "inverter-details": "InverterDetailsScreen",
  "panel-details": "PanelDetailsScreen",
  "compass-help": "CompassHelpScreen",
};

/**
 * Prefer leftover platform chrome in `src/components/screens/` after #56,
 * then `src/app/<name>.<platform>.tsx` if a pair still exists, then the
 * collapsed `src/app/<name>.tsx` (Production, Config, Upload, Analyze,
 * Simulation).
 */
export function readAppRouteSource(
  repoRoot: string,
  name: string,
  platform: "ios" | "android",
): { file: string; src: string } {
  const appDir = resolve(repoRoot, "src/app");
  const screensDir = resolve(repoRoot, "src/components/screens");
  const screenName = SCREEN_FILES[name];
  const screenPlatform = screenName
    ? resolve(screensDir, `${screenName}.${platform}.tsx`)
    : "";
  const platformFile = resolve(appDir, `${name}.${platform}.tsx`);
  const collapsed = resolve(appDir, `${name}.tsx`);
  if (screenPlatform && existsSync(screenPlatform)) {
    return { file: screenPlatform, src: readFileSync(screenPlatform, "utf8") };
  }
  if (existsSync(platformFile)) {
    return { file: platformFile, src: readFileSync(platformFile, "utf8") };
  }
  if (existsSync(collapsed)) {
    return { file: collapsed, src: readFileSync(collapsed, "utf8") };
  }
  throw new Error(`Missing ${name} route (${platformFile} or ${collapsed})`);
}
