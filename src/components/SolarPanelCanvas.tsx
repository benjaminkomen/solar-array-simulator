import { useCallback } from "react";
import { StyleSheet } from "react-native";
import { Canvas, Group } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  runOnJS,
  useSharedValue,
  useDerivedValue,
  type SharedValue,
} from "react-native-reanimated";
import { SolarPanel } from "./SolarPanel";
import type { PanelData } from "@/hooks/usePanelsManager";
import type { PanelState } from "@/utils/panelUtils";
import { hitTestPanels, getPanelDimensions, getPanelRect } from "@/utils/panelUtils";
import { collidesWithAny } from "@/utils/collision";
import { snapToGrid } from "@/utils/gridSnap";

interface SolarPanelCanvasProps {
  panels: PanelData[];
  selectedId: string | null;
  onSelectPanel: (id: string | null) => void;
  onBringToFront: (id: string) => void;
  viewportX: SharedValue<number>;
  viewportY: SharedValue<number>;
}

export function SolarPanelCanvas({
  panels,
  selectedId,
  onSelectPanel,
  onBringToFront,
  viewportX,
  viewportY,
}: SolarPanelCanvasProps) {
  // Panel dragging state
  const draggedPanelId = useSharedValue<string | null>(null);
  const panelOffsetX = useSharedValue(0);
  const panelOffsetY = useSharedValue(0);

  // Viewport panning state
  const isPanningViewport = useSharedValue(false);
  const viewportStartX = useSharedValue(0);
  const viewportStartY = useSharedValue(0);

  // Transform for the entire canvas content (viewport offset)
  const canvasTransform = useDerivedValue(() => {
    return [{ translateX: viewportX.value }, { translateY: viewportY.value }];
  });

  const selectPanel = useCallback(
    (id: string | null) => {
      onSelectPanel(id);
    },
    [onSelectPanel]
  );

  const bringToFront = useCallback(
    (id: string) => {
      onBringToFront(id);
    },
    [onBringToFront]
  );

  // Main pan gesture - handles both panel dragging and viewport panning
  const panGesture = Gesture.Pan()
    .onStart((e) => {
      "worklet";
      // Convert screen coordinates to world coordinates
      const worldX = e.x - viewportX.value;
      const worldY = e.y - viewportY.value;

      // Get current panel states for hit testing (in world coordinates)
      const states: PanelState[] = [];
      for (const p of panels) {
        states.push({
          id: p.id,
          x: p.x.value,
          y: p.y.value,
          rotation: p.rotation.value,
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
        runOnJS(selectPanel)(hitId);
        runOnJS(bringToFront)(hitId);
      } else {
        // Panning the viewport
        draggedPanelId.value = null;
        isPanningViewport.value = true;
        viewportStartX.value = viewportX.value;
        viewportStartY.value = viewportY.value;
        runOnJS(selectPanel)(null);
      }
    })
    .onUpdate((e) => {
      "worklet";
      if (isPanningViewport.value) {
        // Pan the viewport
        viewportX.value = viewportStartX.value + e.translationX;
        viewportY.value = viewportStartY.value + e.translationY;
        return;
      }

      const panelId = draggedPanelId.value;
      if (!panelId) return;

      const panel = panels.find((p) => p.id === panelId);
      if (!panel) return;

      // Calculate new position in world coordinates
      const newX = panelOffsetX.value + e.translationX;
      const newY = panelOffsetY.value + e.translationY;

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

      // Snap to grid on release
      const snappedX = snapToGrid(panel.x.value);
      const snappedY = snapToGrid(panel.y.value);

      // Get panel dimensions based on rotation
      const dims = getPanelDimensions(panel.rotation.value);

      // Create test rectangle for snapped position
      const testRect = {
        x: snappedX,
        y: snappedY,
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
        });
        otherRects.push({ ...rect, id: p.id });
      }

      // Only apply snapped position if it doesn't cause collision
      if (!collidesWithAny(testRect, otherRects)) {
        panel.x.value = snappedX;
        panel.y.value = snappedY;
      }

      draggedPanelId.value = null;
    });

  // Tap gesture for selection without drag
  const tapGesture = Gesture.Tap()
    .onStart((e) => {
      "worklet";
      // Convert screen coordinates to world coordinates
      const worldX = e.x - viewportX.value;
      const worldY = e.y - viewportY.value;

      // Get current panel states for hit testing
      const states: PanelState[] = [];
      for (const p of panels) {
        states.push({
          id: p.id,
          x: p.x.value,
          y: p.y.value,
          rotation: p.rotation.value,
        });
      }

      const hitId = hitTestPanels(worldX, worldY, states);
      runOnJS(selectPanel)(hitId);
      if (hitId) {
        runOnJS(bringToFront)(hitId);
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
