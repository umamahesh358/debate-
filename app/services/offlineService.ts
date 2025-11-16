import { useState, useEffect, useCallback } from 'react';

interface OfflineStorage {
  key: string;
  data: any;
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'failed';
}

interface SyncQueue {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface OfflineState {
  isOnline: boolean;
  isOfflineMode: boolean;
  syncQueue: SyncQueue[];
  storage: OfflineStorage[];
  lastSyncTime: number;
  pendingChanges: number;
}

interface OfflineActions {
  addToSyncQueue: (item: Omit<SyncQueue, 'id'>) => void;
  removeFromSyncQueue: (id: string) => void;
  clearSyncQueue: () => void;
  addToStorage: (key: string, data: any) => void;
  getFromStorage: (key: string) => any;
  removeFromStorage: (key: string) => void;
  clearStorage: () => void;
  syncNow: () => Promise<void>;
  processSyncQueue: () => Promise<void>;
  setIsOnline: (online: boolean) => void;
  setIsOfflineMode: (offline: boolean) => void;
}

const DB_NAME = 'debate-platform-offline';
const DB_VERSION = 1;
const STORE_NAME = 'offline-data';

class OfflineService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private syncInProgress = false;

  // Initialize IndexedDB
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;

        if (!this.db.objectStoreNames.contains(STORE_NAME)) {
          const store = this.db.createObjectStore(STORE_NAME, {
            keyPath: 'key',
            autoIncrement: false
          });

          // Create indexes
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        resolve();
      };
    });

    return this.initPromise;
  }

  // Get IndexedDB store
  private getStore(): IDBObjectStore | null {
    if (!this.db) return null;
    return this.db.transaction([STORE_NAME], 'readwrite').objectStore(STORE_NAME);
  }

  // Storage operations
  async addToStorage(key: string, data: any): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const store = this.getStore();
      if (!store) {
        reject(new Error('Storage not available'));
        return;
      }

      const request = store.put({
        key,
        data,
        timestamp: Date.now(),
        syncStatus: 'pending'
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFromStorage(key: string): Promise<any> {
    await this.init();

    return new Promise((resolve, reject) => {
      const store = this.getStore();
      if (!store) {
        reject(new Error('Storage not available'));
        return;
      }

      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFromStorage(): Promise<OfflineStorage[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      const store = this.getStore();
      if (!store) {
        reject(new Error('Storage not available'));
        return;
      }

      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromStorage(key: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const store = this.getStore();
      if (!store) {
        reject(new Error('Storage not available'));
        return;
      }

      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearStorage(): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      const store = this.getStore();
      if (!store) {
        reject(new Error('Storage not available'));
        return;
      }

      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue operations
  async addToSyncQueue(item: Omit<SyncQueue, 'id'>): Promise<void> {
    const queueItem: SyncQueue = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    return new Promise((resolve, reject) => {
      const store = this.getStore();
      if (!store) {
        reject(new Error('Storage not available'));
        return;
      }

      const request = store.put({
        key: `sync_${queueItem.id}`,
        data: queueItem,
        timestamp: Date.now(),
        syncStatus: 'pending'
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncQueue[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore();
      if (!store) {
        reject(new Error('Storage not available'));
        return;
      }

      const request = store.getAll();

      request.onsuccess = () => {
        const allItems = request.result || [];
        const syncItems = allItems
          .filter((item: any) => item.key.startsWith('sync_'))
          .map((item: any) => item.data);

        resolve(syncItems);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore();
      if (!store) {
        reject(new Error('Storage not available'));
        return;
      }

      const request = store.delete(`sync_${id}`);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore();
      if (!store) {
        reject(new Error('Storage not available'));
        return;
      }

      const request = store.openCursor();
      const itemsToDelete: string[] = [];

      request.onsuccess = () => {
        const cursor = request.result;

        cursor.onsuccess = () => {
          const item = cursor.result;
          if (item && (item as any).key.startsWith('sync_')) {
            itemsToDelete.push((item as any).key);
          }

          if (cursor.continue) {
            cursor.continue();
          } else {
            // Delete all sync items
            const deleteStore = this.getStore();
            if (deleteStore) {
              let deleteCount = 0;
              const deletePromises = itemsToDelete.map(key =>
                new Promise<void>((resolveDelete) => {
                  const deleteRequest = deleteStore!.delete(key);
                  deleteRequest.onsuccess = () => {
                    deleteCount++;
                    if (deleteCount === itemsToDelete.length) {
                      resolveDelete();
                    }
                  };
                  deleteRequest.onerror = () => reject(deleteRequest.error);
                })
              );

              Promise.all(deletePromises)
                .then(() => resolve())
                .catch(reject);
            }
          }
        };

        cursor.onerror = () => reject(cursor.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Sync operations
  async syncNow(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;

    try {
      const queue = await this.getSyncQueue();
      const successful: string[] = [];
      const failed: string[] = [];

      for (const item of queue) {
        try {
          await this.executeSyncItem(item);
          successful.push(item.id);
        } catch (error) {
          console.error('Sync failed for item:', item.id, error);

          // Retry logic
          if (item.retryCount < item.maxRetries) {
            await this.updateSyncItemRetry(item.id);
          } else {
            failed.push(item.id);
          }
        }
      }

      // Clean up successful syncs
      for (const id of successful) {
        await this.removeFromSyncQueue(id);
      }

      // Mark failed items as failed
      for (const id of failed) {
        await this.updateSyncItemStatus(id, 'failed');
      }

      console.log(`Sync completed: ${successful.length} successful, ${failed.length} failed`);

    } catch (error) {
      console.error('Sync process failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async executeSyncItem(item: SyncQueue): Promise<void> {
    const { method, url, data } = item;

    // Import api dynamically to avoid circular dependency
    const { api } = await import('@/services/api');

    switch (method) {
      case 'GET':
        await api.get(url);
        break;
      case 'POST':
        await api.createDebateSession(data);
        break;
      case 'PUT':
        await api.updateDebateSession(url.split('/').pop()!, data);
        break;
      case 'DELETE':
        await api.deleteVideoUpload(url.split('/').pop()!);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  private async updateSyncItemRetry(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore();
      if (!store) {
        reject(new Error('Storage not available'));
        return;
      }

      const request = store.get(`sync_${id}`);

      request.onsuccess = () => {
        const item = request.result;
        if (item) {
          const updatedItem = {
            ...item.data,
            retryCount: item.data.retryCount + 1
          };

          const updateRequest = store.put({
            key: `sync_${id}`,
            data: updatedItem,
            timestamp: Date.now(),
            syncStatus: 'pending'
          });

          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async updateSyncItemStatus(id: string, status: 'pending' | 'synced' | 'failed'): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore();
      if (!store) {
        reject(new Error('Storage not available'));
        return;
      }

      const request = store.get(`sync_${id}`);

      request.onsuccess = () => {
        const item = request.result;
        if (item) {
          const updatedItem = {
            ...item.data,
            syncStatus: status
          };

          const updateRequest = store.put({
            key: `sync_${id}`,
            data: updatedItem,
            timestamp: Date.now()
          });

          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Auto-sync when online
  async processSyncQueue(): Promise<void> {
    if (navigator.onLine && !this.syncInProgress) {
      await this.syncNow();
    }
  }

  // Get connection status
  get isOnline(): boolean {
    return navigator.onLine;
  }

  // Get offline stats
  async getOfflineStats(): Promise<{
    storageSize: number;
    queueSize: number;
    lastSyncTime: number | null;
  }> {
    const storage = await this.getAllFromStorage();
    const queue = await this.getSyncQueue();

    return {
      storageSize: storage.length,
      queueSize: queue.length,
      lastSyncTime: queue.length > 0 ? Math.max(...queue.map(item => item.timestamp)) : null
    };
  }
}

// Create singleton instance
export const offlineService = new OfflineService();

// Hook for offline functionality
export const useOfflineMode = () => {
  const [state, setState] = useState<OfflineState>({
    isOnline: offlineService.isOnline,
    isOfflineMode: false,
    syncQueue: [],
    storage: [],
    lastSyncTime: 0,
    pendingChanges: 0
  });

  // Monitor online status
  useEffect(() => {
    const handleOnlineStatus = () => {
      const isOnline = navigator.onLine;
      setState(prev => ({
        ...prev,
        isOnline
      }));

      if (isOnline) {
        // Came back online, try to sync
        offlineService.processSyncQueue();
        setState(prev => ({
          ...prev,
          isOfflineMode: false
        }));
      } else {
        // Went offline
        setState(prev => ({
          ...prev,
          isOfflineMode: true
        }));
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await offlineService.init();
        const storage = await offlineService.getAllFromStorage();
        const queue = await offlineService.getSyncQueue();

        setState(prev => ({
          ...prev,
          storage,
          syncQueue: queue,
          lastSyncTime: queue.length > 0 ? Math.max(...queue.map(item => item.timestamp)) : 0,
          pendingChanges: storage.filter(item => item.syncStatus === 'pending').length
        }));
      } catch (error) {
        console.error('Failed to load offline data:', error);
      }
    };

    loadData();
  }, []);

  // Actions
  const actions: OfflineActions = {
    addToSyncQueue: offlineService.addToSyncQueue.bind(offlineService),
    removeFromSyncQueue: offlineService.removeFromSyncQueue.bind(offlineService),
    clearSyncQueue: offlineService.clearSyncQueue.bind(offlineService),
    addToStorage: offlineService.addToStorage.bind(offlineService),
    getFromStorage: offlineService.getFromStorage.bind(offlineService),
    removeFromStorage: offlineService.removeFromStorage.bind(offlineService),
    clearStorage: offlineService.clearStorage.bind(offlineService),
    syncNow: offlineService.syncNow.bind(offlineService),
    processSyncQueue: offlineService.processSyncQueue.bind(offlineService),
    setIsOnline: (online: boolean) => setState(prev => ({ ...prev, isOnline: online })),
    setIsOfflineMode: (offline: boolean) => setState(prev => ({ ...prev, isOfflineMode: offline }))
  };

  return {
    ...state,
    actions
  };
};