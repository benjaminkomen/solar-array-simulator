import { Platform } from 'react-native';

/**
 * Platform-aware storage abstraction
 * - Native: expo-sqlite/kv-store (synchronous SQLite)
 * - Web (browser): localStorage
 * - Web (SSR): no-op (returns null for reads, ignores writes)
 */

let Storage: {
  getItemSync: (key: string) => string | null;
  setItemSync: (key: string, value: string) => void;
};

if (Platform.OS === 'web') {
  // Check if we're in a browser environment (has localStorage)
  const isServer = typeof window === 'undefined' || typeof localStorage === 'undefined';

  if (isServer) {
    // SSR mode: no-op storage (will use default values)
    Storage = {
      getItemSync: () => null,
      setItemSync: () => {}, // No-op during SSR
    };
  } else {
    // Browser mode: use localStorage
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
  }
} else {
  // Native platforms use expo-sqlite/kv-store
  const SQLiteStorage = require('expo-sqlite/kv-store').default;
  Storage = SQLiteStorage;
}

export default Storage;