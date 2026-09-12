import { View, Text, StyleSheet, useColorScheme, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Host, Slider } from "@expo/ui";
import { useColors } from "@/utils/theme";
import { SeasonPicker } from "@/components/simulation/SeasonPicker";
import type { Season } from "@/utils/solarCalculations";

export type SimulationControlsProps = {
  displayHour: number;
  sunriseHour: number;
  sunsetHour: number;
  season: Season;
  totalWattageLabel: string;
  currentTimeLabel: string;
  sunriseLabel: string;
  sunsetLabel: string;
  onHourChange: (value: number) => void;
  onSeasonChange: (season: Season) => void;
};

/**
 * Shared Simulation chrome: universal `@expo/ui` Slider + platform
 * segmented SeasonPicker. SimulationView stays the GPU surface and is
 * not rendered here.
 */
export function SimulationControls({
  displayHour,
  sunriseHour,
  sunsetHour,
  season,
  totalWattageLabel,
  currentTimeLabel,
  sunriseLabel,
  sunsetLabel,
  onHourChange,
  onSeasonChange,
}: SimulationControlsProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
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
          {totalWattageLabel}
        </Text>
      </View>

      <Text style={[styles.currentTime, { color: colors.text.primary }]}>
        {currentTimeLabel}
      </Text>

      <View style={styles.sliderRow}>
        <Text style={[styles.timeLabel, { color: colors.text.secondary }]}>
          {sunriseLabel}
        </Text>
        <Host
          style={styles.sliderContainer}
          colorScheme={colorScheme ?? undefined}
        >
          <Slider
            value={displayHour}
            min={sunriseHour}
            max={sunsetHour}
            onValueChange={onHourChange}
            testID="simulation-hour-slider"
          />
        </Host>
        <Text style={[styles.timeLabel, { color: colors.text.secondary }]}>
          {sunsetLabel}
        </Text>
      </View>

      <Host
        style={styles.seasonRow}
        colorScheme={colorScheme ?? undefined}
      >
        <SeasonPicker season={season} onChange={onSeasonChange} />
      </Host>
    </View>
  );
}

const sliderRowHeight = Platform.OS === "android" ? 56 : 44;
const seasonRowHeight = Platform.OS === "android" ? 48 : 36;

const styles = StyleSheet.create({
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
    height: sliderRowHeight,
  },
  sliderContainer: { flex: 1, height: sliderRowHeight },
  timeLabel: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    width: 60,
    textAlign: "center",
  },
  seasonRow: { height: seasonRowHeight },
});
