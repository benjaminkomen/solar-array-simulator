import { Host, Icon } from "@expo/ui/jetpack-compose";
import type { ColorValue, ImageSourcePropType } from "react-native";

type CustomToolbarAndroidIconProps = {
  source: ImageSourcePropType;
  tint: ColorValue;
};

/** Compose icon inside a RN Pressable — do not put accessibilityLabel on this Icon. */
export function CustomToolbarAndroidIcon({ source, tint }: CustomToolbarAndroidIconProps) {
  return (
    <Host matchContents>
      <Icon source={source} tint={tint} />
    </Host>
  );
}
