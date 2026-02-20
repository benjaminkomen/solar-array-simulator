import { useCallback, useRef, useState } from "react";
import { View, StyleSheet, type LayoutChangeEvent } from "react-native";
import { Stack, useLocalSearchParams, Link, useRouter } from "expo-router";
import { useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
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
 * Map analysis results to a clean grid layout on the canvas.
 * Clusters AI-detected panels into rows/columns by their center points,
 * then lays them out in a neat grid with standard spacing.
 */
function mapAnalysisToCanvasPositions(
  panels: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: 0 | 90;
  }[],
  _imageWidth: number,
  _imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  if (panels.length === 0) return [];

  // Compute center points for each panel
  const withCenters = panels.map((p, i) => ({
    index: i,
    cx: p.x + p.width / 2,
    cy: p.y + p.height / 2,
    rotation: p.rotation,
  }));

  // Compute median panel height (portrait orientation) for row clustering threshold
  const portraitHeights = panels
    .map((p) => (p.rotation === 90 ? p.width : p.height))
    .sort((a, b) => a - b);
  const medianHeight = portraitHeights[Math.floor(portraitHeights.length / 2)];

  // Sort by Y (top to bottom), then cluster into rows
  withCenters.sort((a, b) => a.cy - b.cy);

  const rows: (typeof withCenters)[] = [];
  let currentRow: typeof withCenters = [withCenters[0]];

  for (let i = 1; i < withCenters.length; i++) {
    const gap = withCenters[i].cy - withCenters[i - 1].cy;
    if (gap > medianHeight * 0.5) {
      rows.push(currentRow);
      currentRow = [withCenters[i]];
    } else {
      currentRow.push(withCenters[i]);
    }
  }
  rows.push(currentRow);

  // Sort each row by X (left to right)
  for (const row of rows) {
    row.sort((a, b) => a.cx - b.cx);
  }

  // Determine dominant rotation to set grid cell size
  const landscapeCount = withCenters.filter((p) => p.rotation === 90).length;
  const dominantRotation: 0 | 90 = landscapeCount > withCenters.length / 2 ? 90 : 0;
  const cellW = dominantRotation === 90 ? PANEL_HEIGHT : PANEL_WIDTH;
  const cellH = dominantRotation === 90 ? PANEL_WIDTH : PANEL_HEIGHT;

  // Build grid layout with standard spacing
  const gap = MOCK_GAP;
  const colSpacing = cellW + gap;
  const rowSpacing = cellH + gap;

  // Calculate total grid dimensions for centering
  const maxCols = Math.max(...rows.map((r) => r.length));
  const gridWidth = (maxCols - 1) * colSpacing + cellW;
  const gridHeight = (rows.length - 1) * rowSpacing + cellH;
  const offsetX = Math.round((canvasWidth - gridWidth) / 2);
  const offsetY = Math.round((canvasHeight - gridHeight) / 2);

  // Map each panel to its grid position, preserving original index order
  const result: { index: number; x: number; y: number; rotation: 0 | 90 }[] = [];
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      result.push({
        index: row[colIdx].index,
        x: offsetX + colIdx * colSpacing,
        y: offsetY + rowIdx * rowSpacing,
        rotation: row[colIdx].rotation,
      });
    }
  }

  // Sort back to original panel order so labels/inverter matching stays aligned
  result.sort((a, b) => a.index - b.index);

  return result.map(({ x, y, rotation }) => ({ x, y, rotation }));
}

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

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal" />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="location.north.circle" onPress={handleCompassToggle} accessibilityLabel="Toggle compass" />
        <Stack.Toolbar.Button onPress={() => {}}>
          <Stack.Toolbar.Icon sf="link" />
          {unlinkedCount > 0 && (
            <Stack.Toolbar.Badge>{String(unlinkedCount)}</Stack.Toolbar.Badge>
          )}
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Button icon="scope" onPress={handleSnapToOrigin} accessibilityLabel="Snap to origin" />
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
        <Stack.Toolbar.Button icon="plus" onPress={handleAddPanel} accessibilityLabel="Add panel" />
        {selectedId && (
          <>
            <Link href={`/panel-details?panelId=${selectedId}`} asChild>
              <Stack.Toolbar.Button icon="link" accessibilityLabel="Link inverter" />
            </Link>
            <Stack.Toolbar.Button
              icon="rotate.right"
              onPress={handleRotatePanel}
              accessibilityLabel="Rotate panel"
            />
            <Stack.Toolbar.Button icon="trash" onPress={handleDeletePanel} accessibilityLabel="Delete panel" />
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
