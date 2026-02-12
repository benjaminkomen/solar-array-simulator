import { useColorScheme } from "react-native";

const palette = {
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
  amber: { 400: "#fbbf24" },
  red: { 500: "#ef4444", system: "#FF3B30" },
  white: "#ffffff",
  black: "#000000",
};

export const lightColors = {
  primary: palette.blue[500],
  primaryLight: palette.blue[50],

  text: {
    primary: palette.gray[900],
    secondary: palette.gray[500],
    tertiary: palette.gray[400],
    inverse: palette.white,
  },

  background: {
    primary: palette.white,
    secondary: palette.gray[50],
    tertiary: palette.gray[100],
  },

  border: {
    light: palette.gray[200],
    medium: palette.gray[300],
  },

  panel: {
    linked: {
      fill: palette.blue[500],
      stroke: palette.blue[700],
      grid: palette.blue[400],
    },
    unlinked: {
      fill: palette.gray[400],
      stroke: palette.gray[500],
      grid: palette.gray[300],
    },
    selection: palette.amber[400],
  },

  system: { red: palette.red.system },
};

export const darkColors = {
  primary: palette.blue[400],
  primaryLight: palette.blue[700],

  text: {
    primary: palette.white,
    secondary: palette.gray[400],
    tertiary: palette.gray[500],
    inverse: palette.gray[900],
  },

  background: {
    primary: palette.black,
    secondary: palette.gray[900],
    tertiary: palette.gray[800],
  },

  border: {
    light: palette.gray[700],
    medium: palette.gray[500],
  },

  panel: {
    linked: {
      fill: palette.blue[500],
      stroke: palette.blue[400],
      grid: palette.blue[600],
    },
    unlinked: {
      fill: palette.gray[500],
      stroke: palette.gray[400],
      grid: palette.gray[700],
    },
    selection: palette.amber[400],
  },

  system: { red: palette.red.system },
};

export type Colors = typeof lightColors;

export function useColors(): Colors {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkColors : lightColors;
}
