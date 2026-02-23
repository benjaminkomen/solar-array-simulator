/**
 * Business logic for the Production screen.
 * Manages real-time wattage calculations, panel tap handling, and config actions.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { usePanelsContext } from "@/contexts/PanelsContext";
import { useConfigStore } from "@/hooks/useConfigStore";
import { useZoom } from "@/hooks/useZoom";
import { useViewport } from "@/hooks/useViewport";
import { resetAllData } from "@/utils/configStore";
import { clearPanels } from "@/utils/panelStore";
import { getEffectiveOutput } from "@/utils/solarCalculations";
import { formatWattage } from "@/utils/formatters";

export { formatWattage };

export function useProductionMonitor() {
  const { panels } = usePanelsContext();
  const { config } = useConfigStore();
  const router = useRouter();
  const [wattageState, setWattageState] = useState<{ map: Map<string, number>; total: number }>(
    { map: new Map(), total: 0 }
  );
  const wattages = wattageState.map;
  const totalWattage = wattageState.total;

  const { zoomIndex, scale, handleZoomIn, handleZoomOut } = useZoom();
  const { viewportX, viewportY, canvasWidth, canvasHeight, handleLayout } = useViewport(panels);

  // Calculate wattage for a single panel using solar position model
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

  // Update wattages every second
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/config?wizard=true");
  }, [router]);

  const handleDeleteConfiguration = useCallback(() => {
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
    borderRadius: 16,
    borderCurve: "continuous" as const,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 0,
    borderWidth: 1,
  }), []);

  return {
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
  };
}
