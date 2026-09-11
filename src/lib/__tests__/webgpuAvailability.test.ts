import { describe, it, expect } from "bun:test";
import {
  tryEnableWebGPU,
  type WebGPUAvailabilityDeps,
} from "../webgpuAvailability";

function deps(overrides: Partial<WebGPUAvailabilityDeps>): WebGPUAvailabilityDeps {
  return {
    getWebGPUModule: () => null,
    hasRNWebGPU: () => false,
    ...overrides,
  };
}

describe("tryEnableWebGPU", () => {
  it("returns true when RNWebGPU is already installed", () => {
    expect(
      tryEnableWebGPU(
        deps({
          hasRNWebGPU: () => true,
          getWebGPUModule: () => {
            throw new Error("should not look up the native module");
          },
        }),
      ),
    ).toBe(true);
  });

  it("returns false when the WebGPU TurboModule is missing", () => {
    expect(tryEnableWebGPU(deps({ getWebGPUModule: () => null }))).toBe(false);
  });

  it("returns false when install() throws", () => {
    expect(
      tryEnableWebGPU(
        deps({
          getWebGPUModule: () => ({
            install: () => {
              throw new Error("JSI install failed");
            },
          }),
        }),
      ),
    ).toBe(false);
  });

  it("returns false when install() runs but RNWebGPU is still missing", () => {
    let installed = false;
    expect(
      tryEnableWebGPU(
        deps({
          getWebGPUModule: () => ({
            install: () => {
              installed = true;
              return false;
            },
          }),
          hasRNWebGPU: () => false,
        }),
      ),
    ).toBe(false);
    expect(installed).toBe(true);
  });

  it("returns true after install() populates RNWebGPU", () => {
    let ready = false;
    expect(
      tryEnableWebGPU(
        deps({
          getWebGPUModule: () => ({
            install: () => {
              ready = true;
              return true;
            },
          }),
          hasRNWebGPU: () => ready,
        }),
      ),
    ).toBe(true);
  });
});
