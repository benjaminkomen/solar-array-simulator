/**
 * Business logic for the Inverter Details screen.
 * Handles add/edit mode, form state, and save/cancel actions.
 */
import { useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useConfigStore } from '@/hooks/useConfigStore';
import { generateSerialNumber } from '@/utils/formatters';

export function useInverterForm() {
  const { mode, inverterId } = useLocalSearchParams<{
    mode: 'add' | 'edit';
    inverterId?: string;
  }>();
  const isAddMode = mode === 'add';
  const router = useRouter();

  const {
    config,
    addInverterWithDetails,
    updateInverterSerialNumber,
    updateInverterEfficiency,
  } = useConfigStore();

  // Find existing inverter for edit mode
  const existingInverter =
    !isAddMode && inverterId
      ? config.inverters.find((inv) => inv.id === inverterId)
      : null;

  // Local state for form fields
  const [serial, setSerial] = useState(() =>
    isAddMode ? generateSerialNumber() : existingInverter?.serialNumber ?? ''
  );
  const [efficiency, setEfficiency] = useState(() =>
    isAddMode ? 95 : existingInverter?.efficiency ?? 95
  );

  // Handle save action
  const handleSave = useCallback(() => {
    if (isAddMode) {
      addInverterWithDetails(serial, efficiency);
    } else if (inverterId) {
      updateInverterSerialNumber(inverterId, serial);
      updateInverterEfficiency(inverterId, efficiency);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [
    isAddMode,
    serial,
    efficiency,
    inverterId,
    addInverterWithDetails,
    updateInverterSerialNumber,
    updateInverterEfficiency,
    router,
  ]);

  // Handle cancel action
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return {
    isAddMode,
    serial,
    setSerial,
    efficiency,
    setEfficiency,
    handleSave,
    handleCancel,
  };
}
