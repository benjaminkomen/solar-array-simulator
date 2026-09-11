import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { setMetalApiValidationDisabled } from "react-native-webgpu/plugin/build/setMetalApiValidation.js";

const appJsonPath = resolve(import.meta.dir, "../../../app.json");

const scheme = (launchAttributes: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<Scheme>
   <LaunchAction${launchAttributes}>
      <BuildableProductRunnable>
      </BuildableProductRunnable>
   </LaunchAction>
</Scheme>
`;

describe("react-native-webgpu Metal API validation plugin", () => {
  it("adds enableGPUValidationMode when the attribute is absent", () => {
    const result = setMetalApiValidationDisabled(
      scheme(' buildConfiguration = "Debug"'),
    );
    expect(result).toContain('enableGPUValidationMode = "1"');
    expect(result).toContain('buildConfiguration = "Debug"');
  });

  it("overwrites an existing enableGPUValidationMode value", () => {
    const result = setMetalApiValidationDisabled(
      scheme(' buildConfiguration = "Debug" enableGPUValidationMode = "0"'),
    );
    expect(result).toContain('enableGPUValidationMode = "1"');
    expect(result).not.toContain('enableGPUValidationMode = "0"');
  });

  it("is idempotent when validation is already disabled", () => {
    const once = setMetalApiValidationDisabled(
      scheme(' buildConfiguration = "Debug"'),
    );
    const twice = setMetalApiValidationDisabled(once);
    expect(twice).toBe(once);
  });

  it("is registered in app.json plugins", () => {
    const appJson = JSON.parse(readFileSync(appJsonPath, "utf8")) as {
      expo: { plugins: (string | [string, unknown])[] };
    };
    const pluginNames = appJson.expo.plugins.map((plugin) =>
      Array.isArray(plugin) ? plugin[0] : plugin,
    );
    expect(pluginNames).toContain("react-native-webgpu");
  });
});
