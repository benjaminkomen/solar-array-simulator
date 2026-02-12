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
import type { PanelColors } from "./SolarPanel";
import { useColors } from "@/utils/theme";

interface ProductionCanvasProps {
  panels: PanelData[];
  wattages: Map<string, number>;
  viewportX: SharedValue<number>;
  viewportY: SharedValue<number>;
  scale: SharedValue<number>;
  canvasWidth: SharedValue<number>;
  canvasHeight: SharedValue<number>;
}

export function ProductionCanvas({
  panels,
  wattages,
  viewportX,
  viewportY,
  scale,
  canvasWidth,
  canvasHeight,
}: ProductionCanvasProps) {
  const colors = useColors();
  const panelColors: PanelColors = {
    linked: colors.panel.linked,
    unlinked: colors.panel.unlinked,
    selection: colors.panel.selection,
  };

  // Viewport panning state
  const isPanningViewport = useSharedValue(false);
  const viewportStartX = useSharedValue(0);
  const viewportStartY = useSharedValue(0);

  // Transform for the entire canvas content (viewport offset + scale centered on canvas)
  const canvasTransform = useDerivedValue(() => {
    const cx = canvasWidth.value / 2;
    const cy = canvasHeight.value / 2;
    return [
      { translateX: cx },
      { translateY: cy },
      { scale: scale.value },
      { translateX: -cx + viewportX.value },
      { translateY: -cy + viewportY.value },
    ];
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
      // Divide by scale for consistent pan feel
      viewportX.value = viewportStartX.value + e.translationX / scale.value;
      viewportY.value = viewportStartY.value + e.translationY / scale.value;
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
              colors={panelColors}
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
