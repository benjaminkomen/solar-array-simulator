import { Platform } from 'react-native';

/**
 * Platform-aware storage abstraction
 * - Native: expo-sqlite/kv-store (synchronous SQLite)
 * - Web: localStorage (fallback for EAS Hosting builds)
 */

let Storage: {
  getItemSync: (key: string) => string | null;
  setItemSync: (key: string, value: string) => void;
};

if (Platform.OS === 'web') {
  // Web fallback using localStorage
  Storage = {
    getItemSync: (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItemSync: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    },
  };
} else {
  // Native platforms use expo-sqlite/kv-store
  const SQLiteStorage = require('expo-sqlite/kv-store').default;
  Storage = SQLiteStorage;
}

export default Storage;