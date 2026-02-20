import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { ZOOM_LEVELS } from "@/utils/zoomConstants";
import { useColors } from "@/utils/theme";

interface ZoomControlsProps {
  currentIndex: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function ZoomControls({
  currentIndex,
  onZoomIn,
  onZoomOut,
}: ZoomControlsProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const canZoomIn = currentIndex > 0;
  const canZoomOut = currentIndex < ZOOM_LEVELS.length - 1;

  const handleZoomIn = () => {
    if (canZoomIn) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onZoomIn();
    }
  };

  const handleZoomOut = () => {
    if (canZoomOut) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onZoomOut();
    }
  };

  return (
    <View style={[styles.container, { bottom: insets.bottom + 80, backgroundColor: colors.background.primary }]}>
      <Pressable
        onPress={handleZoomIn}
        style={[styles.button, !canZoomIn && styles.buttonDisabled]}
        accessibilityLabel="Zoom in"
        accessibilityRole="button"
      >
        <Ionicons
          name="add"
          size={22}
          color={canZoomIn ? colors.text.primary : colors.border.medium}
        />
      </Pressable>
      <View style={styles.indicator}>
        {ZOOM_LEVELS.map((level, index) => (
          <View
            key={level}
            style={[
              styles.line,
              { backgroundColor: index === currentIndex ? colors.text.primary : colors.border.medium },
            ]}
          />
        ))}
      </View>
      <Pressable
        onPress={handleZoomOut}
        style={[styles.button, !canZoomOut && styles.buttonDisabled]}
        accessibilityLabel="Zoom out"
        accessibilityRole="button"
      >
        <Ionicons
          name="remove"
          size={22}
          color={canZoomOut ? colors.text.primary : colors.border.medium}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  button: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  indicator: {
    width: 44,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  line: {
    width: 20,
    height: 2,
    borderRadius: 1,
  },
});
