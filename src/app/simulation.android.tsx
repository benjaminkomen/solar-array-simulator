import React, { Suspense, useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Host, Picker, Slider } from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { useColors } from "@/utils/theme";
import { useSimulationControls, SEASONS } from "@/hooks/useSimulationControls";

const SimulationView = React.lazy(() => import("@/components/simulation/SimulationView"));

export default function SimulationScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    config,
    season,
    setSeason,
    latitude,
    longitude,
    sunriseHour,
    sunsetHour,
    currentHour,
    setCurrentHour,
    totalWattage,
    panels3D,
    formatTime,
    formatWattage,
  } = useSimulationControls();

  // Local state for immediate slider feedback. The hook's setCurrentHour is
  // debounced so the expensive wattage useMemo only runs after dragging settles.
  const [displayHour, setDisplayHour] = useState(currentHour);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const handleHourChange = useCallback((val: number) => {
    setDisplayHour(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setCurrentHour(val), 150);
  }, [setCurrentHour]);

  return (
    <>
      <Stack.Screen options={{ title: "Simulation", headerTitleAlign: 'center' }} />
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.canvasContainer}>
          <Suspense
            fallback={
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                  Loading 3D scene...
                </Text>
              </View>
            }
          >
            <SimulationView
              latitude={latitude}
              longitude={longitude}
              season={season}
              currentHour={displayHour}
              panels={panels3D}
              tiltAngle={config.panelTiltAngle}
            />
          </Suspense>
        </View>

        <View
          style={[
            styles.controlsContainer,
            {
              backgroundColor: isDark
                ? "rgba(0,0,0,0.85)"
                : "rgba(255,255,255,0.95)",
              paddingBottom: insets.bottom + 8,
              borderTopColor: colors.border.light,
            },
          ]}
        >
          <View style={styles.outputRow}>
            <Text style={[styles.outputLabel, { color: colors.text.secondary }]}>
              Total Output
            </Text>
            <Text style={[styles.outputValue, { color: colors.text.primary }]}>
              {formatWattage(totalWattage)}
            </Text>
          </View>

          <Text style={[styles.currentTime, { color: colors.text.primary }]}>
            {formatTime(displayHour)}
          </Text>

          <View style={styles.sliderRow}>
            <Text style={[styles.timeLabel, { color: colors.text.secondary }]}>
              {formatTime(sunriseHour)}
            </Text>
            <Host style={styles.sliderContainer} colorScheme={colorScheme ?? undefined}>
              <Slider
                value={displayHour}
                min={sunriseHour}
                max={sunsetHour}
                onValueChange={handleHourChange}
                modifiers={[fillMaxWidth()]}
              />
            </Host>
            <Text style={[styles.timeLabel, { color: colors.text.secondary }]}>
              {formatTime(sunsetHour)}
            </Text>
          </View>

          <Host style={styles.seasonRow} colorScheme={colorScheme ?? undefined}>
            <Picker
              options={SEASONS.map(s => s.label)}
              selectedIndex={SEASONS.findIndex(s => s.value === season)}
              onOptionSelected={({ nativeEvent: { index } }) => {
                const selected = SEASONS[index];
                if (selected) setSeason(selected.value);
              }}
              variant="segmented"
            />
          </Host>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  canvasContainer: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14 },
  controlsContainer: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12 },
  outputRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 },
  outputLabel: { fontSize: 14, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  outputValue: { fontSize: 32, fontWeight: "700", fontVariant: ["tabular-nums"] },
  currentTime: { fontSize: 40, fontWeight: "700", fontVariant: ["tabular-nums"], textAlign: "center", marginBottom: 4 },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, height: 56 },
  sliderContainer: { flex: 1, height: 56 },
  timeLabel: { fontSize: 11, fontVariant: ["tabular-nums"], width: 60, textAlign: "center" },
  seasonRow: { height: 48 },
});
