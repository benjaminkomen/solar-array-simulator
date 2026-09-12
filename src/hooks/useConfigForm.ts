/**
 * Business logic for the Config screen.
 * Handles location search, inverter management, and form state.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useConfigStore } from '@/hooks/useConfigStore';
import type { InverterConfig, RoofType } from '@/utils/configStore';
import { searchCity, type GeocodingResult } from "@/utils/geocoding";
import { inverterEditPath } from "@/utils/detailsReachability";

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
  const isMounted = useRef(true);

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
    // navigate (not push) so a tap after Save re-presents the same sheet
    // if the formSheet dismiss is still on the stack.
    router.navigate(inverterEditPath(inverter.id));
  };

  const handleContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/upload?wizard=true');
  }, [router]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const handleLocationSearch = useCallback((text: string) => {
    setLocationQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (text.trim().length < 2) {
      setLocationResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    // Debounce: 1 second (Nominatim rate limit)
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchCity(text);
        if (!isMounted.current) return;
        setLocationResults(results);
        setIsSearching(false);
      } catch {
        if (!isMounted.current) return;
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
