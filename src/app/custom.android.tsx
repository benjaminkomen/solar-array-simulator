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
  Column,
  Host,
  Icon,
  ListItem,
  ModalBottomSheet,
  OutlinedIconButton,
  Row,
  Text as UIText,
} from "@expo/ui/jetpack-compose";
import { clickable, fillMaxWidth, paddingAll } from "@expo/ui/jetpack-compose/modifiers";
import Add from "@expo/material-symbols/add.xml";
import Delete from "@expo/material-symbols/delete.xml";
import MyLocation from "@expo/material-symbols/my_location.xml";
import Link from "@expo/material-symbols/link.xml";
import Navigation from "@expo/material-symbols/navigation.xml";
import RotateRight from "@expo/material-symbols/rotate_right.xml";

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
                  <OutlinedIconButton
                    onClick={handleCompassToggle}
                    colors={{ contentColor: colors.primary, containerColor: colors.primaryLight }}
                  >
                    <Icon source={Navigation} tint={colors.primary} />
                  </OutlinedIconButton>
                  <OutlinedIconButton
                    onClick={handleSnapToOrigin}
                    colors={{ contentColor: colors.primary, containerColor: colors.primaryLight }}
                  >
                    <Icon source={MyLocation} tint={colors.primary} />
                  </OutlinedIconButton>
                </Row>
              </Host>
              <View style={styles.linkIconContainer}>
                <Host matchContents>
                  <OutlinedIconButton
                    onClick={() => {}}
                    colors={{ contentColor: colors.primary, containerColor: colors.primaryLight }}
                  >
                    <Icon source={Link} tint={colors.primary} />
                  </OutlinedIconButton>
                </Host>
                {/* @todo: this should be an Expo UI Badge once that is implemented */}
                {unlinkedCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.system.red as string }]}>
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

      </View>

      <Stack.Toolbar placement="bottom">
        {isWizardMode && (
          <Stack.Toolbar.Button onPress={handleFinish}>Finish</Stack.Toolbar.Button>
        )}
        <Stack.Toolbar.Button icon={Add} onPress={handleAddPanel} accessibilityLabel="Add panel" />
      </Stack.Toolbar>

      {panelSheetVisible && (
        <Host matchContents>
          <ModalBottomSheet onDismissRequest={() => setPanelSheetVisible(false)}>
            <Column modifiers={[fillMaxWidth(), paddingAll(8)]}>
              <ListItem
                modifiers={[clickable(() => { setPanelSheetVisible(false); handleLinkInverter(); })]}
              >
                <ListItem.HeadlineContent>
                  <UIText>Link Inverter</UIText>
                </ListItem.HeadlineContent>
                <ListItem.LeadingContent>
                  <Icon source={Link} tint={colors.primary} />
                </ListItem.LeadingContent>
              </ListItem>
              <ListItem
                modifiers={[clickable(() => { setPanelSheetVisible(false); handleRotatePanel(); })]}
              >
                <ListItem.HeadlineContent>
                  <UIText>Rotate</UIText>
                </ListItem.HeadlineContent>
                <ListItem.LeadingContent>
                  <Icon source={RotateRight} tint={colors.primary} />
                </ListItem.LeadingContent>
              </ListItem>
              <ListItem
                modifiers={[clickable(() => { setPanelSheetVisible(false); handleDeletePanel(); })]}
              >
                <ListItem.HeadlineContent>
                  <UIText>Delete</UIText>
                </ListItem.HeadlineContent>
                <ListItem.LeadingContent>
                  <Icon source={Delete} tint={colors.system.red} />
                </ListItem.LeadingContent>
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
});
