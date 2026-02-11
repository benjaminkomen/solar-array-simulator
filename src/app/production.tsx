import { View, Text, StyleSheet, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import { Stack } from "expo-router";
import { useSharedValue, withTiming, runOnUI } from "react-native-reanimated";
import { usePanelsContext } from "@/contexts/PanelsContext";
import { useConfigStore } from "@/hooks/useConfigStore";
import { ProductionCanvas } from "@/components/ProductionCanvas";
import { ZoomControls } from "@/components/ZoomControls";
import { ZOOM_LEVELS, DEFAULT_ZOOM_INDEX } from "@/utils/zoomConstants";

interface WattageMap {
  [panelId: string]: number;
}

export default function ProductionScreen() {
  const { panels } = usePanelsContext();
  const { config } = useConfigStore();
  const [wattages, setWattages] = useState<WattageMap>({});
  const [totalWattage, setTotalWattage] = useState(0);
  const insets = useSafeAreaInsets();

  // Viewport shared values
  const viewportX = useSharedValue(0);
  const viewportY = useSharedValue(0);
  const scale = useSharedValue(ZOOM_LEVELS[DEFAULT_ZOOM_INDEX]);
  const canvasWidth = useSharedValue(0);
  const canvasHeight = useSharedValue(0);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;

      // Update shared values on UI thread to avoid render warnings
      runOnUI(() => {
        'worklet';
        canvasWidth.value = width;
        canvasHeight.value = height;
      })();
    },
    [canvasWidth, canvasHeight]
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

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal" />
      <View style={styles.container}>
        <View
          style={{
            backgroundColor: "#f9fafb3c",
            borderRadius: 16,
            borderCurve: "continuous",
            padding: 20,
            marginHorizontal: 16,
            marginTop: insets.top + 30,
            marginBottom: 0,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            borderWidth: 1,
            borderColor: "rgba(0, 0, 0, 0.06)",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: "#6b7280",
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
              color: "#1f2937",
              fontVariant: ["tabular-nums"],
            }}
          >
            {formatWattage(totalWattage)}
          </Text>
        </View>
        <View style={styles.canvasContainer} onLayout={handleLayout}>
          <ProductionCanvas
            panels={panels}
            wattages={new Map(Object.entries(wattages))}
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
});
