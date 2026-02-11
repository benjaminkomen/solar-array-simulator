import { StyleSheet } from "react-native";
import { Canvas, Group } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  useSharedValue,
  useDerivedValue,
  type SharedValue,
} from "react-native-reanimated";
import { ProductionPanel } from "./ProductionPanel";
import type { PanelData } from "@/hooks/usePanelsManager";

interface ProductionCanvasProps {
  panels: PanelData[];
  wattages: Map<string, number>;
  viewportX: SharedValue<number>;
  viewportY: SharedValue<number>;
}

export function ProductionCanvas({
  panels,
  wattages,
  viewportX,
  viewportY,
}: ProductionCanvasProps) {
  // Viewport panning state
  const isPanningViewport = useSharedValue(false);
  const viewportStartX = useSharedValue(0);
  const viewportStartY = useSharedValue(0);

  // Transform for the entire canvas content (viewport offset)
  const canvasTransform = useDerivedValue(() => {
    return [{ translateX: viewportX.value }, { translateY: viewportY.value }];
  });

  // Pan gesture for viewport panning only
  const panGesture = Gesture.Pan()
    .onStart(() => {
      "worklet";
      isPanningViewport.value = true;
      viewportStartX.value = viewportX.value;
      viewportStartY.value = viewportY.value;
    })
    .onUpdate((e) => {
      "worklet";
      viewportX.value = viewportStartX.value + e.translationX;
      viewportY.value = viewportStartY.value + e.translationY;
    })
    .onEnd(() => {
      "worklet";
      isPanningViewport.value = false;
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Canvas style={styles.canvas}>
        <Group transform={canvasTransform}>
          {panels.map((panel) => (
            <ProductionPanel
              key={panel.id}
              x={panel.x}
              y={panel.y}
              rotation={panel.rotation}
              wattage={wattages.get(panel.id) ?? 0}
              inverterId={panel.inverterId}
            />
          ))}
        </Group>
      </Canvas>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
});
