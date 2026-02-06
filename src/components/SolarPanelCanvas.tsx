import { useCallback } from "react";
import { StyleSheet } from "react-native";
import { Canvas } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";
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
}

export function SolarPanelCanvas({
  panels,
  selectedId,
  onSelectPanel,
  onBringToFront,
}: SolarPanelCanvasProps) {
  const draggedPanelId = useSharedValue<string | null>(null);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const lastValidX = useSharedValue(0);
  const lastValidY = useSharedValue(0);

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

  // Create gesture handlers
  const gesture = Gesture.Pan()
    .onStart((e) => {
      "worklet";
      const touchX = e.x;
      const touchY = e.y;

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

      // Hit test to find which panel was touched (reverse order for z-order)
      const hitId = hitTestPanels(touchX, touchY, states);

      if (hitId) {
        draggedPanelId.value = hitId;
        const panel = panels.find((p) => p.id === hitId);
        if (panel) {
          offsetX.value = panel.x.value;
          offsetY.value = panel.y.value;
          lastValidX.value = panel.x.value;
          lastValidY.value = panel.y.value;
        }
        runOnJS(selectPanel)(hitId);
        runOnJS(bringToFront)(hitId);
      } else {
        draggedPanelId.value = null;
        runOnJS(selectPanel)(null);
      }
    })
    .onUpdate((e) => {
      "worklet";
      const panelId = draggedPanelId.value;
      if (!panelId) return;

      const panel = panels.find((p) => p.id === panelId);
      if (!panel) return;

      // Calculate new position
      const newX = offsetX.value + e.translationX;
      const newY = offsetY.value + e.translationY;

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
        lastValidX.value = newX;
        lastValidY.value = newY;
      }
      // If collision, keep last valid position (panel stays in place)
    })
    .onEnd(() => {
      "worklet";
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
      const touchX = e.x;
      const touchY = e.y;

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

      const hitId = hitTestPanels(touchX, touchY, states);
      runOnJS(selectPanel)(hitId);
      if (hitId) {
        runOnJS(bringToFront)(hitId);
      }
    });

  // Combine gestures - pan takes priority
  const composedGesture = Gesture.Exclusive(gesture, tapGesture);

  return (
    <GestureDetector gesture={composedGesture}>
      <Canvas style={styles.canvas}>
        {panels.map((panel) => (
          <SolarPanel
            key={panel.id}
            x={panel.x}
            y={panel.y}
            rotation={panel.rotation}
            isSelected={selectedId === panel.id}
          />
        ))}
      </Canvas>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
});
