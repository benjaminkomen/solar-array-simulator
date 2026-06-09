import { useColorScheme } from "react-native";
import { useColors, buildNavigationTheme } from "./theme.base";

export { lightColors, darkColors, type Colors, useColors } from "./theme.base";

export function useNavigationTheme(): ReactNavigation.Theme {
  const colors = useColors();
  const scheme = useColorScheme();
  return buildNavigationTheme(colors, scheme === "dark");
}
