import type { Order } from '../types';
import type { AccountScope } from './accountScope';
import type { LocalStore } from './storageService';
import { loadOrdersFromServer, saveOrderOnServer } from './apiService';
export type SyncOutcomeStatus = 'ok' | 'partial' | 'unavailable' | 'offline' | 'busy' | 'guest';
export interface SyncOutcome { status: SyncOutcomeStatus; message?: string }
export function createSyncEngine(scope: AccountScope, storage: LocalStore) {
  let busy = false;
  return async (onOrders: (orders: Order[]) => void, onBusy?: (value: boolean) => void): Promise<SyncOutcome> => {
    if (!scope.active() || !scope.userId) return { status: 'guest' };
    if (!navigator.onLine) return { status: 'offline' };
    if (busy) return { status: 'busy' };
    busy = true; onBusy?.(true);
    const version = storage.version();
    const current = () => scope.active() && storage.version() === version;
    try {
      const local = await storage.loadOrdersLocal();
      const remote = await loadOrdersFromServer(scope);
      if (!current()) return { status: 'busy' };
      const merged = new Map<string, Order>(remote.map(order => [order.id, { ...order, syncStatus: 'synced' as const, lastSyncedAt: Date.now() }]));
      let failed = false;
      for (const order of local) {
        if (!current()) return { status: 'busy' };
        if (order.syncStatus === 'synced') continue; // remote deletion is authoritative
        const server = merged.get(order.id);
        if (order.conflict || (server && server.revision !== order.revision) || (!server && order.lastSyncedAt)) {
          merged.set(order.id, { ...order, syncStatus: 'error', conflict: true, syncError: 'Conflict: keep local draft for review' });
          failed = true; continue;
        }
        try {
          const saved = await saveOrderOnServer(scope, { ...order, revision: server ? order.revision + 1 : 1 }, !!server);
          merged.set(order.id, { ...saved, syncStatus: 'synced', lastSyncedAt: Date.now() });
        } catch {
          merged.set(order.id, { ...order, syncStatus: 'error', syncError: 'Not saved to server' }); failed = true;
        }
      }
      if (!current()) return { status: 'busy' };
      const orders = [...merged.values()];
      if (!await storage.saveOrdersLocal(orders)) return { status: 'unavailable', message: 'Local storage unavailable' };
      if (scope.active()) onOrders(orders);
      return { status: failed ? 'partial' : 'ok' };
    } catch { return { status: 'unavailable', message: 'Sync unavailable; drafts remain on this device' }; }
    finally { busy = false; if (scope.active()) onBusy?.(false); }
  };
}
