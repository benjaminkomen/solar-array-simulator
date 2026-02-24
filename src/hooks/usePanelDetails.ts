/**
 * Business logic for the Panel Details screen.
 * Handles panel store subscription, inverter linking/unlinking.
 */
import { useCallback, useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useConfigStore } from '@/hooks/useConfigStore';
import { usePanelsContext } from '@/contexts/PanelsContext';
import { getPanelStore, subscribe } from '@/utils/panelStore';

export function usePanelDetails() {
  const { panelId, mode } = useLocalSearchParams<{
    panelId: string;
    mode?: 'edit' | 'view';
  }>();
  const isViewMode = mode === 'view';

  const { config } = useConfigStore();
  const { linkInverter } = usePanelsContext();
  const router = useRouter();

  // Read from store instead of SharedValues
  const [storeData, setStoreData] = useState(() => getPanelStore());

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      setStoreData(data);
    });
    return unsubscribe;
  }, []);

  // Get current panel and its linked inverter
  const selectedPanel = storeData.panels.find(p => p.id === panelId);
  const currentInverterId = selectedPanel?.inverterId ?? null;
  const currentInverter = config.inverters.find(
    inv => inv.id === currentInverterId
  );

  // Get list of available (unassigned) inverters (only needed in edit mode)
  const assignedInverterIds = new Set(
    storeData.panels.map(p => p.inverterId).filter(Boolean)
  );
  const availableInverters = config.inverters.filter(
    inv => !assignedInverterIds.has(inv.id)
  );

  const handleLink = useCallback((inverterId: string) => {
    if (panelId) {
      linkInverter(panelId, inverterId);
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
      router.back();
    }
  }, [panelId, linkInverter, router]);

  const handleUnlink = useCallback(() => {
    if (panelId) {
      linkInverter(panelId, null);
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );
      router.back();
    }
  }, [panelId, linkInverter, router]);

  return {
    panelId,
    isViewMode,
    currentInverter,
    availableInverters,
    handleLink,
    handleUnlink,
  };
}
