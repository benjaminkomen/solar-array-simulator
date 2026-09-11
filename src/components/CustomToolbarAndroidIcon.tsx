import type { ColorValue, ImageSourcePropType } from "react-native";

type CustomToolbarAndroidIconProps = {
  source: ImageSourcePropType;
  tint: ColorValue;
};

/** Fallback for non-native platforms. Android/iOS use the platform files. */
export function CustomToolbarAndroidIcon(_props: CustomToolbarAndroidIconProps) {
  return null;
}
