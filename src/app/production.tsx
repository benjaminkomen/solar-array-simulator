import { View, Text, StyleSheet, type LayoutChangeEvent, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState, useCallback, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import * as Haptics from "expo-haptics";
import { usePanelsContext } from "@/contexts/PanelsContext";
import { useConfigStore } from "@/hooks/useConfigStore";
import { ProductionCanvas } from "@/components/ProductionCanvas";
import { ZoomControls } from "@/components/ZoomControls";
import { Compass } from "@/components/Compass";
import { ZOOM_LEVELS, DEFAULT_ZOOM_INDEX } from "@/utils/zoomConstants";
import { PANEL_WIDTH, PANEL_HEIGHT } from "@/utils/panelUtils";
import { useColors } from "@/utils/theme";
import { resetAllData } from "@/utils/configStore";
import { clearPanels } from "@/utils/panelStore";

interface WattageMap {
  [panelId: string]: number;
}

export default function ProductionScreen() {
  const { panels } = usePanelsContext();
  const { config } = useConfigStore();
  const router = useRouter();
  const [wattages, setWattages] = useState<WattageMap>({});
  const [totalWattage, setTotalWattage] = useState(0);
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Viewport shared values
  const viewportX = useSharedValue(0);
  const viewportY = useSharedValue(0);
  const scale = useSharedValue(ZOOM_LEVELS[DEFAULT_ZOOM_INDEX]);
  const canvasWidth = useSharedValue(0);
  const canvasHeight = useSharedValue(0);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const hasInitializedViewport = useRef(false);

  const updateCanvasSize = (width: number, height: number) => {
    'worklet';
    canvasWidth.value = width;
    canvasHeight.value = height;
  };

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;

      // Update shared values on UI thread to avoid render warnings
      scheduleOnUI(updateCanvasSize, width, height);

      // Center viewport on panels bounding box (once, on first layout)
      if (!hasInitializedViewport.current && panels.length > 0 && width > 0 && height > 0) {
        hasInitializedViewport.current = true;

        // Calculate bounding box of all panels
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const panel of panels) {
          const panelWidth = panel.rotation.value === 90 ? PANEL_HEIGHT : PANEL_WIDTH;
          const panelHeight = panel.rotation.value === 90 ? PANEL_WIDTH : PANEL_HEIGHT;
          minX = Math.min(minX, panel.x.value);
          minY = Math.min(minY, panel.y.value);
          maxX = Math.max(maxX, panel.x.value + panelWidth);
          maxY = Math.max(maxY, panel.y.value + panelHeight);
        }

        // Center viewport on the bounding box center
        const boundingCenterX = (minX + maxX) / 2;
        const boundingCenterY = (minY + maxY) / 2;
        viewportX.value = width / 2 - boundingCenterX;
        viewportY.value = height / 2 - boundingCenterY;
      }
    },
    [canvasWidth, canvasHeight, panels, viewportX, viewportY]
  );

  // Calculate wattage for a single panel
  const calculateWattage = useCallback(
    (panelId: string): number => {
      const panel = panels.find((p) => p.id === panelId);
      if (!panel || panel.inverterId.value === null) {
        return 0;
      }

      const inverter = config.inverters.find((i) => i.id === panel.inverterId.value);
      if (!inverter) {
        return 0;
      }

      const efficiency = inverter.efficiency / 100;
      const baseWattage = config.defaultMaxWattage * efficiency;
      // Add ±5% fluctuation
      const fluctuation = 0.95 + Math.random() * 0.1;
      return Math.round(baseWattage * fluctuation);
    },
    [panels, config]
  );

  // Update wattages every second
  useEffect(() => {
    const updateWattages = () => {
      const newWattages: WattageMap = {};
      let total = 0;

      for (const panel of panels) {
        const wattage = calculateWattage(panel.id);
        newWattages[panel.id] = wattage;
        total += wattage;
      }

      setWattages(newWattages);
      setTotalWattage(total);
    };

    // Initial update
    updateWattages();

    // Update every 1 second
    const interval = setInterval(updateWattages, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculateWattage]);

  // Format wattage display (kW if > 1000W)
  const formatWattage = (watts: number): string => {
    if (watts >= 1000) {
      return `${(watts / 1000).toFixed(1)}kW`;
    }
    return `${watts}W`;
  };

  const handleZoomIn = useCallback(() => {
    if (zoomIndex > 0) {
      const newIndex = zoomIndex - 1;
      setZoomIndex(newIndex);
      scale.value = withTiming(ZOOM_LEVELS[newIndex], { duration: 200 });
    }
  }, [zoomIndex, scale]);

  const handleZoomOut = useCallback(() => {
    if (zoomIndex < ZOOM_LEVELS.length - 1) {
      const newIndex = zoomIndex + 1;
      setZoomIndex(newIndex);
      scale.value = withTiming(ZOOM_LEVELS[newIndex], { duration: 200 });
    }
  }, [zoomIndex, scale]);

  const handlePanelTap = useCallback(
    (panelId: string) => {
      const panel = panels.find((p) => p.id === panelId);
      if (panel?.inverterId.value) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/panel-details?panelId=${panelId}&mode=view`);
      }
    },
    [panels, router]
  );

  const handleEditConfiguration = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/config?wizard=true");
  }, [router]);

  const handleDeleteConfiguration = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    resetAllData();
    clearPanels();
    router.replace("/");
  }, [router]);

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis.circle">
          <Stack.Toolbar.MenuAction icon="pencil" onPress={handleEditConfiguration}>
            Edit Configuration
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction icon="trash" destructive onPress={handleDeleteConfiguration}>
            Delete Configuration
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: 16,
            borderCurve: "continuous",
            padding: 20,
            marginHorizontal: 16,
            marginTop: insets.top + 30,
            marginBottom: 0,
            boxShadow: isDark
              ? "0 2px 8px rgba(255, 255, 255, 0.2)"
              : "0 2px 8px rgba(0, 0, 0, 0.08)",
            borderWidth: 1,
            borderColor: colors.border.light,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: colors.text.secondary,
              marginBottom: 8,
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}
          >
            Total Array Output
          </Text>
          <Text
            selectable
            style={{
              fontSize: 48,
              fontWeight: "700",
              color: colors.text.primary,
              fontVariant: ["tabular-nums"],
            }}
          >
            {formatWattage(totalWattage)}
          </Text>
        </View>
        <View style={styles.canvasContainer} onLayout={handleLayout}>
          <View style={styles.compassContainer}>
            <Compass direction={config.compassDirection} readOnly />
          </View>
          <ProductionCanvas
            panels={panels}
            wattages={new Map(Object.entries(wattages))}
            viewportX={viewportX}
            viewportY={viewportY}
            scale={scale}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            onPanelTap={handlePanelTap}
          />
          <ZoomControls
            currentIndex={zoomIndex}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  canvasContainer: {
    flex: 1,
  },
  compassContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
});
