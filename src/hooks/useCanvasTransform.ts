import { useDerivedValue, type SharedValue } from "react-native-reanimated";

/**
 * Derive the Skia transform array for viewport offset + scale centered on canvas.
 * Shared between SolarPanelCanvas and ProductionCanvas.
 */
export function useCanvasTransform(
  canvasWidth: SharedValue<number>,
  canvasHeight: SharedValue<number>,
  viewportX: SharedValue<number>,
  viewportY: SharedValue<number>,
  scale: SharedValue<number>,
) {
  return useDerivedValue(() => {
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
}
