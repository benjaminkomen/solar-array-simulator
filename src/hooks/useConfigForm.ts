/**
 * Business logic for the Config screen.
 * Handles location search, inverter management, and form state.
 */
import { useState, useCallback, useRef } from 'react';
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useConfigStore } from '@/hooks/useConfigStore';
import type { InverterConfig, RoofType } from '@/utils/configStore';
import { searchCity, type GeocodingResult } from "@/utils/geocoding";

export const ROOF_TYPES: { value: RoofType; label: string }[] = [
  { value: 'gable', label: 'Gable' },
  { value: 'hip', label: 'Hip' },
  { value: 'flat', label: 'Flat' },
  { value: 'shed', label: 'Shed' },
];

export function useConfigForm() {
  const router = useRouter();
  const { wizard } = useLocalSearchParams<{ wizard?: string }>();
  const isWizardMode = wizard === 'true';

  const {
    config,
    updateDefaultWattage,
    removeInverter,
    updateLocation,
    updatePanelTiltAngle,
    updateRoofType,
  } = useConfigStore();

  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleWattageChange = (text: string) => {
    const wattage = parseInt(text, 10);
    if (!isNaN(wattage)) {
      updateDefaultWattage(wattage);
    }
  };

  const handleDelete = (indices: number[]) => {
    indices.forEach((i) => {
      const inverter = config.inverters[i];
      if (inverter) removeInverter(inverter.id);
    });
  };

  const handleOpenAddSheet = () => {
    router.push('/inverter-details?mode=add');
  };

  const handleOpenEditSheet = (inverter: InverterConfig) => {
    router.push(`/inverter-details?mode=edit&inverterId=${inverter.id}`);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/upload?wizard=true');
  };

  const handleLocationSearch = useCallback((text: string) => {
    setLocationQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (text.trim().length < 2) {
      setLocationResults([]);
      return;
    }

    setIsSearching(true);
    // Debounce: 1 second (Nominatim rate limit)
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchCity(text);
        setLocationResults(results);
        setIsSearching(false);
      } catch {
        setLocationResults([]);
        setIsSearching(false);
      }
    }, 1000);
  }, []);

  const handleSelectLocation = useCallback((result: GeocodingResult) => {
    const parts = result.displayName.split(', ');
    const shortName = parts.slice(0, 2).join(', ');
    updateLocation(result.latitude, result.longitude, shortName);
    setLocationQuery('');
    setLocationResults([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [updateLocation]);

  const handleDeleteInverter = useCallback((inverter: InverterConfig) => {
    removeInverter(inverter.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [removeInverter]);

  return {
    isWizardMode,
    config,
    locationQuery,
    locationResults,
    isSearching,
    updatePanelTiltAngle,
    updateRoofType,
    handleWattageChange,
    handleDelete,
    handleOpenAddSheet,
    handleOpenEditSheet,
    handleContinue,
    handleLocationSearch,
    handleSelectLocation,
    handleDeleteInverter,
  };
}
