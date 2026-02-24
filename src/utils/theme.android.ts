import { useColorScheme } from "react-native";
import { Color } from "expo-router";
import { lightColors, darkColors, type Colors } from "./theme.base";

// UI colors backed by Material You dynamic tokens (adapt to the user's wallpaper).
// panel.* colors stay as plain hex strings — they are consumed by Skia canvas worklets
// which run on the UI thread and cannot resolve PlatformColor references.
const androidUiColors = {
  primary: Color.android.dynamic.primary,
  primaryLight: Color.android.dynamic.primaryContainer,

  text: {
    primary: Color.android.dynamic.onSurface,
    secondary: Color.android.dynamic.onSurfaceVariant,
    tertiary: Color.android.dynamic.onSurfaceVariant,
    inverse: Color.android.dynamic.onPrimary,
  },

  background: {
    primary: Color.android.dynamic.surface,
    secondary: Color.android.dynamic.surfaceContainerLow,
    tertiary: Color.android.dynamic.surfaceContainerHigh,
  },

  border: {
    light: Color.android.dynamic.outlineVariant,
    medium: Color.android.dynamic.outline,
  },

  system: { red: Color.android.dynamic.error },
};

export { lightColors, darkColors, type Colors } from "./theme.base";

export function useColors(): Colors {
  // useColorScheme drives two things:
  //  1. Re-renders when the system theme changes (required for PlatformColor to re-resolve)
  //  2. Picks the correct hex panel palette for Skia canvas worklets
  const scheme = useColorScheme();
  return {
    ...androidUiColors,
    panel: scheme === "dark" ? darkColors.panel : lightColors.panel,
  };
}
