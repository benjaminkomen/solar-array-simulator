import { useState, useCallback, useRef } from "react";
import { makeMutable, type SharedValue } from "react-native-reanimated";
import {
  type PanelState,
  findFreePosition,
  findValidPositionAfterRotation,
  generatePanelId,
  PANEL_WIDTH,
  PANEL_HEIGHT,
} from "@/utils/panelUtils";

export interface PanelData {
  id: string;
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation: SharedValue<0 | 90>;
}

interface InitialPanelPosition {
  x: number;
  y: number;
  rotation: 0 | 90;
}

interface UsePanelsManagerResult {
  panels: PanelData[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  addPanel: (canvasWidth: number, canvasHeight: number, viewportOffsetX?: number, viewportOffsetY?: number) => boolean;
  removePanel: (id: string) => void;
  rotatePanel: (id: string) => boolean;
  getPanelStates: () => PanelState[];
  bringToFront: (id: string) => void;
  initializePanels: (positions: InitialPanelPosition[]) => void;
}

export function usePanelsManager(): UsePanelsManagerResult {
  const [panels, setPanels] = useState<PanelData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const panelsRef = useRef<PanelData[]>([]);

  // Keep ref in sync for worklet access
  panelsRef.current = panels;

  // Get current panel states (for collision detection)
  const getPanelStates = useCallback((): PanelState[] => {
    return panelsRef.current.map((p) => ({
      id: p.id,
      x: p.x.value,
      y: p.y.value,
      rotation: p.rotation.value,
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
      const newPanel: PanelData = {
        id,
        x: makeMutable(position.x),
        y: makeMutable(position.y),
        rotation: makeMutable<0 | 90>(0),
      };

      setPanels((prev) => [...prev, newPanel]);
      return true;
    },
    [getPanelStates]
  );

  // Remove a panel by id
  const removePanel = useCallback(
    (id: string) => {
      setPanels((prev) => prev.filter((p) => p.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    },
    [selectedId]
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

      // Apply rotation and new position
      panel.rotation.value = newRotation;
      panel.x.value = newPosition.x;
      panel.y.value = newPosition.y;

      // Force re-render by updating state
      setPanels((prev) => [...prev]);
      return true;
    },
    [getPanelStates]
  );

  // Initialize panels at specific positions (for loading from analysis results)
  const initializePanels = useCallback(
    (positions: InitialPanelPosition[]) => {
      const newPanels: PanelData[] = positions.map((pos) => ({
        id: generatePanelId(),
        x: makeMutable(pos.x),
        y: makeMutable(pos.y),
        rotation: makeMutable<0 | 90>(pos.rotation),
      }));
      setPanels(newPanels);
      setSelectedId(null);
    },
    []
  );

  // Bring a panel to the front (move to end of array)
  const bringToFront = useCallback((id: string) => {
    setPanels((prev) => {
      const index = prev.findIndex((p) => p.id === id);
      if (index === -1 || index === prev.length - 1) return prev;
      const panel = prev[index];
      const newPanels = [...prev.slice(0, index), ...prev.slice(index + 1), panel];
      return newPanels;
    });
  }, []);

  return {
    panels,
    selectedId,
    setSelectedId,
    addPanel,
    removePanel,
    rotatePanel,
    getPanelStates,
    bringToFront,
    initializePanels,
  };
}

export { PANEL_WIDTH, PANEL_HEIGHT };
