import { useCallback, useRef, useState } from "react";
import { View, StyleSheet, type LayoutChangeEvent, Pressable, Text } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
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

  const withCenters = panels.map((p, i) => ({
    index: i,
    cx: p.x,
    cy: p.y,
    rotation: p.rotation,
  }));

  const portraitHeights = panels
    .map((p) => (p.rotation === 90 ? p.width : p.height))
    .sort((a, b) => a - b);
  const medianHeight = portraitHeights[Math.floor(portraitHeights.length / 2)];

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

  for (const row of rows) {
    row.sort((a, b) => a.cx - b.cx);
  }

  const landscapeCount = withCenters.filter((p) => p.rotation === 90).length;
  const dominantRotation: 0 | 90 = landscapeCount > withCenters.length / 2 ? 90 : 0;
  const cellW = dominantRotation === 90 ? PANEL_HEIGHT : PANEL_WIDTH;
  const cellH = dominantRotation === 90 ? PANEL_WIDTH : PANEL_HEIGHT;

  const gap = MOCK_GAP;
  const colSpacing = cellW + gap;
  const rowSpacing = cellH + gap;

  const maxCols = Math.max(...rows.map((r) => r.length));
  const gridWidth = (maxCols - 1) * colSpacing + cellW;
  const gridHeight = (rows.length - 1) * rowSpacing + cellH;
  const offsetX = Math.round((canvasWidth - gridWidth) / 2);
  const offsetY = Math.round((canvasHeight - gridHeight) / 2);

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

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable onPress={handleCompassToggle} style={styles.headerIconButton} accessibilityLabel="Toggle compass">
                <Image source="sf:location.north.circle" style={styles.headerIcon} tintColor={colors.text.primary} />
              </Pressable>
              <Pressable onPress={() => {}} style={styles.headerIconButton}>
                <Image source="sf:link" style={styles.headerIcon} tintColor={colors.text.primary} />
                {unlinkedCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.system.red }]}>
                    <Text style={styles.badgeText}>{unlinkedCount}</Text>
                  </View>
                )}
              </Pressable>
              <Pressable onPress={handleSnapToOrigin} style={styles.headerIconButton} accessibilityLabel="Snap to origin">
                <Image source="sf:scope" style={styles.headerIcon} tintColor={colors.text.primary} />
              </Pressable>
            </View>
          ),
        }}
      />
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

      {/* Bottom toolbar replacing Stack.Toolbar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background.primary, borderTopColor: colors.border.light }]}>
        <Pressable onPress={handleAddPanel} style={styles.toolbarButton} accessibilityLabel="Add panel">
          <Image source="sf:plus" style={styles.toolbarIcon} tintColor={colors.primary} />
        </Pressable>
        {selectedId && (
          <>
            <Pressable onPress={handleLinkInverter} style={styles.toolbarButton} accessibilityLabel="Link inverter">
              <Image source="sf:link" style={styles.toolbarIcon} tintColor={colors.primary} />
            </Pressable>
            <Pressable onPress={handleRotatePanel} style={styles.toolbarButton} accessibilityLabel="Rotate panel">
              <Image source="sf:rotate.right" style={styles.toolbarIcon} tintColor={colors.primary} />
            </Pressable>
            <Pressable onPress={handleDeletePanel} style={styles.toolbarButton} accessibilityLabel="Delete panel">
              <Image source="sf:trash" style={styles.toolbarIcon} tintColor={colors.system.red} />
            </Pressable>
          </>
        )}
        {isWizardMode && panels.length > 0 && (
          <Pressable onPress={handleFinish} style={[styles.finishButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.finishText, { color: colors.text.inverse }]}>Finish</Text>
          </Pressable>
        )}
      </View>
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerIconButton: {
    padding: 8,
    position: "relative",
  },
  headerIcon: {
    width: 22,
    height: 22,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
  },
  toolbarButton: {
    padding: 10,
    borderRadius: 10,
  },
  toolbarIcon: {
    width: 22,
    height: 22,
  },
  finishButton: {
    marginLeft: "auto",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  finishText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
