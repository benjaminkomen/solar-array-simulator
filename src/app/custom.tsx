import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { Canvas } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { SolarPanel } from "@/components/SolarPanel";

const INITIAL_X = 100;
const INITIAL_Y = 200;

export default function Custom() {
  const translateX = useSharedValue(INITIAL_X);
  const translateY = useSharedValue(INITIAL_Y);
  const offsetX = useSharedValue(INITIAL_X);
  const offsetY = useSharedValue(INITIAL_Y);

  const gesture = Gesture.Pan()
    .onStart(() => {
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = offsetX.value + e.translationX;
      translateY.value = offsetY.value + e.translationY;
    });

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal" />
      <View style={styles.container}>
        <GestureDetector gesture={gesture}>
          <Canvas style={styles.canvas}>
            <SolarPanel x={translateX} y={translateY} />
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
