import { View, StyleSheet } from "react-native";
import { Redirect, Stack } from "expo-router";
import { AndroidWizardFinishButton, CustomBottomToolbar, CustomHeaderToolbar } from "@/components/CustomChrome";
import { SolarPanelCanvas } from "@/components/SolarPanelCanvas";
import { ZoomControls } from "@/components/ZoomControls";
import { Compass } from "@/components/Compass";
import { WizardProgress } from "@/components/WizardProgress";
import { useColors } from "@/utils/theme";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";
import { shouldRedirectCustomToProduction, shouldShowWizardFinish } from "@/utils/wizardChrome";

export default function Custom() {
  useMarkInteractive();
  const colors = useColors();
  const {
    finishHref,
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

  if (shouldRedirectCustomToProduction(finishHref)) {
    return <Redirect href={finishHref} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerTitleAlign: "center",
        }}
      />
      <CustomHeaderToolbar
        unlinkedCount={unlinkedCount}
        onCompassToggle={handleCompassToggle}
        onSnapToOrigin={handleSnapToOrigin}
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
          <AndroidWizardFinishButton
            visible={shouldShowWizardFinish(isWizardMode, panels.length)}
            onFinish={handleFinish}
          />
        </View>
      </View>
      <CustomBottomToolbar
        selectedId={selectedId}
        isWizardMode={isWizardMode}
        panelCount={panels.length}
        onAddPanel={handleAddPanel}
        onLinkInverter={handleLinkInverter}
        onRotatePanel={handleRotatePanel}
        onDeletePanel={handleDeletePanel}
        onFinish={handleFinish}
      />
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
});
