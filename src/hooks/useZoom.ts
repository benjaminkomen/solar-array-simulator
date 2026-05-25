import { useCallback, useState } from "react";
import { useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import { ZOOM_LEVELS, DEFAULT_ZOOM_INDEX } from "@/utils/zoomConstants";

interface UseZoomResult {
  zoomIndex: number;
  scale: SharedValue<number>;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
}

function animateScaleTo(scale: SharedValue<number>, target: number) {
  scale.value = withTiming(target, { duration: 200 });
}

export function useZoom(): UseZoomResult {
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const scale = useSharedValue(ZOOM_LEVELS[DEFAULT_ZOOM_INDEX]);

  const handleZoomIn = useCallback(() => {
    if (zoomIndex > 0) {
      const newIndex = zoomIndex - 1;
      setZoomIndex(newIndex);
      animateScaleTo(scale, ZOOM_LEVELS[newIndex]);
    }
  }, [zoomIndex, scale]);

  const handleZoomOut = useCallback(() => {
    if (zoomIndex < ZOOM_LEVELS.length - 1) {
      const newIndex = zoomIndex + 1;
      setZoomIndex(newIndex);
      animateScaleTo(scale, ZOOM_LEVELS[newIndex]);
    }
  }, [zoomIndex, scale]);

  return { zoomIndex, scale, handleZoomIn, handleZoomOut };
}
