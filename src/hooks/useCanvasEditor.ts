/**
 * Business logic for the Custom (canvas editor) screen.
 * Manages panel CRUD, viewport animation, compass, and analysis initialization.
 */
import { useCallback, useRef, useState } from "react";
import { type LayoutChangeEvent } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import * as Haptics from "expo-haptics";
import { useConfigStore } from "@/hooks/useConfigStore";
import { usePanelsContext } from "@/contexts/PanelsContext";
import { useZoom } from "@/hooks/useZoom";
import { PANEL_WIDTH, PANEL_HEIGHT } from "@/utils/panelUtils";
import { consumeAnalysisResult } from "@/utils/analysisStore";
import { buildMockPanelGrid, mapAnalysisToCanvasPositions } from "@/utils/canvasLayout";

// Module-level worklet functions: required by React Compiler
function setCanvasSize(w: SharedValue<number>, h: SharedValue<number>, width: number, height: number) {
  'worklet';
  w.value = width;
  h.value = height;
}

function animateViewport(
  vx: SharedValue<number>,
  vy: SharedValue<number>,
  targetX: number,
  targetY: number,
) {
  vx.value = withTiming(targetX, { duration: 300 });
  vy.value = withTiming(targetY, { duration: 300 });
}

export function useCanvasEditor() {
  const router = useRouter();
  const { initialPanels, wizard } = useLocalSearchParams<{ initialPanels?: string; wizard?: string }>();
  const isWizardMode = wizard === 'true';
  const canvasSize = useRef({ width: 0, height: 0 });
  const viewportX = useSharedValue(0);
  const viewportY = useSharedValue(0);
  const canvasWidth = useSharedValue(0);
  const canvasHeight = useSharedValue(0);
  const hasInitialized = useRef(false);
  const [compassVisible, setCompassVisible] = useState(false);
  const { config, setWizardCompleted, updateCompassDirection } = useConfigStore();
  const { zoomIndex, scale, handleZoomIn, handleZoomOut } = useZoom();

  const {
    panels,
    selectedId,
    setSelectedId,
    addPanel,
    removePanel,
    rotatePanel,
    bringToFront,
    getPanelStates,
    initializePanels,
    getLinkedCount,
    savePanelPosition,
  } = usePanelsContext();

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      canvasSize.current = { width, height };

      scheduleOnUI(setCanvasSize, canvasWidth, canvasHeight, width, height);

      // Initialize panels centered in the canvas after layout is known
      if (initialPanels && !hasInitialized.current && width > 0 && height > 0) {
        hasInitialized.current = true;

        const analysis = consumeAnalysisResult();
        if (analysis && analysis.panels.length > 0) {
          const positions = mapAnalysisToCanvasPositions(
            analysis.panels,
            analysis.imageWidth,
            analysis.imageHeight,
            width,
            height,
          );

          const positionsWithInverters = positions.map((pos, idx) => {
            const label = analysis.panels[idx]?.label || '';
            const matchingInverter = config.inverters.find(
              inv => inv.serialNumber === label.trim()
            );
            return {
              ...pos,
              inverterId: matchingInverter?.id || null,
            };
          });

          initializePanels(positionsWithInverters);
        } else {
          initializePanels(buildMockPanelGrid(width, height));
        }
      }
    },
    [initialPanels, initializePanels, config.inverters, canvasWidth, canvasHeight],
  );

  const handleAddPanel = useCallback(() => {
    const { width, height } = canvasSize.current;
    if (width > 0 && height > 0) {
      addPanel(width, height, -viewportX.value, -viewportY.value);
    }
  }, [addPanel, viewportX, viewportY]);

  const handleRotatePanel = useCallback(() => {
    if (selectedId) {
      rotatePanel(selectedId);
    }
  }, [selectedId, rotatePanel]);

  const handleDeletePanel = useCallback(() => {
    if (selectedId) {
      removePanel(selectedId);
    }
  }, [selectedId, removePanel]);

  const handleSnapToOrigin = useCallback(() => {
    const states = getPanelStates();
    const { width, height } = canvasSize.current;

    if (states.length > 0) {
      const firstPanel = states[0];
      const panelCenterX = firstPanel.x + PANEL_WIDTH / 2;
      const panelCenterY = firstPanel.y + PANEL_HEIGHT / 2;
      animateViewport(viewportX, viewportY, width / 2 - panelCenterX, height / 2 - panelCenterY);
    } else {
      animateViewport(viewportX, viewportY, 0, 0);
    }
  }, [getPanelStates, viewportX, viewportY]);

  const unlinkedCount = panels.length - getLinkedCount();

  const handleFinish = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setWizardCompleted(true);
    router.push('/production');
  }, [setWizardCompleted, router]);

  const handleCompassTap = useCallback(() => {
    router.push('/compass-help');
  }, [router]);

  const handleCompassToggle = useCallback(() => {
    if (compassVisible) {
      setCompassVisible(false);
    } else {
      setCompassVisible(true);
      router.push('/compass-help');
    }
  }, [compassVisible, router]);

  const handleLinkInverter = useCallback(() => {
    if (selectedId) {
      router.push(`/panel-details?panelId=${selectedId}`);
    }
  }, [selectedId, router]);

  return {
    isWizardMode,
    config,
    panels,
    selectedId,
    setSelectedId,
    bringToFront,
    savePanelPosition,
    viewportX,
    viewportY,
    scale,
    canvasWidth,
    canvasHeight,
    zoomIndex,
    handleZoomIn,
    handleZoomOut,
    compassVisible,
    updateCompassDirection,
    unlinkedCount,
    handleLayout,
    handleAddPanel,
    handleRotatePanel,
    handleDeletePanel,
    handleSnapToOrigin,
    handleFinish,
    handleCompassTap,
    handleCompassToggle,
    handleLinkInverter,
  };
}
