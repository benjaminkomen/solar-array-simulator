import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "../../..");

function readJson(relativePath: string) {
  return JSON.parse(readFileSync(resolve(repoRoot, relativePath), "utf8"));
}

describe("WebGPU native linking (Expo SDK 56 / RN 0.85)", () => {
  it("pins React Native 0.85.x and Expo SDK 56", () => {
    const pkg = readJson("package.json") as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies["react-native"]).toMatch(/^0\.85\./);
    expect(pkg.dependencies.expo).toMatch(/56/);
    expect(pkg.dependencies["react-native-webgpu"]).toBe("0.10.0");
    expect(pkg.dependencies["react-native-wgpu"]).toBeUndefined();
  });

  it("does not set newArchEnabled — SDK 56 New Architecture is always on", () => {
    const appJson = readJson("app.json") as {
      expo: { newArchEnabled?: boolean; ios?: { newArchEnabled?: boolean } };
    };
    expect(appJson.expo.newArchEnabled).toBeUndefined();
    expect(appJson.expo.ios?.newArchEnabled).toBeUndefined();
    const buildProps = (
      appJson as {
        expo: { plugins: (string | [string, Record<string, unknown>])[] };
      }
    ).expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-build-properties",
    ) as [string, Record<string, unknown>] | undefined;
    expect(buildProps?.[1]?.newArchEnabled).toBeUndefined();
    expect(
      (buildProps?.[1]?.ios as { newArchEnabled?: boolean } | undefined)
        ?.newArchEnabled,
    ).toBeUndefined();
    expect(
      (buildProps?.[1]?.android as { newArchEnabled?: boolean } | undefined)
        ?.newArchEnabled,
    ).toBeUndefined();
  });

  it("sets Android minSdk 26 for react-native-webgpu AHardwareBuffer (keeps Hermes V1 + PCH)", () => {
    const appJson = readJson("app.json") as {
      expo: { plugins: (string | [string, Record<string, unknown>])[] };
    };
    const buildProps = appJson.expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-build-properties",
    ) as [string, Record<string, unknown>] | undefined;

    expect(buildProps?.[1]?.useHermesV1).toBe(true);
    const android = buildProps?.[1]?.android as
      | {
          minSdkVersion?: number;
          usePrecompiledHeaders?: boolean;
        }
      | undefined;
    // react-native-webgpu 0.10 CMake inherits the app minSdk. Expo default 24
    // fails AHardwareBuffer_* (API 26+). Library source/example set minSdk 26.
    expect(android?.minSdkVersion).toBeGreaterThanOrEqual(26);
    expect(android?.usePrecompiledHeaders).toBe(true);
  });

  it("registers the Expo plugin and pins RN autolinking for iOS + Android", () => {
    const appJson = readJson("app.json") as {
      expo: { plugins: (string | [string, unknown])[] };
    };
    const pluginNames = appJson.expo.plugins.map((plugin) =>
      Array.isArray(plugin) ? plugin[0] : plugin,
    );
    expect(pluginNames).toContain("react-native-webgpu");

    const rnConfig = readFileSync(
      resolve(repoRoot, "react-native.config.js"),
      "utf8",
    );
    expect(rnConfig).toContain("react-native-webgpu");
    expect(rnConfig).not.toMatch(/android:\s*null/);
    expect(rnConfig).not.toMatch(/ios:\s*null/);
  });

  it("ships an iOS podspec and Dawn static libs for device + simulator", () => {
    const pkgRoot = resolve(repoRoot, "node_modules/react-native-webgpu");
    expect(existsSync(resolve(pkgRoot, "react-native-webgpu.podspec"))).toBe(
      true,
    );

    const xcframework = resolve(
      pkgRoot,
      "libs/apple/libwebgpu_dawn.xcframework",
    );
    const info = readFileSync(resolve(xcframework, "Info.plist"), "utf8");
    expect(info).toContain("ios-arm64");
    expect(info).toContain("ios-arm64_x86_64-simulator");
    expect(info).toContain("libwebgpu_dawn.a");

    expect(
      existsSync(
        resolve(xcframework, "ios-arm64/libwebgpu_dawn.a"),
      ),
    ).toBe(true);
    expect(
      existsSync(
        resolve(xcframework, "ios-arm64_x86_64-simulator/libwebgpu_dawn.a"),
      ),
    ).toBe(true);
  });

  it("ships Android Dawn shared libraries including arm64-v8a", () => {
    const androidLibs = resolve(
      repoRoot,
      "node_modules/react-native-webgpu/libs/android",
    );
    expect(existsSync(resolve(androidLibs, "arm64-v8a/libwebgpu_dawn.so"))).toBe(
      true,
    );
    expect(
      existsSync(resolve(repoRoot, "node_modules/react-native-webgpu/android/build.gradle")),
    ).toBe(true);
  });

  it("documents EAS profiles that must be rebuilt after native WebGPU changes", () => {
    const eas = readJson("eas.json") as {
      build: Record<string, { ios?: { simulator?: boolean } }>;
    };
    expect(eas.build["development-simulator"]?.ios?.simulator).toBe(true);
    expect(eas.build.development).toBeDefined();
  });
});
