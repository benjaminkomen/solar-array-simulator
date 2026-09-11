import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuItem,
  Host,
  Icon,
  IconButton,
  Text as UIText,
} from "@expo/ui/jetpack-compose";
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
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon={WbSunny} onPress={handleSimulate} accessibilityLabel="Simulate" />
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
          <View style={styles.cardHeader}>
            {/*
              Leading in-content overflow — not the right toolbar slot. Dev
              Client Tools occupies that header corner and wins the tap
              (Reload / Go home) regardless of a11y label.
            */}
            <View style={styles.cardMenu} collapsable={false}>
              <Host matchContents>
                <DropdownMenu expanded={menuVisible} onDismissRequest={() => setMenuVisible(false)}>
                  <DropdownMenu.Trigger>
                    <IconButton onClick={() => setMenuVisible(true)}>
                      <Icon
                        source={MoreVert}
                        tint={colors.text.primary}
                        contentDescription={PRODUCTION_MENU_A11Y_ANDROID}
                      />
                    </IconButton>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Items>
                    <DropdownMenuItem onClick={() => { setMenuVisible(false); handleEditConfiguration(); }}>
                      <DropdownMenuItem.LeadingIcon>
                        <Icon source={Edit} tint={colors.primary} />
                      </DropdownMenuItem.LeadingIcon>
                      <DropdownMenuItem.Text>
                        <UIText>Edit Configuration</UIText>
                      </DropdownMenuItem.Text>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setMenuVisible(false); handleDeleteConfiguration(); }}>
                      <DropdownMenuItem.LeadingIcon>
                        <Icon source={Delete} tint={colors.system.red} />
                      </DropdownMenuItem.LeadingIcon>
                      <DropdownMenuItem.Text>
                        <UIText>Delete Configuration</UIText>
                      </DropdownMenuItem.Text>
                    </DropdownMenuItem>
                  </DropdownMenu.Items>
                </DropdownMenu>
              </Host>
            </View>
            <View style={styles.cardTitles}>
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
          </View>
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  cardMenu: {
    width: 48,
    height: 48,
    marginLeft: -8,
    marginTop: -8,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitles: {
    flex: 1,
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
