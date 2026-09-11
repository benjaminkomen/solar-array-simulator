import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/utils/theme";
import { Button } from "@/components/Button";

/**
 * Canvas-area fallback when WebGPU cannot start. Simulation chrome
 * (title, Total Output, seasons) stays mounted so Maestro nav still works.
 */
export function WebGPUUnavailable() {
  const colors = useColors();
  const router = useRouter();

  return (
    <View
      testID="webgpu-unavailable"
      style={[styles.container, { backgroundColor: colors.background.secondary }]}
    >
      <Text style={[styles.title, { color: colors.text.primary }]}>
        3D view unavailable
      </Text>
      <Text style={[styles.message, { color: colors.text.secondary }]}>
        WebGPU failed to start on this build. Time and season controls still
        work. Rebuild the development client to enable the 3D scene.
      </Text>
      <Button
        title="Go Back"
        variant="outlined"
        testID="webgpu-unavailable-back"
        onPress={() => router.back()}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  button: {
    marginTop: 8,
    minWidth: 160,
  },
});
