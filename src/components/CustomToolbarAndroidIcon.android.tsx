import { Image } from "expo-image";
import type { ColorValue, ImageSourcePropType } from "react-native";

type CustomToolbarAndroidIconProps = {
  source: ImageSourcePropType;
  tint: ColorValue;
};

/**
 * RN image only — no Compose Host. A Host inside Toolbar.View's RNHostView
 * swallows clicks even when the parent Pressable is clickable=true.
 */
export function CustomToolbarAndroidIcon({ source, tint }: CustomToolbarAndroidIconProps) {
  return (
    <Image
      source={source}
      style={{ width: 24, height: 24 }}
      contentFit="contain"
      tintColor={typeof tint === "string" ? tint : undefined}
    />
  );
}