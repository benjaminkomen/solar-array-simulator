import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { ZOOM_LEVELS } from "@/utils/zoomConstants";

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
    <View style={[styles.container, { bottom: insets.bottom + 80 }]}>
      <Pressable
        onPress={handleZoomIn}
        style={[styles.button, !canZoomIn && styles.buttonDisabled]}
        accessibilityLabel="Zoom in"
        accessibilityRole="button"
      >
        <Ionicons
          name="add"
          size={22}
          color={canZoomIn ? "#374151" : "#d1d5db"}
        />
      </Pressable>
      <View style={styles.indicator}>
        {ZOOM_LEVELS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.line,
              index === currentIndex ? styles.lineActive : styles.lineInactive,
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
          color={canZoomOut ? "#374151" : "#d1d5db"}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
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
  lineActive: {
    backgroundColor: "#1f2937",
  },
  lineInactive: {
    backgroundColor: "#d1d5db",
  },
});
