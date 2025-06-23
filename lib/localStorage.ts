// LocalStorage utility functions for PWA
export interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiry?: number;
}

class LocalStorageService {
  // Set item with optional expiry (in milliseconds)
  setItem<T>(key: string, value: T, expiry?: number): void {
    try {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        expiry: expiry ? Date.now() + expiry : undefined
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  // Get item with expiry check
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsedItem: StorageItem<T> = JSON.parse(item);
      
      // Check if item has expired
      if (parsedItem.expiry && Date.now() > parsedItem.expiry) {
        this.removeItem(key);
        return null;
      }

      return parsedItem.value;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  // Remove item
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  // Clear all items
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  // Get all keys
  getAllKeys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  }

  // Check if localStorage is available
  isAvailable(): boolean {
    try {
      const test = 'localStorage-test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Sync data (for PWA offline functionality)
  syncData<T>(key: string, serverData: T): void {
    const localData = this.getItem<T>(key);
    if (!localData) {
      this.setItem(key, serverData);
    }
  }

  // Get storage usage
  getStorageSize(): number {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }
}

export const localStorageService = new LocalStorageService();
