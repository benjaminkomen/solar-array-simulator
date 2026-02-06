import { useCallback, useRef } from "react";
import { View, StyleSheet, type LayoutChangeEvent } from "react-native";
import { Stack } from "expo-router";
import { SolarPanelCanvas } from "@/components/SolarPanelCanvas";
import { usePanelsManager } from "@/hooks/usePanelsManager";

export default function Custom() {
  const canvasSize = useRef({ width: 0, height: 0 });
  const {
    panels,
    selectedId,
    setSelectedId,
    addPanel,
    removePanel,
    rotatePanel,
    bringToFront,
  } = usePanelsManager();

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    canvasSize.current = { width, height };
  }, []);

  const handleAddPanel = useCallback(() => {
    const { width, height } = canvasSize.current;
    if (width > 0 && height > 0) {
      addPanel(width, height);
    }
  }, [addPanel]);

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

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal" />
      <View style={styles.container} onLayout={handleLayout}>
        <SolarPanelCanvas
          panels={panels}
          selectedId={selectedId}
          onSelectPanel={setSelectedId}
          onBringToFront={bringToFront}
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
