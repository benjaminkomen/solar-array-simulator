import { useEffect, useState } from 'react';
import {
  getConfig,
  updateDefaultWattage as updateWattage,
  updateInverterEfficiency,
  updateInverterSerialNumber,
  addInverter as addNewInverter,
  addInverterWithDetails,
  removeInverter as deleteInverter,
  getWizardCompleted,
  setWizardCompleted,
  updateCompassDirection as updateDirection,
  updateLocation as updateLoc,
  updatePanelTiltAngle as updateTilt,
  updateRoofType as updateRoof,
  subscribe,
  type SystemConfig,
  type RoofType,
} from '@/utils/configStore';

export function useConfigStore() {
  const [config, setConfig] = useState<SystemConfig>(() => getConfig());

  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = subscribe((newConfig) => {
      setConfig(newConfig);
    });

    return () => unsubscribe();
  }, []);

  return {
    config,
    updateDefaultWattage: (wattage: number) => updateWattage(wattage),
    updateInverterEfficiency: (inverterId: string, efficiency: number) =>
      updateInverterEfficiency(inverterId, efficiency),
    updateInverterSerialNumber: (inverterId: string, serialNumber: string) =>
      updateInverterSerialNumber(inverterId, serialNumber),
    addInverter: () => addNewInverter(),
    addInverterWithDetails: (serialNumber: string, efficiency: number) =>
      addInverterWithDetails(serialNumber, efficiency),
    removeInverter: (inverterId: string) => deleteInverter(inverterId),
    getWizardCompleted: () => getWizardCompleted(),
    setWizardCompleted: (completed: boolean) => setWizardCompleted(completed),
    updateCompassDirection: (degrees: number) => updateDirection(degrees),
    updateLocation: (lat: number, lon: number, name: string) => updateLoc(lat, lon, name),
    updatePanelTiltAngle: (degrees: number) => updateTilt(degrees),
    updateRoofType: (type: RoofType) => updateRoof(type),
  };
}
