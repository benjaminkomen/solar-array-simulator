import { View, StyleSheet } from "react-native";
import { Stack, Link } from "expo-router";
import { SolarPanelCanvas } from "@/components/SolarPanelCanvas";
import { ZoomControls } from "@/components/ZoomControls";
import { Compass } from "@/components/Compass";
import { WizardProgress } from "@/components/WizardProgress";
import { useColors } from "@/utils/theme";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";

export default function Custom() {
  const colors = useColors();
  const {
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
  } = useCanvasEditor();

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
