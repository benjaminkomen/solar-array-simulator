import React, { Suspense, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Host,
  Picker,
  Slider,
  Text as UIText,
} from "@expo/ui/swift-ui";
import { tag, pickerStyle } from "@expo/ui/swift-ui/modifiers";
import { usePanelsContext } from "@/contexts/PanelsContext";
import { useConfigStore } from "@/hooks/useConfigStore";
import { useColors } from "@/utils/theme";
import {
  getCurrentSeason,
  getSeasonDate,
  getSunriseAndSunset,
  getEffectiveOutput,
  type Season,
} from "@/utils/solarCalculations";

// Lazy-load the 3D scene to avoid Three.js bloating initial bundle
const SimulationView = React.lazy(() => import("@/components/simulation/SimulationView"));

const SEASONS: { value: Season; label: string }[] = [
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall", label: "Fall" },
  { value: "winter", label: "Winter" },
];

export default function SimulationScreen() {
  const { panels } = usePanelsContext();
  const { config } = useConfigStore();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [season, setSeason] = useState<Season>(() => getCurrentSeason());
  const latitude = config.latitude ?? 52.37; // Default: Amsterdam
  const longitude = config.longitude ?? 4.9;

  // Calculate sunrise/sunset for the slider range
  const { sunriseHour, sunsetHour } = useMemo(() => {
    const date = getSeasonDate(season);
    return getSunriseAndSunset(latitude, longitude, date);
  }, [latitude, longitude, season]);

  const [currentHour, setCurrentHour] = useState(() => {
    // Start at solar noon
    return (sunriseHour + sunsetHour) / 2;
  });

  // Snapshot panel positions from shared values
  const panelInfos = useMemo(
    () =>
      panels.map((p) => ({
        id: p.id,
        x: p.x.value,
        y: p.y.value,
        rotation: p.rotation.value as 0 | 90,
        inverterId: p.inverterId.value,
      })),
    [panels]
  );

  // Calculate per-panel wattages based on current time
  const { wattages, totalWattage } = useMemo(() => {
    const date = getSeasonDate(season);
    const hours = Math.floor(currentHour);
    const minutes = Math.floor((currentHour - hours) * 60);
    const simDate = new Date(date);
    simDate.setUTCHours(hours, minutes, 0, 0);

    const map = new Map<string, number>();
    let total = 0;

    for (const panel of panelInfos) {
      if (!panel.inverterId) {
        map.set(panel.id, 0);
        continue;
      }

      const inverter = config.inverters.find((i) => i.id === panel.inverterId);
      if (!inverter) {
        map.set(panel.id, 0);
        continue;
      }

      const output = getEffectiveOutput({
        maxWattage: config.defaultMaxWattage,
        inverterEfficiency: inverter.efficiency,
        latitude,
        longitude,
        panelTilt: config.panelTiltAngle,
        panelAzimuth: config.compassDirection,
        date: simDate,
      });

      const rounded = Math.round(output);
      map.set(panel.id, rounded);
      total += rounded;
    }

    return { wattages: map, totalWattage: total };
  }, [panelInfos, config, latitude, longitude, season, currentHour]);

  const panels3D = useMemo(
    () =>
      panelInfos.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        rotation: p.rotation,
        wattage: wattages.get(p.id) ?? 0,
      })),
    [panelInfos, wattages]
  );

  const formatTime = useCallback((utcHour: number) => {
    // Convert UTC solar time to local solar time for display
    const localHour = (((utcHour + longitude / 15) % 24) + 24) % 24;
    const h = Math.floor(localHour);
    const m = Math.floor((localHour - h) * 60);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
  }, [longitude]);

  const formatWattage = (watts: number): string => {
    if (watts >= 1000) return `${(watts / 1000).toFixed(1)}kW`;
    return `${watts}W`;
  };

  return (
    <>
      <Stack.Screen options={{ title: "Simulation" }} />
      <Stack.Screen.BackButton displayMode="minimal" />
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        {/* 3D Canvas */}
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
              currentHour={currentHour}
              panels={panels3D}
              tiltAngle={config.panelTiltAngle}
            />
          </Suspense>
        </View>

        {/* Controls overlay */}
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
          {/* Total output */}
          <View style={styles.outputRow}>
            <Text style={[styles.outputLabel, { color: colors.text.secondary }]}>
              Total Output
            </Text>
            <Text style={[styles.outputValue, { color: colors.text.primary }]}>
              {formatWattage(totalWattage)}
            </Text>
          </View>

          {/* Current time display */}
          <Text style={[styles.currentTime, { color: colors.text.primary }]}>
            {formatTime(currentHour)}
          </Text>

          {/* Time slider */}
          <View style={styles.sliderRow}>
            <Text style={[styles.timeLabel, { color: colors.text.secondary }]}>
              {formatTime(sunriseHour)}
            </Text>
            <Host style={styles.sliderContainer}>
              <Slider
                value={currentHour}
                min={sunriseHour}
                max={sunsetHour}
                onValueChange={setCurrentHour}
              />
            </Host>
            <Text style={[styles.timeLabel, { color: colors.text.secondary }]}>
              {formatTime(sunsetHour)}
            </Text>
          </View>

          {/* Season picker */}
          <Host style={styles.seasonRow}>
            <Picker
              selection={season}
              onSelectionChange={(value) => {
                if (value) setSeason(value as Season);
              }}
              modifiers={[pickerStyle("segmented")]}
            >
              {SEASONS.map((s) => (
                <UIText key={s.value} modifiers={[tag(s.value)]}>
                  {s.label}
                </UIText>
              ))}
            </Picker>
          </Host>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvasContainer: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  controlsContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  outputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  outputLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  outputValue: {
    fontSize: 32,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  currentTime: {
    fontSize: 40,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    marginBottom: 4,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    height: 44,
  },
  sliderContainer: {
    flex: 1,
    height: 44,
  },
  timeLabel: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    width: 60,
    textAlign: "center",
  },
  seasonRow: {
    height: 36,
  },
});
