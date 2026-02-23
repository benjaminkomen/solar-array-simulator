import { View, Text, StyleSheet, type LayoutChangeEvent, useColorScheme, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { usePanelsContext } from "@/contexts/PanelsContext";
import { useConfigStore } from "@/hooks/useConfigStore";
import { ProductionCanvas } from "@/components/ProductionCanvas";
import { ZoomControls } from "@/components/ZoomControls";
import { Compass } from "@/components/Compass";
import { PANEL_WIDTH, PANEL_HEIGHT } from "@/utils/panelUtils";
import { useZoom } from "@/hooks/useZoom";
import { useColors } from "@/utils/theme";
import { resetAllData } from "@/utils/configStore";
import { clearPanels } from "@/utils/panelStore";
import { getEffectiveOutput } from "@/utils/solarCalculations";

function formatWattage(watts: number): string {
  if (watts >= 1000) {
    return `${(watts / 1000).toFixed(1)}kW`;
  }
  return `${watts}W`;
}

function applyCanvasSize(
  canvasWidth: SharedValue<number>,
  canvasHeight: SharedValue<number>,
  width: number,
  height: number,
) {
  'worklet';
  canvasWidth.value = width;
  canvasHeight.value = height;
}

function applyViewportPosition(
  viewportX: SharedValue<number>,
  viewportY: SharedValue<number>,
  x: number,
  y: number,
) {
  viewportX.value = x;
  viewportY.value = y;
}

function useViewport(panels: ReturnType<typeof usePanelsContext>["panels"]) {
  const viewportX = useSharedValue(0);
  const viewportY = useSharedValue(0);
  const canvasWidth = useSharedValue(0);
  const canvasHeight = useSharedValue(0);
  const hasInitializedViewport = useRef(false);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;

      scheduleOnUI(applyCanvasSize, canvasWidth, canvasHeight, width, height);

      if (!hasInitializedViewport.current && panels.length > 0 && width > 0 && height > 0) {
        hasInitializedViewport.current = true;

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

        const boundingCenterX = (minX + maxX) / 2;
        const boundingCenterY = (minY + maxY) / 2;
        applyViewportPosition(viewportX, viewportY, width / 2 - boundingCenterX, height / 2 - boundingCenterY);
      }
    },
    [canvasWidth, canvasHeight, viewportX, viewportY, panels]
  );

  return { viewportX, viewportY, canvasWidth, canvasHeight, handleLayout };
}

export default function ProductionScreen() {
  const { panels } = usePanelsContext();
  const { config } = useConfigStore();
  const router = useRouter();
  const [wattageState, setWattageState] = useState<{ map: Map<string, number>; total: number }>(
    { map: new Map(), total: 0 }
  );
  const wattages = wattageState.map;
  const totalWattage = wattageState.total;
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [menuVisible, setMenuVisible] = useState(false);

  const { zoomIndex, scale, handleZoomIn, handleZoomOut } = useZoom();
  const { viewportX, viewportY, canvasWidth, canvasHeight, handleLayout } = useViewport(panels);

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

      const output = getEffectiveOutput({
        maxWattage: config.defaultMaxWattage,
        inverterEfficiency: inverter.efficiency,
        latitude: config.latitude,
        longitude: config.longitude,
        panelTilt: config.panelTiltAngle,
        panelAzimuth: config.compassDirection,
        date: new Date(),
      });
      return Math.round(output);
    },
    [panels, config]
  );

  useEffect(() => {
    const updateWattages = () => {
      const newWattages = new Map<string, number>();
      let total = 0;

      for (const panel of panels) {
        const wattage = calculateWattage(panel.id);
        newWattages.set(panel.id, wattage);
        total += wattage;
      }

      setWattageState({ map: newWattages, total });
    };

    updateWattages();
    const interval = setInterval(updateWattages, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculateWattage]);

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
    setMenuVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/config?wizard=true");
  }, [router]);

  const handleDeleteConfiguration = useCallback(() => {
    setMenuVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    resetAllData();
    clearPanels();
    router.replace("/");
  }, [router]);

  const handleSimulate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/simulation");
  }, [router]);

  const cardStyle = useMemo(() => ({
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    borderCurve: "continuous" as const,
    padding: 20,
    marginHorizontal: 16,
    marginTop: insets.top + 30,
    marginBottom: 0,
    boxShadow: isDark
      ? "0 2px 8px rgba(255, 255, 255, 0.2)"
      : "0 2px 8px rgba(0, 0, 0, 0.08)",
    borderWidth: 1,
    borderColor: colors.border.light,
  }), [colors, insets.top, isDark]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerBackVisible: false,
          headerTransparent: true,
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable onPress={handleSimulate} style={styles.headerIconButton} accessibilityLabel="Simulate">
                <Image source="sf:sun.max" style={styles.headerIcon} tintColor={colors.text.primary} />
              </Pressable>
              <Pressable
                onPress={() => setMenuVisible((v) => !v)}
                style={styles.headerIconButton}
                accessibilityLabel="More options"
              >
                <Image source="sf:ellipsis.circle" style={styles.headerIcon} tintColor={colors.text.primary} />
              </Pressable>
            </View>
          ),
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View style={cardStyle}>
          <Text style={[styles.cardLabel, { color: colors.text.secondary }]}>
            Total Array Output
          </Text>
          <Text
            selectable
            style={[styles.cardValue, { color: colors.text.primary }]}
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
            wattages={wattages}
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

        {/* Overflow menu dropdown */}
        {menuVisible && (
          <View
            style={[
              styles.menuOverlay,
              {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
                top: insets.top + 50,
              },
            ]}
          >
            <Pressable onPress={handleEditConfiguration} style={styles.menuItem}>
              <Image source="sf:pencil" style={styles.menuIcon} tintColor={colors.text.primary} />
              <Text style={[styles.menuText, { color: colors.text.primary }]}>Edit Configuration</Text>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: colors.border.light }]} />
            <Pressable onPress={handleDeleteConfiguration} style={styles.menuItem}>
              <Image source="sf:trash" style={styles.menuIcon} tintColor={colors.system.red} />
              <Text style={[styles.menuText, { color: colors.system.red }]}>Delete Configuration</Text>
            </Pressable>
          </View>
        )}
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
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: 48,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerIconButton: {
    padding: 8,
  },
  headerIcon: {
    width: 22,
    height: 22,
  },
  menuOverlay: {
    position: "absolute",
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    minWidth: 200,
    elevation: 8,
    zIndex: 100,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuIcon: {
    width: 18,
    height: 18,
  },
  menuText: {
    fontSize: 16,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 16,
  },
});
