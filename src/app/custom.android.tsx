import { Pressable, View, StyleSheet, Text } from "react-native";
import { Stack } from "expo-router";
import { SolarPanelCanvas } from "@/components/SolarPanelCanvas";
import { ZoomControls } from "@/components/ZoomControls";
import { Compass } from "@/components/Compass";
import { WizardProgress } from "@/components/WizardProgress";
import { useColors } from "@/utils/theme";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";
import { shouldShowWizardFinish } from "@/utils/wizardChrome";
import Add from "@expo/material-symbols/add.xml";
import Delete from "@expo/material-symbols/delete.xml";
import MyLocation from "@expo/material-symbols/my_location.xml";
import Link from "@expo/material-symbols/link.xml";
import Navigation from "@expo/material-symbols/navigation.xml";
import RotateRight from "@expo/material-symbols/rotate_right.xml";

function ignoreUnlinkedBadgePress() {}

export default function Custom() {
  useMarkInteractive();
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
        }}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon={Navigation} onPress={handleCompassToggle} accessibilityLabel="Toggle compass" />
        <Stack.Toolbar.Button icon={MyLocation} onPress={handleSnapToOrigin} accessibilityLabel="Snap to origin" />
        <Stack.Toolbar.Button icon={Link} onPress={ignoreUnlinkedBadgePress} accessibilityLabel="Unlinked panels">
          {unlinkedCount > 0 && (
            <Stack.Toolbar.Badge>{String(unlinkedCount)}</Stack.Toolbar.Badge>
          )}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      {isWizardMode && <WizardProgress currentStep={3} />}
      <View style={styles.outerContainer}>
        <View style={[styles.canvasContainer, { backgroundColor: colors.background.secondary }]} onLayout={handleLayout} testID="canvas-container">
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
      </View>

      <Stack.Toolbar placement="bottom">
        {/* Text-only Android toolbar items must stay Pressable+Text. IconButton requires a source. */}
        <Stack.Toolbar.View hidden={!shouldShowWizardFinish(isWizardMode, panels.length)}>
          <Pressable style={styles.toolbarTextButton} onPress={handleFinish}>
            <Text style={[styles.toolbarTextButtonLabel, {color: colors.primary as string}]}>Finish</Text>
          </Pressable>
        </Stack.Toolbar.View>
        {/* Native IconButton — do not wrap icons in Host inside Toolbar.View; that Host eats taps (#54). */}
        <Stack.Toolbar.Button icon={Add} onPress={handleAddPanel} accessibilityLabel="Add panel" />
        <Stack.Toolbar.Button hidden={!selectedId} icon={Link} onPress={handleLinkInverter} accessibilityLabel="Link inverter" />
        <Stack.Toolbar.Button hidden={!selectedId} icon={RotateRight} onPress={handleRotatePanel} accessibilityLabel="Rotate panel" />
        <Stack.Toolbar.Button hidden={!selectedId} icon={Delete} onPress={handleDeletePanel} accessibilityLabel="Delete panel" />
      </Stack.Toolbar>
    </>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  canvasContainer: {
    flex: 1,
  },
  compassContainer: {
    position: "absolute",
    top: 16,
    right: 48,
    zIndex: 10,
  },
  toolbarTextButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  toolbarTextButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
