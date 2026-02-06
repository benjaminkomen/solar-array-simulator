import { useCallback, useRef } from "react";
import { View, StyleSheet, type LayoutChangeEvent } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { SolarPanelCanvas } from "@/components/SolarPanelCanvas";
import { usePanelsManager } from "@/hooks/usePanelsManager";
import { PANEL_WIDTH, PANEL_HEIGHT } from "@/utils/panelUtils";

// 2 rows x 5 columns grid, all portrait orientation
const COLS = 5;
const PANEL_GAP = 6;
const COL_SPACING = PANEL_WIDTH + PANEL_GAP; // 66
const ROW_SPACING = PANEL_HEIGHT + PANEL_GAP; // 126
const GRID_TOTAL_WIDTH = (COLS - 1) * COL_SPACING + PANEL_WIDTH;
const GRID_TOTAL_HEIGHT = ROW_SPACING + PANEL_HEIGHT; // 2 rows

function buildMockPanelGrid(canvasWidth: number, canvasHeight: number) {
  // Center the grid in the canvas
  const offsetX = Math.round((canvasWidth - GRID_TOTAL_WIDTH) / 2);
  const offsetY = Math.round((canvasHeight - GRID_TOTAL_HEIGHT) / 2);

  return Array.from({ length: 10 }, (_, i) => ({
    x: offsetX + (i % COLS) * COL_SPACING,
    y: offsetY + Math.floor(i / COLS) * ROW_SPACING,
    rotation: 0 as const,
  }));
}

export default function Custom() {
  const { initialPanels } = useLocalSearchParams<{ initialPanels?: string }>();
  const canvasSize = useRef({ width: 0, height: 0 });
  const viewportX = useSharedValue(0);
  const viewportY = useSharedValue(0);
  const hasInitialized = useRef(false);

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
  } = usePanelsManager();

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    canvasSize.current = { width, height };

    // Initialize panels centered in the canvas after layout is known
    if (initialPanels && !hasInitialized.current && width > 0 && height > 0) {
      hasInitialized.current = true;
      initializePanels(buildMockPanelGrid(width, height));
    }
  }, [initialPanels, initializePanels]);

  const handleAddPanel = useCallback(() => {
    const { width, height } = canvasSize.current;
    if (width > 0 && height > 0) {
      // Pass viewport offset so new panels are added relative to current view
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
      // Center viewport on first panel
      const firstPanel = states[0];
      const panelCenterX = firstPanel.x + PANEL_WIDTH / 2;
      const panelCenterY = firstPanel.y + PANEL_HEIGHT / 2;
      viewportX.value = withTiming(width / 2 - panelCenterX, { duration: 300 });
      viewportY.value = withTiming(height / 2 - panelCenterY, { duration: 300 });
    } else {
      // Reset to origin
      viewportX.value = withTiming(0, { duration: 300 });
      viewportY.value = withTiming(0, { duration: 300 });
    }
  }, [getPanelStates, viewportX, viewportY]);

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal" />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="location"
          onPress={handleSnapToOrigin}
        />
      </Stack.Toolbar>
      <View style={styles.container} onLayout={handleLayout}>
        <SolarPanelCanvas
          panels={panels}
          selectedId={selectedId}
          onSelectPanel={setSelectedId}
          onBringToFront={bringToFront}
          viewportX={viewportX}
          viewportY={viewportY}
        />
      </View>
      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.Button
          icon="plus"
          onPress={handleAddPanel}
        />
        {selectedId && (
          <>
            <Stack.Toolbar.Button
              icon="rotate.right"
              onPress={handleRotatePanel}
            />
            <Stack.Toolbar.Button
              icon="trash"
              onPress={handleDeletePanel}
            />
          </>
        )}
      </Stack.Toolbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb", // gray-50
  },
});
