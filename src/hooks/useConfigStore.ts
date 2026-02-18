import { useEffect, useState } from 'react';
import {
  getConfig,
  updateDefaultWattage,
  updateInverterEfficiency,
  updateInverterSerialNumber,
  addInverterWithDetails,
  removeInverter,
  getWizardCompleted,
  setWizardCompleted,
  updateCompassDirection,
  updateLocation,
  updatePanelTiltAngle,
  updateRoofType,
  subscribe,
  type SystemConfig,
  type RoofType,
} from '@/utils/configStore';

export function useConfigStore() {
  const [config, setConfig] = useState<SystemConfig>(() => getConfig());

  useEffect(() => {
    const unsubscribe = subscribe((newConfig) => {
      setConfig(newConfig);
    });

    return () => unsubscribe();
  }, []);

  return {
    config,
    updateDefaultWattage,
    updateInverterEfficiency,
    updateInverterSerialNumber,
    addInverterWithDetails,
    removeInverter,
    getWizardCompleted,
    setWizardCompleted,
    updateCompassDirection,
    updateLocation,
    updatePanelTiltAngle,
    updateRoofType,
  };
}
