import { useState, useCallback, useRef } from "react";
import { makeMutable, type SharedValue } from "react-native-reanimated";
import {
  type PanelState,
  findFreePosition,
  generatePanelId,
  getPanelDimensions,
  getPanelRect,
  PANEL_WIDTH,
  PANEL_HEIGHT,
} from "@/utils/panelUtils";
import { collidesWithAny } from "@/utils/collision";

export interface PanelData {
  id: string;
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation: SharedValue<0 | 90>;
}

interface UsePanelsManagerResult {
  panels: PanelData[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  addPanel: (canvasWidth: number, canvasHeight: number) => boolean;
  removePanel: (id: string) => void;
  rotatePanel: (id: string) => boolean;
  getPanelStates: () => PanelState[];
  bringToFront: (id: string) => void;
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
  const addPanel = useCallback(
    (canvasWidth: number, canvasHeight: number): boolean => {
      const states = getPanelStates();
      const position = findFreePosition(canvasWidth, canvasHeight, states);

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
  const rotatePanel = useCallback(
    (id: string): boolean => {
      const panel = panelsRef.current.find((p) => p.id === id);
      if (!panel) return false;

      const currentRotation = panel.rotation.value;
      const newRotation: 0 | 90 = currentRotation === 0 ? 90 : 0;

      // Calculate new dimensions
      const newDims = getPanelDimensions(newRotation);

      // Create test rect with new rotation
      const testRect = {
        x: panel.x.value,
        y: panel.y.value,
        width: newDims.width,
        height: newDims.height,
      };

      // Check for collisions with other panels
      const otherPanelRects = panelsRef.current
        .filter((p) => p.id !== id)
        .map((p) => ({
          ...getPanelRect({
            id: p.id,
            x: p.x.value,
            y: p.y.value,
            rotation: p.rotation.value,
          }),
          id: p.id,
        }));

      if (collidesWithAny(testRect, otherPanelRects)) {
        return false; // Rotation would cause collision
      }

      // Apply rotation
      panel.rotation.value = newRotation;
      // Force re-render by updating state
      setPanels((prev) => [...prev]);
      return true;
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
  };
}

export { PANEL_WIDTH, PANEL_HEIGHT };
