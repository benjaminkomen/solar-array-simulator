import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { SolarPanelCanvas } from "@/components/SolarPanelCanvas";
import { ZoomControls } from "@/components/ZoomControls";
import { Compass } from "@/components/Compass";
import { WizardProgress } from "@/components/WizardProgress";
import { useColors } from "@/utils/theme";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import {
  Host, Button as JCButton, IconButton, Icon, Row,
  Text as UIText, TextButton,
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
            <Host matchContents>
              <Row>
                <IconButton variant="default" onPress={handleCompassToggle}>
                  <Icon source={require('@/assets/symbols/navigation.xml')} tintColor={colors.text.primary} />
                </IconButton>
                <IconButton variant="default" onPress={handleSnapToOrigin}>
                  <Icon source={require('@/assets/symbols/gps_fixed.xml')} tintColor={colors.text.primary} />
                </IconButton>
                <IconButton variant="default" onPress={handleLinkInverter}>
                  <Icon source={require('@/assets/symbols/link.xml')} tintColor={colors.text.primary} />
                </IconButton>
              </Row>
            </Host>
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

        {selectedId ? (
          <View style={styles.floatingToolbarContainer}>
            <Host matchContents>
              <HorizontalFloatingToolbar variant="vibrant">
                <JCButton leadingIcon="filled.Add" variant="borderless" onPress={handleAddPanel} />
                <JCButton leadingIcon="filled.Share" variant="borderless" onPress={handleLinkInverter} />
                <JCButton leadingIcon="filled.Refresh" variant="borderless" onPress={handleRotatePanel} />
                <JCButton leadingIcon="filled.Delete" variant="borderless" onPress={handleDeletePanel} />
              </HorizontalFloatingToolbar>
            </Host>
          </View>
        ) : (
          <View style={styles.floatingToolbarContainer}>
            <Host matchContents>
              <HorizontalFloatingToolbar variant="vibrant">
                {isWizardMode && panels.length > 0 && <TextButton onPress={handleFinish}>Finish</TextButton>}
                <HorizontalFloatingToolbar.FloatingActionButton onPress={handleAddPanel}>
                  <UIText style={{ typography: 'headlineMedium', fontWeight: '300' }}>+</UIText>
                </HorizontalFloatingToolbar.FloatingActionButton>
              </HorizontalFloatingToolbar>
            </Host>
          </View>
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
  floatingToolbarContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
});
