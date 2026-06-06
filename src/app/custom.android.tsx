import { Pressable, View, StyleSheet, Text } from "react-native";
import { Stack } from "expo-router";
import { Badge, Host, Icon, Text as UIText } from "@expo/ui/jetpack-compose";
import { SolarPanelCanvas } from "@/components/SolarPanelCanvas";
import { ZoomControls } from "@/components/ZoomControls";
import { Compass } from "@/components/Compass";
import { WizardProgress } from "@/components/WizardProgress";
import { useColors } from "@/utils/theme";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";
import Add from "@expo/material-symbols/add.xml";
import Delete from "@expo/material-symbols/delete.xml";
import MyLocation from "@expo/material-symbols/my_location.xml";
import Link from "@expo/material-symbols/link.xml";
import Navigation from "@expo/material-symbols/navigation.xml";
import RotateRight from "@expo/material-symbols/rotate_right.xml";

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
        <Stack.Toolbar.View>
          <View style={styles.badgedButton}>
            <Host matchContents>
              <Icon source={Link} tint={colors.text.primary} />
            </Host>
            {unlinkedCount > 0 && (
              <Host matchContents style={styles.badge}>
                <Badge containerColor={colors.system.red as string}>
                  <UIText>{String(unlinkedCount)}</UIText>
                </Badge>
              </Host>
            )}
          </View>
        </Stack.Toolbar.View>
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
        <Stack.Toolbar.View>
          <View style={styles.bottomToolbar}>
            {isWizardMode && (
              <Pressable style={styles.toolbarTextButton} onPress={handleFinish}>
                <Text style={[styles.toolbarTextButtonLabel, {color: colors.primary as string}]}>Finish</Text>
              </Pressable>
            )}
            <Pressable style={styles.toolbarIconButton} onPress={handleAddPanel} accessibilityLabel="Add panel">
              <Host matchContents>
                <Icon source={Add} tint={colors.primary} />
              </Host>
            </Pressable>
            {selectedId && (
              <>
                <Pressable style={styles.toolbarIconButton} onPress={handleLinkInverter} accessibilityLabel="Link inverter">
                  <Host matchContents>
                    <Icon source={Link} tint={colors.primary} />
                  </Host>
                </Pressable>
                <Pressable style={styles.toolbarIconButton} onPress={handleRotatePanel} accessibilityLabel="Rotate panel">
                  <Host matchContents>
                    <Icon source={RotateRight} tint={colors.primary} />
                  </Host>
                </Pressable>
                <Pressable style={styles.toolbarIconButton} onPress={handleDeletePanel} accessibilityLabel="Delete panel">
                  <Host matchContents>
                    <Icon source={Delete} tint={colors.primary} />
                  </Host>
                </Pressable>
              </>
            )}
          </View>
        </Stack.Toolbar.View>
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
  badgedButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
  },
  bottomToolbar: {
    flexDirection: "row",
    alignItems: "center",
  },
  toolbarTextButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  toolbarIconButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  toolbarTextButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
