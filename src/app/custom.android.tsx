import { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Stack } from "expo-router";
import { SolarPanelCanvas } from "@/components/SolarPanelCanvas";
import { ZoomControls } from "@/components/ZoomControls";
import { Compass } from "@/components/Compass";
import { WizardProgress } from "@/components/WizardProgress";
import { useColors } from "@/utils/theme";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import {
  Host, IconButton, Icon, Row,
  Text as UIText,
  HorizontalFloatingToolbar, TextButton,
  ModalBottomSheet,
  ListItem,
  Column,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth, paddingAll, clickable } from "@expo/ui/jetpack-compose/modifiers";

export default function Custom() {
  const colors = useColors();
  const [panelSheetVisible, setPanelSheetVisible] = useState(false);
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

  const handleSelectPanel = (id: string | null) => {
    setSelectedId(id);
    if (id !== null) {
      setPanelSheetVisible(true);
    }
  };

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
                  <IconButton variant="bordered" color={colors.primaryLight} onPress={handleCompassToggle}>
                    <Icon source={require('@/assets/symbols/navigation.xml')} tintColor={colors.primary} />
                  </IconButton>
                  <IconButton variant="bordered" color={colors.primaryLight} onPress={handleSnapToOrigin}>
                    <Icon source={require('@/assets/symbols/gps_fixed.xml')} tintColor={colors.primary} />
                  </IconButton>
                </Row>
              </Host>
              <View style={styles.linkIconContainer}>
                <Host matchContents>
                  <IconButton variant="bordered" color={colors.primaryLight} onPress={() => {}}>
                    <Icon source={require('@/assets/symbols/link.xml')} tintColor={colors.primary} />
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
            onSelectPanel={handleSelectPanel}
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

        <View style={styles.floatingToolbarContainer} pointerEvents="box-none">
          <Host matchContents>
            <HorizontalFloatingToolbar variant="standard">
              {isWizardMode && panels.length > 0 && (
                <TextButton onPress={handleFinish}>Finish</TextButton>
              )}
              <HorizontalFloatingToolbar.FloatingActionButton onPress={handleAddPanel}>
                <Icon source={require('@/assets/symbols/add.xml')} tintColor={colors.text.inverse} />
              </HorizontalFloatingToolbar.FloatingActionButton>
            </HorizontalFloatingToolbar>
          </Host>
        </View>
      </View>

      {panelSheetVisible && (
        <Host matchContents>
          <ModalBottomSheet onDismissRequest={() => setPanelSheetVisible(false)}>
            <Column modifiers={[fillMaxWidth(), paddingAll(8)]}>
              <ListItem
                headline="Link Inverter"
                modifiers={[clickable(() => { setPanelSheetVisible(false); handleLinkInverter(); })]}
              >
                <ListItem.Leading>
                  <Icon source={require('@/assets/symbols/link.xml')} tintColor={colors.primary} />
                </ListItem.Leading>
              </ListItem>
              <ListItem
                headline="Rotate"
                modifiers={[clickable(() => { setPanelSheetVisible(false); handleRotatePanel(); })]}
              >
                <ListItem.Leading>
                  <Icon source={require('@/assets/symbols/rotate.xml')} tintColor={colors.primary} />
                </ListItem.Leading>
              </ListItem>
              <ListItem
                headline="Delete"
                modifiers={[clickable(() => { setPanelSheetVisible(false); handleDeletePanel(); })]}
              >
                <ListItem.Leading>
                  <Icon source={require('@/assets/symbols/delete.xml')} tintColor={colors.system.red} />
                </ListItem.Leading>
              </ListItem>
            </Column>
          </ModalBottomSheet>
        </Host>
      )}
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
