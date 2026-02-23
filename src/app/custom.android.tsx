import { View, StyleSheet, Pressable, Text } from "react-native";
import { Stack } from "expo-router";
import { SolarPanelCanvas } from "@/components/SolarPanelCanvas";
import { ZoomControls } from "@/components/ZoomControls";
import { Compass } from "@/components/Compass";
import { WizardProgress } from "@/components/WizardProgress";
import { useColors } from "@/utils/theme";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import {
  Host, Button as JCButton, Chip,
  Text as UIText,
  HorizontalFloatingToolbar,
} from "@expo/ui/jetpack-compose";

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
    handleLinkInverter,
  } = useCanvasEditor();

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerTitleAlign: 'center',
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable onPress={handleCompassToggle} style={styles.headerButton} accessibilityLabel="Toggle compass">
                <Text style={[styles.headerButtonText, { color: colors.text.primary }]}>Compass</Text>
              </Pressable>
              <Pressable onPress={handleSnapToOrigin} style={styles.headerButton} accessibilityLabel="Center view">
                <Text style={[styles.headerButtonText, { color: colors.text.primary }]}>Center</Text>
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

        <View style={styles.floatingToolbarContainer}>
          <Host matchContents>
            <HorizontalFloatingToolbar variant="vibrant">
              <JCButton leadingIcon="filled.Add" variant="borderless" onPress={handleAddPanel} />
              {selectedId && (
                <>
                  <JCButton leadingIcon="filled.Edit" variant="borderless" onPress={handleLinkInverter} />
                  <JCButton leadingIcon="filled.Refresh" variant="borderless" onPress={handleRotatePanel} />
                  <JCButton leadingIcon="filled.Delete" variant="borderless" onPress={handleDeletePanel} />
                </>
              )}
              {unlinkedCount > 0 && (
                <Chip variant="assist" label={`${unlinkedCount} unpaired`} leadingIcon="filled.Warning" />
              )}
              {isWizardMode && panels.length > 0 && (
                <HorizontalFloatingToolbar.FloatingActionButton onPress={handleFinish}>
                  <UIText style={{ typography: 'labelLarge', fontWeight: '600' }}>Finish</UIText>
                </HorizontalFloatingToolbar.FloatingActionButton>
              )}
            </HorizontalFloatingToolbar>
          </Host>
        </View>
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
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  floatingToolbarContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
});
