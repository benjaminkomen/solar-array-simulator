/**
 * react-native-wgpu@0.4.x (and any binary still built with it) evaluates
 * `navigator.gpu = RNWebGPU.gpu` at import time. Hermes throws
 * `Property 'RNWebGPU' doesn't exist` when native `install()` did not
 * populate that global.
 *
 * On Expo SDK 56 / RN 0.85 bridgeless, 0.4.x's iOS install() casts
 * `[RCTBridge currentBridge]` to RCTCxxBridge and bails. Android 0.4.x
 * calls `getCatalystInstance()`, which also fails in bridgeless.
 * react-native-webgpu@0.10+ installs via `self.bridge.runtime`.
 *
 * Probe WebGPUModule and run `install()` *before* importing Canvas so
 * existing 0.4.x clients show a fallback instead of a redbox.
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
