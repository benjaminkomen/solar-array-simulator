import { StyleSheet } from "react-native";
import { Canvas, Group } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  useSharedValue,
  useDerivedValue,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { SolarPanel } from "./SolarPanel";
import type { PanelData } from "@/hooks/usePanelsManager";
import type { PanelState } from "@/utils/panelUtils";
import { hitTestPanels, getPanelDimensions, getPanelRect } from "@/utils/panelUtils";
import { collidesWithAny } from "@/utils/collision";
import { snapToNeighbors } from "@/utils/neighborSnap";

interface SolarPanelCanvasProps {
  panels: PanelData[];
  selectedId: string | null;
  onSelectPanel: (id: string | null) => void;
  onBringToFront: (id: string) => void;
  onSavePanelPosition: (panelId: string, x: number, y: number) => void;
  viewportX: SharedValue<number>;
  viewportY: SharedValue<number>;
  scale: SharedValue<number>;
  canvasWidth: SharedValue<number>;
  canvasHeight: SharedValue<number>;
}

export function SolarPanelCanvas({
  panels,
  selectedId,
  onSelectPanel,
  onBringToFront,
  onSavePanelPosition,
  viewportX,
  viewportY,
  scale,
  canvasWidth,
  canvasHeight,
}: SolarPanelCanvasProps) {
  // Panel dragging state
  const draggedPanelId = useSharedValue<string | null>(null);
  const panelOffsetX = useSharedValue(0);
  const panelOffsetY = useSharedValue(0);

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

  // Main pan gesture - handles both panel dragging and viewport panning
  const panGesture = Gesture.Pan()
    .onStart((e) => {
      "worklet";
      // Convert screen coordinates to world coordinates (accounting for scale)
      const cx = canvasWidth.value / 2;
      const cy = canvasHeight.value / 2;
      const worldX = (e.x - cx) / scale.value + cx - viewportX.value;
      const worldY = (e.y - cy) / scale.value + cy - viewportY.value;

      // Get current panel states for hit testing (in world coordinates)
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

      // Hit test to find which panel was touched
      const hitId = hitTestPanels(worldX, worldY, states);

      if (hitId) {
        // Dragging a panel
        draggedPanelId.value = hitId;
        isPanningViewport.value = false;
        const panel = panels.find((p) => p.id === hitId);
        if (panel) {
          panelOffsetX.value = panel.x.value;
          panelOffsetY.value = panel.y.value;
        }
        scheduleOnRN(onSelectPanel, hitId);
        scheduleOnRN(onBringToFront, hitId);
      } else {
        // Panning the viewport
        draggedPanelId.value = null;
        isPanningViewport.value = true;
        viewportStartX.value = viewportX.value;
        viewportStartY.value = viewportY.value;
        scheduleOnRN(onSelectPanel, null);
      }
    })
    .onUpdate((e) => {
      "worklet";
      if (isPanningViewport.value) {
        // Pan the viewport (divide by scale for consistent pan feel)
        viewportX.value = viewportStartX.value + e.translationX / scale.value;
        viewportY.value = viewportStartY.value + e.translationY / scale.value;
        return;
      }

      const panelId = draggedPanelId.value;
      if (!panelId) return;

      const panel = panels.find((p) => p.id === panelId);
      if (!panel) return;

      // Calculate new position in world coordinates (divide by scale for consistent drag)
      const newX = panelOffsetX.value + e.translationX / scale.value;
      const newY = panelOffsetY.value + e.translationY / scale.value;

      // Get panel dimensions based on rotation
      const dims = getPanelDimensions(panel.rotation.value);

      // Create test rectangle for collision
      const testRect = {
        x: newX,
        y: newY,
        width: dims.width,
        height: dims.height,
      };

      // Get other panel rects for collision detection
      const otherRects: { id: string; x: number; y: number; width: number; height: number }[] = [];
      for (const p of panels) {
        if (p.id === panelId) continue;
        const rect = getPanelRect({
          id: p.id,
          x: p.x.value,
          y: p.y.value,
          rotation: p.rotation.value,
          inverterId: p.inverterId.value,
        });
        otherRects.push({ ...rect, id: p.id });
      }

      // Check for collisions
      if (!collidesWithAny(testRect, otherRects)) {
        // No collision - update position
        panel.x.value = newX;
        panel.y.value = newY;
      }
    })
    .onEnd(() => {
      "worklet";
      if (isPanningViewport.value) {
        isPanningViewport.value = false;
        return;
      }

      const panelId = draggedPanelId.value;
      if (!panelId) return;

      const panel = panels.find((p) => p.id === panelId);
      if (!panel) return;

      // Get panel dimensions based on rotation
      const dims = getPanelDimensions(panel.rotation.value);

      // Get other panel rects for neighbor snapping
      const otherRects: { id: string; x: number; y: number; width: number; height: number }[] = [];
      for (const p of panels) {
        if (p.id === panelId) continue;
        const rect = getPanelRect({
          id: p.id,
          x: p.x.value,
          y: p.y.value,
          rotation: p.rotation.value,
          inverterId: p.inverterId.value,
        });
        otherRects.push({ ...rect, id: p.id });
      }

      // Snap to neighbors (with grid fallback)
      const snapped = snapToNeighbors(
        panel.x.value,
        panel.y.value,
        dims.width,
        dims.height,
        panelId,
        otherRects
      );

      // Apply snapped position
      panel.x.value = snapped.x;
      panel.y.value = snapped.y;

      // Save final position to persistent storage
      scheduleOnRN(onSavePanelPosition, panelId, panel.x.value, panel.y.value);

      draggedPanelId.value = null;
    });

  // Tap gesture for selection without drag
  const tapGesture = Gesture.Tap()
    .onStart((e) => {
      "worklet";
      // Convert screen coordinates to world coordinates (accounting for scale)
      const cx = canvasWidth.value / 2;
      const cy = canvasHeight.value / 2;
      const worldX = (e.x - cx) / scale.value + cx - viewportX.value;
      const worldY = (e.y - cy) / scale.value + cy - viewportY.value;

      // Get current panel states for hit testing
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

      const hitId = hitTestPanels(worldX, worldY, states);
      scheduleOnRN(onSelectPanel, hitId);
      if (hitId) {
        scheduleOnRN(onBringToFront, hitId);
      }
    });

  // Combine gestures - pan takes priority
  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  return (
    <GestureDetector gesture={composedGesture}>
      <Canvas style={styles.canvas}>
        <Group transform={canvasTransform}>
          {panels.map((panel) => (
            <SolarPanel
              key={panel.id}
              x={panel.x}
              y={panel.y}
              rotation={panel.rotation}
              isSelected={selectedId === panel.id}
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
