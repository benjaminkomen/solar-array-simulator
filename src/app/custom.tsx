import { useCallback, useRef, useState } from "react";
import { View, StyleSheet, type LayoutChangeEvent } from "react-native";
import { Stack, useLocalSearchParams, Link, useRouter } from "expo-router";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import * as Haptics from "expo-haptics";
import { useConfigStore } from "@/hooks/useConfigStore";
import { SolarPanelCanvas } from "@/components/SolarPanelCanvas";
import { ZoomControls } from "@/components/ZoomControls";
import { Compass } from "@/components/Compass";
import { usePanelsContext } from "@/contexts/PanelsContext";
import { PANEL_WIDTH, PANEL_HEIGHT } from "@/utils/panelUtils";
import { GRID_SIZE } from "@/utils/gridSnap";
import { consumeAnalysisResult } from "@/utils/analysisStore";
import { WizardProgress } from "@/components/WizardProgress";
import { useZoom } from "@/hooks/useZoom";
import { useColors } from "@/utils/theme";

// Fallback: 2 rows x 5 columns mock grid
const COLS = 5;
const MOCK_GAP = 6;
const COL_SPACING = PANEL_WIDTH + MOCK_GAP;
const ROW_SPACING = PANEL_HEIGHT + MOCK_GAP;
const GRID_TOTAL_WIDTH = (COLS - 1) * COL_SPACING + PANEL_WIDTH;
const GRID_TOTAL_HEIGHT = ROW_SPACING + PANEL_HEIGHT;

function buildMockPanelGrid(canvasWidth: number, canvasHeight: number) {
  const offsetX = Math.round((canvasWidth - GRID_TOTAL_WIDTH) / 2);
  const offsetY = Math.round((canvasHeight - GRID_TOTAL_HEIGHT) / 2);

  return Array.from({ length: 10 }, (_, i) => ({
    x: offsetX + (i % COLS) * COL_SPACING,
    y: offsetY + Math.floor(i / COLS) * ROW_SPACING,
    rotation: 0 as const,
  }));
}

/**
 * Map analysis results (pixel coords from an image) to canvas positions.
 * Scales panels so they use the standard PANEL_WIDTH/PANEL_HEIGHT,
 * preserving relative layout, centered in the canvas.
 */
function mapAnalysisToCanvasPositions(
  panels: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: 0 | 90;
  }[],
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  if (panels.length === 0) return [];

  const minX = Math.min(...panels.map((p) => p.x));
  const minY = Math.min(...panels.map((p) => p.y));
  const maxX = Math.max(
    ...panels.map((p) => p.x + (p.rotation === 90 ? p.height : p.width)),
  );
  const maxY = Math.max(
    ...panels.map((p) => p.y + (p.rotation === 90 ? p.width : p.height)),
  );

  const layoutWidth = maxX - minX;
  const layoutHeight = maxY - minY;

  const avgPanelWidth =
    panels.reduce(
      (sum, p) => sum + (p.rotation === 90 ? p.height : p.width),
      0,
    ) / panels.length;
  const scale = PANEL_WIDTH / avgPanelWidth;

  const scaledWidth = layoutWidth * scale;
  const scaledHeight = layoutHeight * scale;

  const offsetX = Math.round((canvasWidth - scaledWidth) / 2);
  const offsetY = Math.round((canvasHeight - scaledHeight) / 2);

  return panels.map((p) => {
    const rawX = offsetX + (p.x - minX) * scale;
    const rawY = offsetY + (p.y - minY) * scale;

    const x = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
    const y = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

    return {
      x,
      y,
      rotation: p.rotation,
    };
  });
}

export default function Custom() {
  const router = useRouter();
  const { initialPanels, wizard } = useLocalSearchParams<{ initialPanels?: string; wizard?: string }>();
  const isWizardMode = wizard === 'true';
  const canvasSize = useRef({ width: 0, height: 0 });
  const colors = useColors();
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

  const updateCanvasSize = (width: number, height: number) => {
    'worklet';
    canvasWidth.value = width;
    canvasHeight.value = height;
  };

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      canvasSize.current = { width, height };

      scheduleOnUI(updateCanvasSize, width, height);

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
    [initialPanels, initializePanels, config.inverters],
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
      viewportX.value = withTiming(width / 2 - panelCenterX, { duration: 300 });
      viewportY.value = withTiming(height / 2 - panelCenterY, { duration: 300 });
    } else {
      viewportX.value = withTiming(0, { duration: 300 });
      viewportY.value = withTiming(0, { duration: 300 });
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

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal" />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="location.north.circle" onPress={handleCompassToggle} />
        <Stack.Toolbar.Button onPress={() => {}}>
          <Stack.Toolbar.Icon sf="link" />
          {unlinkedCount > 0 && (
            <Stack.Toolbar.Badge>{String(unlinkedCount)}</Stack.Toolbar.Badge>
          )}
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Button icon="scope" onPress={handleSnapToOrigin} />
      </Stack.Toolbar>
      {isWizardMode && <WizardProgress currentStep={3} />}
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]} onLayout={handleLayout} testID="canvas-container">
        {compassVisible && (
          <View style={styles.compassContainer}>
            <Compass
              direction={config.compassDirection}
              onDirectionChange={updateCompassDirection}
              onTap={handleCompassTap}
            />
          </View>
        )}
        <SolarPanelCanvas
          panels={panels}
          selectedId={selectedId}
          onSelectPanel={setSelectedId}
          onBringToFront={bringToFront}
          onSavePanelPosition={savePanelPosition}
          viewportX={viewportX}
          viewportY={viewportY}
          scale={scale}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
        <ZoomControls
          currentIndex={zoomIndex}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
      </View>
      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.Button icon="plus" onPress={handleAddPanel} />
        {selectedId && (
          <>
            <Link href={`/panel-details?panelId=${selectedId}`} asChild>
              <Stack.Toolbar.Button icon="link" />
            </Link>
            <Stack.Toolbar.Button
              icon="rotate.right"
              onPress={handleRotatePanel}
            />
            <Stack.Toolbar.Button icon="trash" onPress={handleDeletePanel} />
          </>
        )}
        {isWizardMode && panels.length > 0 && (
          <Stack.Toolbar.Button onPress={handleFinish}>
            Finish
          </Stack.Toolbar.Button>
        )}
      </Stack.Toolbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  compassContainer: {
    position: "absolute",
    top: 16,
    right: 48,
    zIndex: 10,
  },
});
