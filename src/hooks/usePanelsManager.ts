import {useCallback, useRef, useState, useEffect} from "react";
import {makeMutable, type SharedValue} from "react-native-reanimated";
import {
  findFreePosition,
  findValidPositionAfterRotation,
  generatePanelId,
  PANEL_HEIGHT,
  PANEL_WIDTH,
  type PanelState,
} from "@/utils/panelUtils";
import {
  getPanelStore,
  savePanels as savePanelsToStore,
  setSelectedId as setSelectedIdInStore,
  linkPanelToInverter,
  bringPanelToFront as bringToFrontInStore,
  getLinkedCount as getLinkedCountFromStore,
  updatePanel as updatePanelInStore,
  subscribe,
  type StoredPanel,
} from "@/utils/panelStore";

export interface PanelData {
  id: string;
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation: SharedValue<0 | 90>;
  inverterId: SharedValue<string | null>;
}

interface InitialPanelPosition {
  x: number;
  y: number;
  rotation: 0 | 90;
  inverterId?: string | null;
}

export interface UsePanelsManagerResult {
  panels: PanelData[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  addPanel: (canvasWidth: number, canvasHeight: number, viewportOffsetX?: number, viewportOffsetY?: number) => boolean;
  removePanel: (id: string) => void;
  rotatePanel: (id: string) => boolean;
  getPanelStates: () => PanelState[];
  bringToFront: (id: string) => void;
  initializePanels: (positions: InitialPanelPosition[]) => void;
  linkInverter: (panelId: string, inverterId: string | null) => void;
  getLinkedCount: () => number;
  savePanelPosition: (panelId: string, x: number, y: number) => void;
}

// Convert stored panel to PanelData with SharedValues
function storedPanelToPanelData(stored: StoredPanel): PanelData {
  return {
    id: stored.id,
    x: makeMutable(stored.x),
    y: makeMutable(stored.y),
    rotation: makeMutable(stored.rotation),
    inverterId: makeMutable(stored.inverterId),
  };
}

export function usePanelsManager(): UsePanelsManagerResult {
  // Initialize from store
  const [panels, setPanels] = useState<PanelData[]>(() => {
    const store = getPanelStore();
    return store.panels.map(storedPanelToPanelData);
  });

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    return getPanelStore().selectedId;
  });

  const [linkedCount, setLinkedCount] = useState<number>(() => {
    return getLinkedCountFromStore();
  });

  const panelsRef = useRef<PanelData[]>([]);

  // Keep ref in sync for worklet access
  panelsRef.current = panels;

  // Subscribe to store changes (for cross-component sync)
  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      // Reuse existing SharedValues by ID to avoid breaking gesture handlers
      setPanels((prevPanels) => {
        const panelMap = new Map(prevPanels.map((p) => [p.id, p]));
        return data.panels.map((stored) => {
          const existing = panelMap.get(stored.id);
          if (existing) {
            // Reuse SharedValues, update their values
            existing.x.value = stored.x;
            existing.y.value = stored.y;
            existing.rotation.value = stored.rotation;
            existing.inverterId.value = stored.inverterId;
            return existing;
          }
          // New panel - create fresh SharedValues
          return storedPanelToPanelData(stored);
        });
      });
      setSelectedId(data.selectedId);
      setLinkedCount(getLinkedCountFromStore());
    });
    return unsubscribe;
  }, []);

  // Get current panel states (for collision detection)
  const getPanelStates = useCallback((): PanelState[] => {
    return panelsRef.current.map((p) => ({
      id: p.id,
      x: p.x.value,
      y: p.y.value,
      rotation: p.rotation.value,
      inverterId: p.inverterId.value,
    }));
  }, []);

  // Add a new panel at a free position
  // viewportOffsetX/Y allow placing panels relative to the current viewport
  const addPanel = useCallback(
    (canvasWidth: number, canvasHeight: number, viewportOffsetX: number = 0, viewportOffsetY: number = 0): boolean => {
      const states = getPanelStates();
      const position = findFreePosition(canvasWidth, canvasHeight, states, 0, viewportOffsetX, viewportOffsetY);

      if (!position) {
        return false; // No free position available
      }

      const id = generatePanelId();
      const newStoredPanel: StoredPanel = {
        id,
        x: position.x,
        y: position.y,
        rotation: 0,
        inverterId: null,
      };

      // Save to store (will trigger subscription update)
      const store = getPanelStore();
      savePanelsToStore([...store.panels, newStoredPanel]);
      return true;
    },
    [getPanelStates]
  );

  // Remove a panel by id
  const removePanel = useCallback(
    (id: string) => {
      const store = getPanelStore();
      const panels = store.panels.filter((p) => p.id !== id);
      savePanelsToStore(panels);

      if (store.selectedId === id) {
        setSelectedIdInStore(null);
      }
    },
    []
  );

  // Rotate a panel (toggle 0 <-> 90)
  // If rotation would cause collision, find a nearby valid position
  const rotatePanel = useCallback(
    (id: string): boolean => {
      const panel = panelsRef.current.find((p) => p.id === id);
      if (!panel) return false;

      const currentRotation = panel.rotation.value;
      const newRotation: 0 | 90 = currentRotation === 0 ? 90 : 0;

      // Get all panel states for collision detection
      const allPanelStates = getPanelStates();

      // Find a valid position for the rotated panel
      const newPosition = findValidPositionAfterRotation(
        panel.x.value,
        panel.y.value,
        newRotation,
        id,
        allPanelStates
      );

      if (!newPosition) {
        return false; // No valid position found
      }

      // Update SharedValues immediately for smooth animation
      panel.rotation.value = newRotation;
      panel.x.value = newPosition.x;
      panel.y.value = newPosition.y;

      // Save to store
      const store = getPanelStore();
      const panels = store.panels.map((p) =>
        p.id === id
          ? { ...p, rotation: newRotation, x: newPosition.x, y: newPosition.y }
          : p
      );
      savePanelsToStore(panels);

      return true;
    },
    [getPanelStates]
  );

  // Initialize panels at specific positions (for loading from analysis results)
  const initializePanels = useCallback(
    (positions: InitialPanelPosition[]) => {
      const newStoredPanels: StoredPanel[] = positions.map((pos) => ({
        id: generatePanelId(),
        x: pos.x,
        y: pos.y,
        rotation: pos.rotation,
        inverterId: pos.inverterId ?? null,
      }));

      savePanelsToStore(newStoredPanels);
      setSelectedIdInStore(null);
    },
    []
  );

  // Bring a panel to the front (move to end of array)
  const bringToFront = useCallback((id: string) => {
    bringToFrontInStore(id);
  }, []);

  // Link a panel to an inverter
  const linkInverter = useCallback((panelId: string, inverterId: string | null) => {
    // Update SharedValue immediately for local responsiveness
    const panel = panelsRef.current.find((p) => p.id === panelId);
    if (panel) {
      panel.inverterId.value = inverterId;
    }

    // Save to store (will trigger subscription update)
    linkPanelToInverter(panelId, inverterId);
  }, []);

  // Get count of linked panels (returns cached state value)
  const getLinkedCount = useCallback((): number => {
    return linkedCount;
  }, [linkedCount]);

  // Save panel position to persistent storage (called after drag ends)
  const savePanelPosition = useCallback((panelId: string, x: number, y: number) => {
    updatePanelInStore(panelId, { x, y });
  }, []);

  // Update setSelectedId to use store
  const setSelectedIdWrapped = useCallback((id: string | null) => {
    setSelectedIdInStore(id);
  }, []);

  return {
    panels,
    selectedId,
    setSelectedId: setSelectedIdWrapped,
    addPanel,
    removePanel,
    rotatePanel,
    getPanelStates,
    bringToFront,
    initializePanels,
    linkInverter,
    getLinkedCount,
    savePanelPosition,
  };
}

export { PANEL_WIDTH, PANEL_HEIGHT };
