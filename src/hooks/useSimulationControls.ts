/**
 * Business logic for the Simulation screen.
 * Manages season/time state, panel wattage calculations, and time formatting.
 */
import { useState, useMemo, useCallback } from "react";
import { usePanelsContext } from "@/contexts/PanelsContext";
import { useConfigStore } from "@/hooks/useConfigStore";
import {
  getCurrentSeason,
  getSeasonDate,
  getSunriseAndSunset,
  getEffectiveOutput,
  type Season,
} from "@/utils/solarCalculations";
import { formatWattage } from "@/utils/formatters";

export const SEASONS: { value: Season; label: string }[] = [
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall", label: "Fall" },
  { value: "winter", label: "Winter" },
];

export { formatWattage };

export function useSimulationControls() {
  const { panels } = usePanelsContext();
  const { config } = useConfigStore();

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

  return {
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
  };
}
