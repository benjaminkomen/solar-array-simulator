/**
 * Shared viewport management hook used by production and custom canvas screens.
 * Manages canvas dimensions and viewport centering on panel bounding boxes.
 */
import { useCallback, useRef } from "react";
import { type LayoutChangeEvent } from "react-native";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import { PANEL_WIDTH, PANEL_HEIGHT } from "@/utils/panelUtils";
import type { usePanelsContext } from "@/contexts/PanelsContext";

// Module-level worklet: required by React Compiler (no shared value mutation inside hooks)
function applyCanvasSize(
  canvasWidth: SharedValue<number>,
  canvasHeight: SharedValue<number>,
  width: number,
  height: number,
) {
  'worklet';
  canvasWidth.value = width;
  canvasHeight.value = height;
}

function applyViewportPosition(
  viewportX: SharedValue<number>,
  viewportY: SharedValue<number>,
  x: number,
  y: number,
) {
  viewportX.value = x;
  viewportY.value = y;
}

export function useViewport(panels: ReturnType<typeof usePanelsContext>["panels"]) {
  const viewportX = useSharedValue(0);
  const viewportY = useSharedValue(0);
  const canvasWidth = useSharedValue(0);
  const canvasHeight = useSharedValue(0);
  const hasInitializedViewport = useRef(false);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;

      scheduleOnUI(applyCanvasSize, canvasWidth, canvasHeight, width, height);

      // Center viewport on panels bounding box (once, on first layout)
      if (!hasInitializedViewport.current && panels.length > 0 && width > 0 && height > 0) {
        hasInitializedViewport.current = true;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const panel of panels) {
          const panelWidth = panel.rotation.value === 90 ? PANEL_HEIGHT : PANEL_WIDTH;
          const panelHeight = panel.rotation.value === 90 ? PANEL_WIDTH : PANEL_HEIGHT;
          minX = Math.min(minX, panel.x.value);
          minY = Math.min(minY, panel.y.value);
          maxX = Math.max(maxX, panel.x.value + panelWidth);
          maxY = Math.max(maxY, panel.y.value + panelHeight);
        }

        const boundingCenterX = (minX + maxX) / 2;
        const boundingCenterY = (minY + maxY) / 2;
        applyViewportPosition(viewportX, viewportY, width / 2 - boundingCenterX, height / 2 - boundingCenterY);
      }
    },
    [canvasWidth, canvasHeight, viewportX, viewportY, panels]
  );

  return { viewportX, viewportY, canvasWidth, canvasHeight, handleLayout };
}
