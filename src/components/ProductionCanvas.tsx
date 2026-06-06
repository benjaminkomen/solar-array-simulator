import { StyleSheet } from "react-native";
import { Canvas, Group } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { ProductionPanel } from "./ProductionPanel";
import type { PanelData } from "@/hooks/usePanelsManager";
import type { PanelColors } from "./SolarPanel";
import type { PanelState } from "@/utils/panelUtils";
import { hitTestPanels, screenToWorld } from "@/utils/panelUtils";
import { useCanvasTransform } from "@/hooks/useCanvasTransform";
import { useColors } from "@/utils/theme";

function applyViewportPan(
  viewportX: SharedValue<number>,
  viewportY: SharedValue<number>,
  startX: number,
  startY: number,
  translationX: number,
  translationY: number,
  scale: number,
) {
  "worklet";
  viewportX.value = startX + translationX / scale;
  viewportY.value = startY + translationY / scale;
}

interface ProductionCanvasProps {
  panels: PanelData[];
  wattages: Map<string, number>;
  viewportX: SharedValue<number>;
  viewportY: SharedValue<number>;
  scale: SharedValue<number>;
  canvasWidth: SharedValue<number>;
  canvasHeight: SharedValue<number>;
  onPanelTap?: (panelId: string) => void;
}

export function ProductionCanvas({
  panels,
  wattages,
  viewportX,
  viewportY,
  scale,
  canvasWidth,
  canvasHeight,
  onPanelTap,
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

  const canvasTransform = useCanvasTransform(canvasWidth, canvasHeight, viewportX, viewportY, scale);

  // Tap gesture for panel selection
  const tapGesture = Gesture.Tap()
    .onEnd((e) => {
      "worklet";
      const world = screenToWorld(e.x, e.y, canvasWidth.value, canvasHeight.value, viewportX.value, viewportY.value, scale.value);

      const states: PanelState[] = [];
      for (const p of panels) {
        states.push({
          id: p.id,
          x: p.x.value,
          y: p.y.value,
          rotation: p.rotation.value,
          inverterId: p.inverterId.value,
        });
      }

      const hitId = hitTestPanels(world.x, world.y, states);
      if (hitId && onPanelTap) {
        scheduleOnRN(onPanelTap, hitId);
      }
    });

  // Pan gesture for viewport panning only
  const panGesture = Gesture.Pan()
    .onStart(() => {
      "worklet";
      isPanningViewport.set(true);
      viewportStartX.set(viewportX.value);
      viewportStartY.set(viewportY.value);
    })
    .onUpdate((e) => {
      "worklet";
      applyViewportPan(
        viewportX,
        viewportY,
        viewportStartX.value,
        viewportStartY.value,
        e.translationX,
        e.translationY,
        scale.value,
      );
    })
    .onEnd(() => {
      "worklet";
      isPanningViewport.set(false);
    });

  const combinedGestures = Gesture.Exclusive(panGesture, tapGesture);

  return (
    <GestureDetector gesture={combinedGestures}>
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
