import Storage from "expo-sqlite/kv-store";

export interface StoredPanel {
  id: string;
  x: number;
  y: number;
  rotation: 0 | 90;
  inverterId: string | null;
}

interface PanelStoreData {
  panels: StoredPanel[];
  selectedId: string | null;
}

const DEFAULT_DATA: PanelStoreData = {
  panels: [],
  selectedId: null,
};

// Listeners for reactivity
type Listener = (data: PanelStoreData) => void;
const listeners = new Set<Listener>();

/**
 * Get current panel store data
 */
export function getPanelStore(): PanelStoreData {
  const stored = Storage.getItemSync("panelData");
  if (!stored) {
    return DEFAULT_DATA;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_DATA;
  }
}

/**
 * Save panel store data and notify listeners
 */
function savePanelStore(data: PanelStoreData) {
  Storage.setItemSync("panelData", JSON.stringify(data));
  // Notify all listeners
  listeners.forEach((listener) => listener(data));
}

/**
 * Subscribe to panel store changes
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Get all panels
 */
export function getPanels(): StoredPanel[] {
  return getPanelStore().panels;
}

/**
 * Get selected panel ID
 */
export function getSelectedId(): string | null {
  return getPanelStore().selectedId;
}

/**
 * Set selected panel ID
 */
export function setSelectedId(id: string | null) {
  const data = getPanelStore();
  savePanelStore({ ...data, selectedId: id });
}

/**
 * Save panels array
 */
export function savePanels(panels: StoredPanel[]) {
  const data = getPanelStore();
  savePanelStore({ ...data, panels });
}

/**
 * Add a panel
 */
export function addPanel(panel: StoredPanel) {
  const data = getPanelStore();
  savePanelStore({ ...data, panels: [...data.panels, panel] });
}

/**
 * Remove a panel by ID
 */
export function removePanel(id: string) {
  const data = getPanelStore();
  const panels = data.panels.filter((p) => p.id !== id);
  const selectedId = data.selectedId === id ? null : data.selectedId;
  savePanelStore({ panels, selectedId });
}

/**
 * Update a panel
 */
export function updatePanel(id: string, updates: Partial<Omit<StoredPanel, "id">>) {
  const data = getPanelStore();
  const panels = data.panels.map((p) =>
    p.id === id ? { ...p, ...updates } : p
  );
  savePanelStore({ ...data, panels });
}

/**
 * Link a panel to an inverter
 */
export function linkPanelToInverter(panelId: string, inverterId: string | null) {
  updatePanel(panelId, { inverterId });
}

/**
 * Get count of linked panels
 */
export function getLinkedCount(): number {
  const panels = getPanels();
  return panels.filter((p) => p.inverterId !== null).length;
}

/**
 * Bring a panel to front (move to end of array)
 */
export function bringPanelToFront(id: string) {
  const data = getPanelStore();
  const index = data.panels.findIndex((p) => p.id === id);
  if (index === -1 || index === data.panels.length - 1) return;

  const panel = data.panels[index];
  const panels = [
    ...data.panels.slice(0, index),
    ...data.panels.slice(index + 1),
    panel,
  ];
  savePanelStore({ ...data, panels });
}

/**
 * Clear all panels
 */
export function clearPanels() {
  savePanelStore({ panels: [], selectedId: null });
}
