import { Host, Icon } from "@expo/ui/jetpack-compose";
import type { ColorValue, ImageSourcePropType } from "react-native";

type CustomToolbarAndroidIconProps = {
  source: ImageSourcePropType;
  tint: ColorValue;
};

/**
 * Compose icon only — do not label this Icon.
 * Stack.Toolbar.Button puts that label on a dead android.view.View.
 * pointerEvents=none so the RN Pressable above receives the tap.
 */
export function CustomToolbarAndroidIcon({ source, tint }: CustomToolbarAndroidIconProps) {
  return (
    <Host matchContents pointerEvents="none">
      <Icon source={source} tint={tint} />
    </Host>
  );
}
