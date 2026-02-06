import { useCallback, useRef } from "react";
import { View, StyleSheet, type LayoutChangeEvent } from "react-native";
import { Stack } from "expo-router";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { SolarPanelCanvas } from "@/components/SolarPanelCanvas";
import { usePanelsManager } from "@/hooks/usePanelsManager";
import { PANEL_WIDTH, PANEL_HEIGHT } from "@/utils/panelUtils";

export default function Custom() {
  const canvasSize = useRef({ width: 0, height: 0 });
  const viewportX = useSharedValue(0);
  const viewportY = useSharedValue(0);

  const {
    panels,
    selectedId,
    setSelectedId,
    addPanel,
    removePanel,
    rotatePanel,
    bringToFront,
    getPanelStates,
  } = usePanelsManager();

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    canvasSize.current = { width, height };
  }, []);

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
