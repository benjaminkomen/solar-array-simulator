import { View, Text, StyleSheet, useColorScheme, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { ProductionCanvas } from "@/components/ProductionCanvas";
import { ZoomControls } from "@/components/ZoomControls";
import { Compass } from "@/components/Compass";
import { useColors } from "@/utils/theme";
import { useProductionMonitor } from "@/hooks/useProductionMonitor";
import { Host, Button, ContextMenu } from "@expo/ui/jetpack-compose";

const ANDROID_APPBAR_HEIGHT = 56;

export default function ProductionScreen() {
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
      <Stack.Screen
        options={{
          title: "",
          headerBackVisible: false,
          headerTransparent: true,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={handleSimulate} style={styles.headerButton} accessibilityLabel="Simulate">
                <Text style={[styles.headerButtonText, { color: colors.text.primary }]}>Simulate</Text>
              </Pressable>
              <Host matchContents>
                <ContextMenu>
                  <ContextMenu.Trigger>
                    <Button leadingIcon="filled.MoreVert" variant="borderless" />
                  </ContextMenu.Trigger>
                  <ContextMenu.Items>
                    <Button leadingIcon="filled.Edit" onPress={handleEditConfiguration}>Edit Configuration</Button>
                    <Button leadingIcon="filled.Delete" onPress={handleDeleteConfiguration}>Delete Configuration</Button>
                  </ContextMenu.Items>
                </ContextMenu>
              </Host>
            </View>
          ),
        }}
      />
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
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
