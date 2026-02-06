import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { Canvas } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { SolarPanel, PANEL_WIDTH, PANEL_HEIGHT } from "@/components/SolarPanel";

export default function Custom() {
  // Panel 1 state
  const panel1X = useSharedValue(80);
  const panel1Y = useSharedValue(200);
  const offset1X = useSharedValue(80);
  const offset1Y = useSharedValue(200);

  // Panel 2 state
  const panel2X = useSharedValue(180);
  const panel2Y = useSharedValue(200);
  const offset2X = useSharedValue(180);
  const offset2Y = useSharedValue(200);

  // Track which panel is being dragged (-1 = none)
  const activePanel = useSharedValue(-1);

  const gesture = Gesture.Pan()
    .onStart((e) => {
      "worklet";
      const touchX = e.x;
      const touchY = e.y;

      // Check if touch is within panel 1
      if (
        touchX >= panel1X.value &&
        touchX <= panel1X.value + PANEL_WIDTH &&
        touchY >= panel1Y.value &&
        touchY <= panel1Y.value + PANEL_HEIGHT
      ) {
        activePanel.value = 0;
        offset1X.value = panel1X.value;
        offset1Y.value = panel1Y.value;
        return;
      }

      // Check if touch is within panel 2
      if (
        touchX >= panel2X.value &&
        touchX <= panel2X.value + PANEL_WIDTH &&
        touchY >= panel2Y.value &&
        touchY <= panel2Y.value + PANEL_HEIGHT
      ) {
        activePanel.value = 1;
        offset2X.value = panel2X.value;
        offset2Y.value = panel2Y.value;
        return;
      }

      activePanel.value = -1;
    })
    .onUpdate((e) => {
      "worklet";
      if (activePanel.value === 0) {
        panel1X.value = offset1X.value + e.translationX;
        panel1Y.value = offset1Y.value + e.translationY;
      } else if (activePanel.value === 1) {
        panel2X.value = offset2X.value + e.translationX;
        panel2Y.value = offset2Y.value + e.translationY;
      }
    })
    .onEnd(() => {
      "worklet";
      activePanel.value = -1;
    });

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal" />
      <View style={styles.container}>
        <GestureDetector gesture={gesture}>
          <Canvas style={styles.canvas}>
            <SolarPanel x={panel1X} y={panel1Y} />
            <SolarPanel x={panel2X} y={panel2Y} />
          </Canvas>
        </GestureDetector>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb", // gray-50
  },
  canvas: {
    flex: 1,
  },
});
