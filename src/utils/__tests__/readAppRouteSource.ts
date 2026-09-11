import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Collapse-rebase hook: prefer `src/app/<name>.<platform>.tsx` while the
 * pair still exists; fall back to `src/app/<name>.tsx` after the pair lands.
 */
export function readAppRouteSource(
  repoRoot: string,
  name: string,
  platform: "ios" | "android",
): { file: string; src: string } {
  const appDir = resolve(repoRoot, "src/app");
  const platformFile = resolve(appDir, `${name}.${platform}.tsx`);
  const collapsed = resolve(appDir, `${name}.tsx`);
  if (existsSync(platformFile)) {
    return { file: platformFile, src: readFileSync(platformFile, "utf8") };
  }
  if (existsSync(collapsed)) {
    return { file: collapsed, src: readFileSync(collapsed, "utf8") };
  }
  throw new Error(`Missing ${name} route (${platformFile} or ${collapsed})`);
}
