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

const STORAGE_KEY = "panelData";

// In-memory cache (matches configStore pattern)
let currentData: PanelStoreData = DEFAULT_DATA;
const listeners = new Set<(data: PanelStoreData) => void>();

function loadData(): void {
  try {
    const stored = Storage.getItemSync(STORAGE_KEY);
    if (stored) {
      currentData = JSON.parse(stored);
    } else {
      currentData = { ...DEFAULT_DATA };
    }
  } catch {
    currentData = { ...DEFAULT_DATA };
  }
}

function saveData(): void {
  try {
    Storage.setItemSync(STORAGE_KEY, JSON.stringify(currentData));
  } catch (error) {
    console.error("Failed to save panel data:", error);
  }
}

function updateData(data: PanelStoreData): void {
  currentData = data;
  saveData();
  listeners.forEach((listener) => listener(currentData));
}

export function getPanelStore(): PanelStoreData {
  return currentData;
}

export function subscribe(listener: (data: PanelStoreData) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPanels(): StoredPanel[] {
  return currentData.panels;
}

export function getSelectedId(): string | null {
  return currentData.selectedId;
}

export function setSelectedId(id: string | null) {
  updateData({ ...currentData, selectedId: id });
}

export function savePanels(panels: StoredPanel[]) {
  updateData({ ...currentData, panels });
}

export function addPanel(panel: StoredPanel) {
  updateData({ ...currentData, panels: [...currentData.panels, panel] });
}

export function removePanel(id: string) {
  const panels = currentData.panels.filter((p) => p.id !== id);
  const selectedId = currentData.selectedId === id ? null : currentData.selectedId;
  updateData({ panels, selectedId });
}

export function updatePanel(id: string, updates: Partial<Omit<StoredPanel, "id">>) {
  const panels = currentData.panels.map((p) =>
    p.id === id ? { ...p, ...updates } : p
  );
  updateData({ ...currentData, panels });
}

export function linkPanelToInverter(panelId: string, inverterId: string | null) {
  updatePanel(panelId, { inverterId });
}

export function getLinkedCount(): number {
  return currentData.panels.filter((p) => p.inverterId !== null).length;
}

export function bringPanelToFront(id: string) {
  const index = currentData.panels.findIndex((p) => p.id === id);
  if (index === -1 || index === currentData.panels.length - 1) return;

  const panel = currentData.panels[index];
  const panels = [
    ...currentData.panels.slice(0, index),
    ...currentData.panels.slice(index + 1),
    panel,
  ];
  updateData({ ...currentData, panels });
}

export function clearPanels() {
  updateData({ panels: [], selectedId: null });
}

// Initialize store on module load
loadData();
