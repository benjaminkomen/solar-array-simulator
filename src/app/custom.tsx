import { useCallback, useMemo, useRef, useState } from "react";
import { View, StyleSheet, type LayoutChangeEvent } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useSharedValue, withTiming } from "react-native-reanimated";
import {
  BottomSheet,
  Button,
  Form,
  Host,
  HStack,
  Image,
  Section,
  Spacer,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  bold,
  font,
  foregroundStyle,
  presentationDetents,
  presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
import { SolarPanelCanvas } from "@/components/SolarPanelCanvas";
import { usePanelsManager } from "@/hooks/usePanelsManager";
import { useConfigStore } from "@/hooks/useConfigStore";
import { PANEL_WIDTH, PANEL_HEIGHT } from "@/utils/panelUtils";
import { GRID_SIZE } from "@/utils/gridSnap";
import { consumeAnalysisResult } from "@/utils/analysisStore";

// Fallback: 2 rows x 5 columns mock grid
const COLS = 5;
const PANEL_GAP = 6;
const COL_SPACING = PANEL_WIDTH + PANEL_GAP;
const ROW_SPACING = PANEL_HEIGHT + PANEL_GAP;
const GRID_TOTAL_WIDTH = (COLS - 1) * COL_SPACING + PANEL_WIDTH;
const GRID_TOTAL_HEIGHT = ROW_SPACING + PANEL_HEIGHT;

function buildMockPanelGrid(canvasWidth: number, canvasHeight: number) {
  const offsetX = Math.round((canvasWidth - GRID_TOTAL_WIDTH) / 2);
  const offsetY = Math.round((canvasHeight - GRID_TOTAL_HEIGHT) / 2);

  return Array.from({ length: 10 }, (_, i) => ({
    x: offsetX + (i % COLS) * COL_SPACING,
    y: offsetY + Math.floor(i / COLS) * ROW_SPACING,
    rotation: 0 as const,
  }));
}

/**
 * Map analysis results (pixel coords from an image) to canvas positions.
 * Scales panels so they use the standard PANEL_WIDTH/PANEL_HEIGHT,
 * preserving relative layout, centered in the canvas.
 */
function mapAnalysisToCanvasPositions(
  panels: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: 0 | 90;
  }[],
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  if (panels.length === 0) return [];

  // Find the bounding box of all panels in image space
  const minX = Math.min(...panels.map((p) => p.x));
  const minY = Math.min(...panels.map((p) => p.y));
  const maxX = Math.max(
    ...panels.map((p) => p.x + (p.rotation === 90 ? p.height : p.width)),
  );
  const maxY = Math.max(
    ...panels.map((p) => p.y + (p.rotation === 90 ? p.width : p.height)),
  );

  const layoutWidth = maxX - minX;
  const layoutHeight = maxY - minY;

  // Scale factor: map image-space layout to canvas units
  // Use the average panel size in image space to determine scale
  const avgPanelWidth =
    panels.reduce(
      (sum, p) => sum + (p.rotation === 90 ? p.height : p.width),
      0,
    ) / panels.length;
  const scale = PANEL_WIDTH / avgPanelWidth;

  // Scale the total layout size
  const scaledWidth = layoutWidth * scale;
  const scaledHeight = layoutHeight * scale;

  // Center in canvas
  const offsetX = Math.round((canvasWidth - scaledWidth) / 2);
  const offsetY = Math.round((canvasHeight - scaledHeight) / 2);

  return panels.map((p) => {
    // Scale position relative to the layout bounding box
    const rawX = offsetX + (p.x - minX) * scale;
    const rawY = offsetY + (p.y - minY) * scale;

    // Snap to grid
    const x = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
    const y = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

    return {
      x,
      y,
      rotation: p.rotation,
    };
  });
}

export default function Custom() {
  const { initialPanels } = useLocalSearchParams<{ initialPanels?: string }>();
  const canvasSize = useRef({ width: 0, height: 0 });
  const viewportX = useSharedValue(0);
  const viewportY = useSharedValue(0);
  const hasInitialized = useRef(false);

  const {
    panels,
    selectedId,
    setSelectedId,
    addPanel,
    removePanel,
    rotatePanel,
    bringToFront,
    getPanelStates,
    initializePanels,
    assignInverter,
    unassignInverter,
  } = usePanelsManager();

  const { config } = useConfigStore();
  const [showAssignSheet, setShowAssignSheet] = useState(false);

  const selectedPanel = panels.find((p) => p.id === selectedId);
  const assignedInverter = selectedPanel?.inverterId
    ? config.inverters.find((inv) => inv.id === selectedPanel.inverterId)
    : null;

  const assignedInverterIds = useMemo(
    () => new Set(panels.filter((p) => p.inverterId).map((p) => p.inverterId!)),
    [panels],
  );
  const availableInverters = useMemo(
    () => config.inverters.filter((inv) => !assignedInverterIds.has(inv.id)),
    [config.inverters, assignedInverterIds],
  );

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      canvasSize.current = { width, height };

      // Initialize panels centered in the canvas after layout is known
      if (initialPanels && !hasInitialized.current && width > 0 && height > 0) {
        hasInitialized.current = true;

        // Try to use real analysis results, fall back to mock grid
        const analysis = consumeAnalysisResult();
        if (analysis && analysis.panels.length > 0) {
          const positions = mapAnalysisToCanvasPositions(
            analysis.panels,
            analysis.imageWidth,
            analysis.imageHeight,
            width,
            height,
          );
          initializePanels(positions);
        } else {
          initializePanels(buildMockPanelGrid(width, height));
        }
      }
    },
    [initialPanels, initializePanels],
  );

  const handleAddPanel = useCallback(() => {
    const { width, height } = canvasSize.current;
    if (width > 0 && height > 0) {
      addPanel(width, height, -viewportX.value, -viewportY.value);
    }
  }, [addPanel, viewportX, viewportY]);

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

  const handleOpenAssignSheet = useCallback(() => {
    if (selectedId) {
      setShowAssignSheet(true);
    }
  }, [selectedId]);

  const handleAssignInverter = useCallback(
    (inverterId: string) => {
      if (selectedId) {
        assignInverter(selectedId, inverterId);
        setShowAssignSheet(false);
      }
    },
    [selectedId, assignInverter],
  );

  const handleUnassignInverter = useCallback(() => {
    if (selectedId) {
      unassignInverter(selectedId);
      setShowAssignSheet(false);
    }
  }, [selectedId, unassignInverter]);

  const handleSnapToOrigin = useCallback(() => {
    const states = getPanelStates();
    const { width, height } = canvasSize.current;

    if (states.length > 0) {
      const firstPanel = states[0];
      const panelCenterX = firstPanel.x + PANEL_WIDTH / 2;
      const panelCenterY = firstPanel.y + PANEL_HEIGHT / 2;
      viewportX.value = withTiming(width / 2 - panelCenterX, { duration: 300 });
      viewportY.value = withTiming(height / 2 - panelCenterY, { duration: 300 });
    } else {
      viewportX.value = withTiming(0, { duration: 300 });
      viewportY.value = withTiming(0, { duration: 300 });
    }
  }, [getPanelStates, viewportX, viewportY]);

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal" />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="location" onPress={handleSnapToOrigin} />
      </Stack.Toolbar>
      <View style={styles.container} onLayout={handleLayout} testID="canvas-container">
        <SolarPanelCanvas
          panels={panels}
          selectedId={selectedId}
          onSelectPanel={setSelectedId}
          onBringToFront={bringToFront}
          viewportX={viewportX}
          viewportY={viewportY}
        />
        <Host style={styles.sheetHost}>
          <BottomSheet
            isPresented={showAssignSheet}
            onIsPresentedChange={setShowAssignSheet}
            modifiers={[
              presentationDetents(["medium", "large"]),
              presentationDragIndicator("visible"),
            ]}
          >
            <Form>
              <Section>
                <HStack>
                  <Button onPress={() => setShowAssignSheet(false)}>
                    <Image
                      systemName="xmark.circle.fill"
                      size={36}
                      color="#E5E5EA"
                    />
                  </Button>
                  <Spacer />
                  <Text modifiers={[bold(), font({ size: 17 })]}>
                    Assign Inverter
                  </Text>
                  <Spacer />
                  <VStack>
                    <Text> </Text>
                  </VStack>
                </HStack>
              </Section>

              {assignedInverter && (
                <Section title="Currently Assigned">
                  <Button onPress={handleUnassignInverter}>
                    <HStack>
                      <VStack alignment="leading" spacing={2}>
                        <Text
                          modifiers={[
                            foregroundStyle({
                              type: "hierarchical",
                              style: "primary",
                            }),
                          ]}
                        >
                          {assignedInverter.serialNumber}
                        </Text>
                        <Text
                          modifiers={[
                            foregroundStyle({
                              type: "hierarchical",
                              style: "tertiary",
                            }),
                            font({ size: 14 }),
                          ]}
                        >
                          {Math.round(assignedInverter.efficiency)}% efficiency
                        </Text>
                      </VStack>
                      <Spacer />
                      <Image
                        systemName="minus.circle.fill"
                        size={22}
                        color="#FF3B30"
                      />
                    </HStack>
                  </Button>
                </Section>
              )}

              <Section
                title={`Available (${availableInverters.length})`}
                footer={
                  availableInverters.length === 0 ? (
                    <Text>
                      All inverters are assigned. Add more in Configuration.
                    </Text>
                  ) : undefined
                }
              >
                {availableInverters.map((inverter) => (
                  <Button
                    key={inverter.id}
                    onPress={() => handleAssignInverter(inverter.id)}
                  >
                    <HStack>
                      <VStack alignment="leading" spacing={2}>
                        <Text
                          modifiers={[
                            foregroundStyle({
                              type: "hierarchical",
                              style: "primary",
                            }),
                          ]}
                        >
                          {inverter.serialNumber}
                        </Text>
                        <Text
                          modifiers={[
                            foregroundStyle({
                              type: "hierarchical",
                              style: "tertiary",
                            }),
                            font({ size: 14 }),
                          ]}
                        >
                          {Math.round(inverter.efficiency)}% efficiency
                        </Text>
                      </VStack>
                      <Spacer />
                      <Image
                        systemName="plus.circle.fill"
                        size={22}
                        color="#34C759"
                      />
                    </HStack>
                  </Button>
                ))}
              </Section>
            </Form>
          </BottomSheet>
        </Host>
      </View>
      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.Button icon="plus" onPress={handleAddPanel} />
        {selectedId && (
          <>
            <Stack.Toolbar.Button
              icon="bolt.fill"
              onPress={handleOpenAssignSheet}
            />
            <Stack.Toolbar.Button
              icon="rotate.right"
              onPress={handleRotatePanel}
            />
            <Stack.Toolbar.Button icon="trash" onPress={handleDeletePanel} />
          </>
        )}
      </Stack.Toolbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  sheetHost: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
