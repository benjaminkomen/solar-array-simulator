import { useState } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { ProductionCanvas } from "@/components/ProductionCanvas";
import { ZoomControls } from "@/components/ZoomControls";
import { Compass } from "@/components/Compass";
import { useColors } from "@/utils/theme";
import { useProductionMonitor } from "@/hooks/useProductionMonitor";
import { Host, IconButton, Icon, Row, ModalBottomSheet, ListItem, Column } from "@expo/ui/jetpack-compose";
import { fillMaxWidth, paddingAll, clickable } from "@expo/ui/jetpack-compose/modifiers";

const ANDROID_APPBAR_HEIGHT = 56;

export default function ProductionScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [menuVisible, setMenuVisible] = useState(false);

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
            <Host matchContents>
              <Row>
                <IconButton onPress={handleSimulate}>
                  <Icon source={require('@/assets/symbols/wb_sunny.xml')} tintColor={colors.text.primary} />
                </IconButton>
                <IconButton onPress={() => setMenuVisible(true)}>
                  <Icon source={require('@/assets/symbols/more_vert.xml')} tintColor={colors.text.primary} />
                </IconButton>
              </Row>
            </Host>
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
      {menuVisible && (
        <Host matchContents>
          <ModalBottomSheet onDismissRequest={() => setMenuVisible(false)}>
            <Column modifiers={[fillMaxWidth(), paddingAll(8)]}>
              <ListItem
                headline="Edit Configuration"
                modifiers={[clickable(() => { setMenuVisible(false); handleEditConfiguration(); })]}
              >
                <ListItem.Leading>
                  <Icon source={require('@/assets/symbols/edit.xml')} tintColor={colors.primary} />
                </ListItem.Leading>
              </ListItem>
              <ListItem
                headline="Delete Configuration"
                modifiers={[clickable(() => { setMenuVisible(false); handleDeleteConfiguration(); })]}
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
