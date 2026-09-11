/**
 * react-native-wgpu@0.4.x (and any binary still built with it) evaluates
 * `navigator.gpu = RNWebGPU.gpu` at import time. Hermes throws
 * `Property 'RNWebGPU' doesn't exist` when native `install()` did not
 * populate that global — either because Dawn/`WebGPUModule` was never
 * linked into the development-simulator .app, or because 0.4.x install()
 * fails on Expo SDK 56 bridgeless (`RCTCxxBridge` / `getCatalystInstance()`).
 *
 * Dawn is a static `libwebgpu_dawn.a` (device + ios-simulator slices), not a
 * named framework under the app Frameworks folder. A 124KB main binary with
 * only Expo, React, and Hermes frameworks does not disprove autolinking after
 * rebuild — look for the pod / static archive, not RNWebGPU.framework.
 *
 * react-native-webgpu@0.10+ installs via `self.bridge.runtime`. New
 * Architecture is mandatory on SDK 56 (do not set `newArchEnabled`).
 *
 * Probe WebGPUModule and run `install()` *before* importing Canvas so
 * existing clients show a fallback instead of a redbox.
 */

export type WebGPUNativeModule = {
  install?: () => boolean;
};

type TurboModuleLike = WebGPUNativeModule & {
  getConstants?: () => object;
};

export type WebGPUAvailabilityDeps = {
  getWebGPUModule: () => WebGPUNativeModule | null;
  hasRNWebGPU: () => boolean;
};

function defaultGetWebGPUModule(): WebGPUNativeModule | null {
  try {
    // Lazy require so bun unit tests do not load react-native.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TurboModuleRegistry } = require("react-native") as typeof import("react-native");
    return TurboModuleRegistry.get<TurboModuleLike>("WebGPUModule");
  } catch {
    return null;
  }
}

function defaultHasRNWebGPU(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    Object.prototype.hasOwnProperty.call(globalThis, "RNWebGPU")
  );
}

const defaultDeps: WebGPUAvailabilityDeps = {
  getWebGPUModule: defaultGetWebGPUModule,
  hasRNWebGPU: defaultHasRNWebGPU,
};

/**
 * Returns true only when the `RNWebGPU` JSI global exists (after install).
 * Never touches the bare `RNWebGPU` identifier — that throws in Hermes.
 */
export function tryEnableWebGPU(
  deps: WebGPUAvailabilityDeps = defaultDeps,
): boolean {
  if (deps.hasRNWebGPU()) {
    return true;
  }

  const nativeModule = deps.getWebGPUModule();
  if (nativeModule == null) {
    return false;
  }

  try {
    nativeModule.install?.();
  } catch {
    return false;
  }

  return deps.hasRNWebGPU();
}
