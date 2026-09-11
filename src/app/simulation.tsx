import React, { Suspense, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import { useColors } from "@/utils/theme";
import { useSimulationControls } from "@/hooks/useSimulationControls";
import { SimulationControls } from "@/components/simulation/SimulationControls";
import { sceneState } from "@/utils/sceneState";
import { getSolarPosition, getSeasonDate, makeDateAtHour } from "@/utils/solarCalculations";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";

const SimulationView = React.lazy(() => import("@/components/simulation/SimulationView"));

function syncSceneState(
  latitude: number,
  longitude: number,
  season: string,
  sunriseHour: number,
  sunsetHour: number,
) {
  sceneState.latitude = latitude;
  sceneState.longitude = longitude;
  sceneState.season = season as typeof sceneState.season;
  sceneState.sunriseHour = sunriseHour;
  sceneState.sunsetHour = sunsetHour;
  const noonHour = (sunriseHour + sunsetHour) / 2;
  const date = makeDateAtHour(getSeasonDate(season as typeof sceneState.season), noonHour);
  const pos = getSolarPosition(latitude, longitude, date);
  sceneState.peakElevation = pos.elevation;
  sceneState._generation++;
}

function applyHourToScene(hour: number) {
  sceneState.currentHour = hour;
}

export default function SimulationScreen() {
  useMarkInteractive();
  const colors = useColors();

  const {
    config,
    season,
    setSeason,
    latitude,
    longitude,
    sunriseHour,
    sunsetHour,
    displayHour,
    onHourChange,
    totalWattage,
    panels3D,
    formatTime,
    formatWattage,
  } = useSimulationControls();

  useEffect(() => {
    syncSceneState(latitude, longitude, season, sunriseHour, sunsetHour);
  }, [latitude, longitude, season, sunriseHour, sunsetHour]);

  const handleHourChange = useCallback((val: number) => {
    applyHourToScene(val);
    onHourChange(val);
  }, [onHourChange]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Simulation",
          headerTitleAlign: Platform.OS === "android" ? "center" : undefined,
        }}
      />
      {Platform.OS === "ios" ? (
        <Stack.Screen.BackButton displayMode="minimal" />
      ) : null}
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
              panels={panels3D}
              tiltAngle={config.panelTiltAngle}
            />
          </Suspense>
        </View>

        <SimulationControls
          displayHour={displayHour}
          sunriseHour={sunriseHour}
          sunsetHour={sunsetHour}
          season={season}
          totalWattageLabel={formatWattage(totalWattage)}
          currentTimeLabel={formatTime(displayHour)}
          sunriseLabel={formatTime(sunriseHour)}
          sunsetLabel={formatTime(sunsetHour)}
          onHourChange={handleHourChange}
          onSeasonChange={setSeason}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  canvasContainer: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14 },
});
