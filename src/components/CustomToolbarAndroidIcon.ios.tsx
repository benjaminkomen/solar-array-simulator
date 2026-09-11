import type { ColorValue, ImageSourcePropType } from "react-native";

type CustomToolbarAndroidIconProps = {
  source: ImageSourcePropType;
  tint: ColorValue;
};

/** iOS uses Stack.Toolbar.Button icons; this module is Android-only. */
export function CustomToolbarAndroidIcon(_props: CustomToolbarAndroidIconProps) {
  return null;
}
