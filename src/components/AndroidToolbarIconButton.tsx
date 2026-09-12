import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ColorValue,
  type ImageSourcePropType,
} from "react-native";
import { Stack } from "expo-router";
import { CustomToolbarAndroidIcon } from "@/components/CustomToolbarAndroidIcon";

type AndroidToolbarIconButtonProps = {
  source: ImageSourcePropType;
  tint: ColorValue;
  onPress: () => void;
  accessibilityLabel?: string;
  hidden?: boolean;
  badge?: string;
};

/**
 * Android Stack.Toolbar.Button is icon-only. accessibilityLabel lands on a
 * Compose Icon (android.view.View, clickable=false). Maestro then taps a
 * dead node. Keep the label on a RN Pressable drawn *above* the Compose
 * Host/Icon so the tap lands on a clickable node.
 */
function AndroidToolbarHitOverlay({
  onPress,
  accessibilityLabel,
}: {
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const labeled = accessibilityLabel != null && accessibilityLabel.length > 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={labeled ? accessibilityLabel : undefined}
      accessibilityRole={labeled ? "button" : undefined}
      accessible={labeled}
      collapsable={false}
      cancelable={false}
      style={styles.toolbarIconHit}
    >
      <View style={styles.toolbarIconHit} collapsable={false} />
    </Pressable>
  );
}

export function AndroidToolbarIconButton({
  source,
  tint,
  onPress,
  accessibilityLabel,
  hidden,
  badge,
}: AndroidToolbarIconButtonProps) {
  return (
    <Stack.Toolbar.View hidden={hidden}>
      <View style={styles.toolbarIconButton} collapsable={false}>
        <View
          pointerEvents="none"
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={styles.toolbarIconGlyph}
        >
          <CustomToolbarAndroidIcon source={source} tint={tint} />
          {badge ? (
            <View style={styles.badge} pointerEvents="none" accessible={false}>
              <Text style={styles.badgeLabel}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <AndroidToolbarHitOverlay
          onPress={onPress}
          accessibilityLabel={accessibilityLabel}
        />
      </View>
    </Stack.Toolbar.View>
  );
}

const styles = StyleSheet.create({
  toolbarIconButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  toolbarIconGlyph: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },
  toolbarIconHit: {
    ...StyleSheet.absoluteFill,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeLabel: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
});
