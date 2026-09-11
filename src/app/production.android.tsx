import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { ProductionCanvas } from "@/components/ProductionCanvas";
import { ZoomControls } from "@/components/ZoomControls";
import { Compass } from "@/components/Compass";
import { useColors } from "@/utils/theme";
import { useProductionMonitor } from "@/hooks/useProductionMonitor";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";
import { PRODUCTION_MENU_A11Y_ANDROID } from "@/utils/productionChrome";
import Delete from "@expo/material-symbols/delete.xml";
import Edit from "@expo/material-symbols/edit.xml";
import MoreVert from "@expo/material-symbols/more_vert.xml";
import WbSunny from "@expo/material-symbols/wb_sunny.xml";

const ANDROID_APPBAR_HEIGHT = 56;

export default function ProductionScreen() {
  useMarkInteractive();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    panels,
    config,
    wattages,
    totalWattage,
    zoomIndex,
    scale,
    handleZoomIn,
    handleZoomOut,
    viewportX,
    viewportY,
    canvasWidth,
    canvasHeight,
    handleLayout,
    handlePanelTap,
    handleEditConfiguration,
    handleDeleteConfiguration,
    handleSimulate,
    cardStyle,
    formatWattage,
  } = useProductionMonitor();

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon={WbSunny} onPress={handleSimulate} accessibilityLabel="Simulate" />
        <Stack.Toolbar.Menu icon={MoreVert} accessibilityLabel={PRODUCTION_MENU_A11Y_ANDROID}>
          <Stack.Toolbar.MenuAction icon={Edit} onPress={handleEditConfiguration}>
            Edit Configuration
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction icon={Delete} destructive onPress={handleDeleteConfiguration}>
            Delete Configuration
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View style={[cardStyle, {
          backgroundColor: colors.background.primary,
          marginTop: insets.top + ANDROID_APPBAR_HEIGHT + 16,
          boxShadow: isDark
            ? "0 2px 8px rgba(255, 255, 255, 0.2)"
            : "0 2px 8px rgba(0, 0, 0, 0.08)",
          borderColor: colors.border.light,
        }]}>
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
});
