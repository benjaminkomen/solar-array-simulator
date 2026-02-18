import Storage from './storage';

export interface InverterConfig {
  id: string;
  serialNumber: string; // 8-digit serial number (displayed as XXXX-XXXX)
  efficiency: number; // 0-100 percentage
}

/**
 * Generate an 8-digit random serial number
 */
function generateSerialNumber(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export type RoofType = 'flat' | 'gable' | 'hip' | 'shed';

export interface SystemConfig {
  defaultMaxWattage: number;
  inverters: InverterConfig[];
  wizardCompleted: boolean;
  compassDirection: number; // 0-360 degrees, 0 = North
  latitude: number | null;
  longitude: number | null;
  locationName: string | null; // e.g. "Amsterdam, Netherlands"
  panelTiltAngle: number; // degrees from horizontal, default 30
  roofType: RoofType;
}

// Default configuration: 14 inverters with realistic efficiency distribution
const DEFAULT_CONFIG: SystemConfig = {
  defaultMaxWattage: 430,
  wizardCompleted: false,
  compassDirection: 0, // Default to North
  latitude: null,
  longitude: null,
  locationName: null,
  panelTiltAngle: 30,
  roofType: 'gable',
  inverters: [
    // 7 inverters at 95% (optimal)
    { id: '1', serialNumber: generateSerialNumber(), efficiency: 95 },
    { id: '2', serialNumber: generateSerialNumber(), efficiency: 95 },
    { id: '3', serialNumber: generateSerialNumber(), efficiency: 95 },
    { id: '4', serialNumber: generateSerialNumber(), efficiency: 95 },
    { id: '5', serialNumber: generateSerialNumber(), efficiency: 95 },
    { id: '6', serialNumber: generateSerialNumber(), efficiency: 95 },
    { id: '7', serialNumber: generateSerialNumber(), efficiency: 95 },
    // 3 inverters at 60-80% (partial shading)
    { id: '8', serialNumber: generateSerialNumber(), efficiency: 75 },
    { id: '9', serialNumber: generateSerialNumber(), efficiency: 68 },
    { id: '10', serialNumber: generateSerialNumber(), efficiency: 62 },
    // 2 inverters at 0-25% (heavily obstructed)
    { id: '11', serialNumber: generateSerialNumber(), efficiency: 20 },
    { id: '12', serialNumber: generateSerialNumber(), efficiency: 15 },
    // 2 inverters at 0% (non-functional)
    { id: '13', serialNumber: generateSerialNumber(), efficiency: 0 },
    { id: '14', serialNumber: generateSerialNumber(), efficiency: 0 },
  ],
};

const STORAGE_KEY = '@config/system';

// In-memory state
let currentConfig: SystemConfig = DEFAULT_CONFIG;
let listeners: ((config: SystemConfig) => void)[] = [];

/**
 * Load configuration from storage synchronously on module initialization
 */
function loadConfig(): void {
  try {
    const stored = Storage.getItemSync(STORAGE_KEY);
    if (stored) {
      currentConfig = JSON.parse(stored);
      // Migrate: ensure all inverters have serial numbers
      let needsSave = false;
      for (const inverter of currentConfig.inverters) {
        if (!inverter.serialNumber) {
          inverter.serialNumber = generateSerialNumber();
          needsSave = true;
        }
      }
      // Migrate: ensure wizardCompleted field exists
      if (currentConfig.wizardCompleted === undefined) {
        currentConfig.wizardCompleted = false;
        needsSave = true;
      }
      // Migrate: ensure compassDirection field exists
      if (currentConfig.compassDirection === undefined) {
        currentConfig.compassDirection = 0;
        needsSave = true;
      }
      // Migrate: ensure location and simulation fields exist
      if (currentConfig.latitude === undefined) {
        currentConfig.latitude = null;
        currentConfig.longitude = null;
        currentConfig.locationName = null;
        needsSave = true;
      }
      if (currentConfig.panelTiltAngle === undefined) {
        currentConfig.panelTiltAngle = 30;
        needsSave = true;
      }
      if (currentConfig.roofType === undefined) {
        currentConfig.roofType = 'gable';
        needsSave = true;
      }
      if (needsSave) {
        saveConfig();
      }
    } else {
      currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      saveConfig();
    }
  } catch (error) {
    console.error('Failed to load config:', error);
    currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
}

/**
 * Save configuration to storage synchronously
 */
function saveConfig(): void {
  try {
    Storage.setItemSync(STORAGE_KEY, JSON.stringify(currentConfig));
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

/**
 * Get current configuration
 */
export function getConfig(): SystemConfig {
  return JSON.parse(JSON.stringify(currentConfig));
}

/**
 * Update configuration and notify listeners
 */
function updateConfig(newConfig: SystemConfig): void {
  currentConfig = newConfig;
  saveConfig();
  notifyListeners();
}

/**
 * Update default wattage
 */
export function updateDefaultWattage(wattage: number): void {
  const newConfig = getConfig();
  newConfig.defaultMaxWattage = Math.max(1, wattage); // Ensure positive
  updateConfig(newConfig);
}

/**
 * Update inverter efficiency by ID
 */
export function updateInverterEfficiency(inverterId: string, efficiency: number): void {
  const newConfig = getConfig();
  const inverter = newConfig.inverters.find((inv) => inv.id === inverterId);
  if (inverter) {
    inverter.efficiency = Math.max(0, Math.min(100, efficiency)); // Clamp 0-100
    updateConfig(newConfig);
  }
}

/**
 * Update inverter serial number by ID
 */
export function updateInverterSerialNumber(inverterId: string, serialNumber: string): void {
  const newConfig = getConfig();
  const inverter = newConfig.inverters.find((inv) => inv.id === inverterId);
  if (inverter) {
    inverter.serialNumber = serialNumber;
    updateConfig(newConfig);
  }
}

/**
 * Add new inverter with custom serial number and efficiency
 */
export function addInverterWithDetails(serialNumber: string, efficiency: number): void {
  const newConfig = getConfig();
  const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  newConfig.inverters.push({
    id: newId,
    serialNumber,
    efficiency: Math.max(0, Math.min(100, efficiency)),
  });
  updateConfig(newConfig);
}

/**
 * Remove inverter by ID
 */
export function removeInverter(inverterId: string): void {
  const newConfig = getConfig();
  newConfig.inverters = newConfig.inverters.filter((inv) => inv.id !== inverterId);
  updateConfig(newConfig);
}

/**
 * Get wizard completed status
 */
export function getWizardCompleted(): boolean {
  return currentConfig.wizardCompleted;
}

/**
 * Set wizard completed status
 */
export function setWizardCompleted(completed: boolean): void {
  const newConfig = getConfig();
  newConfig.wizardCompleted = completed;
  updateConfig(newConfig);
}

/**
 * Update compass direction (0-360 degrees, 0 = North)
 */
export function updateCompassDirection(degrees: number): void {
  const newConfig = getConfig();
  newConfig.compassDirection = ((degrees % 360) + 360) % 360; // Normalize to 0-359
  updateConfig(newConfig);
}

/**
 * Update location (latitude, longitude, display name)
 */
export function updateLocation(lat: number, lon: number, name: string): void {
  const newConfig = getConfig();
  newConfig.latitude = lat;
  newConfig.longitude = lon;
  newConfig.locationName = name;
  updateConfig(newConfig);
}

/**
 * Update panel tilt angle (0-90 degrees from horizontal)
 */
export function updatePanelTiltAngle(degrees: number): void {
  const newConfig = getConfig();
  newConfig.panelTiltAngle = Math.max(0, Math.min(90, degrees));
  updateConfig(newConfig);
}

/**
 * Update roof type
 */
export function updateRoofType(type: RoofType): void {
  const newConfig = getConfig();
  newConfig.roofType = type;
  updateConfig(newConfig);
}

/**
 * Reset all configuration to defaults
 */
export function resetAllData(): void {
  currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  saveConfig();
  notifyListeners();
}

/**
 * Subscribe to configuration changes
 */
export function subscribe(listener: (config: SystemConfig) => void): () => void {
  listeners.push(listener);
  // Return unsubscribe function
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

/**
 * Notify all listeners of changes
 */
function notifyListeners(): void {
  listeners.forEach((listener) => listener(getConfig()));
}

// Initialize store on module load
loadConfig();
