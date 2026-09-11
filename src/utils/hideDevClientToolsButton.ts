import { requireOptionalNativeModule } from "expo";

type ExpoDevMenuModule = {
  setToolsButtonVisible?: (visible: boolean) => void;
};

type DevMenuPreferencesModule = {
  setPreferencesAsync?: (settings: { showFloatingActionButton: boolean }) => Promise<void>;
};

/**
 * Hide Expo Dev Client's floating Tools overlay so it does not steal the
 * Production header overflow hit target (Simulate + Configuration options).
 *
 * SDK 56's JS surface has no setToolsButtonVisible. iOS registers
 * DevMenuPreferences; Android hides via the Dev Menu "Tools button" toggle
 * (see `.maestro/shared/hide-android-dev-client-tools.yaml`).
 */
export function hideDevClientToolsButton(): void {
  if (typeof __DEV__ !== "undefined" && !__DEV__) {
    return;
  }

  const devMenu = requireOptionalNativeModule<ExpoDevMenuModule>("ExpoDevMenu");
  devMenu?.setToolsButtonVisible?.(false);

  const prefs = requireOptionalNativeModule<DevMenuPreferencesModule>("DevMenuPreferences");
  void prefs?.setPreferencesAsync?.({ showFloatingActionButton: false });
}
