import { useColorScheme, AppState } from "react-native";
import { useEffect, useReducer } from "react";
import { Color } from "expo-router";
import { lightColors, darkColors, type Colors } from "./theme.base";

export { lightColors, darkColors, type Colors } from "./theme.base";

export function useColors(): Colors {
  // useColorScheme triggers re-renders on light/dark switches.
  const scheme = useColorScheme();

  // Force a re-render when the app returns to the foreground so that any
  // wallpaper / Material You palette change that happened while backgrounded
  // is picked up immediately (Color.android.dynamic.* resolves at call time).
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") forceUpdate();
    });
    return () => sub.remove();
  }, []);

  // All Color.android.dynamic.* calls are intentionally inside the hook body
  // so they resolve fresh on every render instead of being frozen at module
  // load time (the Proxy resolves to a static hex string on each call).
  return {
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

    // panel.* must stay as plain hex strings — Skia canvas worklets run on the
    // UI thread and cannot resolve PlatformColor / dynamic color references.
    panel: scheme === "dark" ? darkColors.panel : lightColors.panel,
  };
}
