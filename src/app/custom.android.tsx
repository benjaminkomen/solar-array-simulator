import { View, StyleSheet, Text } from "react-native";
import { Stack } from "expo-router";
import { SolarPanelCanvas } from "@/components/SolarPanelCanvas";
import { ZoomControls } from "@/components/ZoomControls";
import { Compass } from "@/components/Compass";
import { WizardProgress } from "@/components/WizardProgress";
import { useColors } from "@/utils/theme";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import {
  Host, Button as JCButton, IconButton, Icon, Row,
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
              <Host matchContents>
                <Row>
                  <IconButton variant="default" onPress={handleCompassToggle}>
                    <Icon source={require('@/assets/symbols/navigation.xml')} tintColor={colors.text.primary} />
                  </IconButton>
                  <IconButton variant="default" onPress={handleSnapToOrigin}>
                    <Icon source={require('@/assets/symbols/gps_fixed.xml')} tintColor={colors.text.primary} />
                  </IconButton>
                </Row>
              </Host>
              <View style={styles.linkIconContainer}>
                <Host matchContents>
                  <IconButton variant="default" onPress={() => {}}>
                    <Icon source={require('@/assets/symbols/link.xml')} tintColor={colors.text.primary} />
                  </IconButton>
                </Host>
                {/* @todo: this should be an Expo UI Badge once that is implemented */}
                {unlinkedCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.system.red }]}>
                    <Text style={styles.badgeText}>{unlinkedCount}</Text>
                  </View>
                )}
              </View>
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

        <View style={styles.floatingToolbarContainer} pointerEvents="box-none">
          <Host matchContents>
            <HorizontalFloatingToolbar variant="vibrant">
              <JCButton leadingIcon="filled.Add" variant="borderless" onPress={handleAddPanel} />
              {selectedId && <JCButton leadingIcon="filled.Share" variant="borderless" onPress={handleLinkInverter} />}
              {selectedId && <JCButton leadingIcon="filled.Refresh" variant="borderless" onPress={handleRotatePanel} />}
              {selectedId && <JCButton leadingIcon="filled.Delete" variant="borderless" onPress={handleDeletePanel} />}
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
  },
  linkIconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
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
