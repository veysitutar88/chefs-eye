import type { Order } from '../types';
import type { AccountScope } from './accountScope';
const volatileDrafts = new Map<string, Order[]>();
export const ordersKey = (user: string | null) => `ce:v2:${user ?? 'guest'}:orders`;
export function createStorage(scope: AccountScope) {
  const key = ordersKey(scope.userId);
  const dbName = `ce-images-v2-${scope.userId ?? 'guest'}`;
  let version = 0;
  async function imageTransaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const open = indexedDB.open(dbName, 1);
      open.onupgradeneeded = () => open.result.createObjectStore('images');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction('images', mode);
        const request = action(tx.objectStore('images'));
        tx.oncomplete = () => { db.close(); resolve(request.result); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      };
    });
  }
  const loadImage = (id: string) => imageTransaction('readonly', store => store.get(id));
  return {
    version: () => version,
    touch: () => { version++; },
    async saveOrdersLocal(orders: Order[]) {
      if (!scope.active()) return false;
      const ticket = ++version;
      volatileDrafts.set(key, orders);
      // Preserve the complete draft first. Never drop an image if IndexedDB fails.
      try {
        const stripped = await Promise.all(orders.map(async order => {
          if (!order.originalImage) return order;
          await imageTransaction('readwrite', store => store.put(order.originalImage, order.id));
          return { ...order, originalImage: undefined };
        }));
        if (!scope.active() || version !== ticket) return false;
        localStorage.setItem(key, JSON.stringify(stripped));
        volatileDrafts.delete(key);
        return true;
      } catch {
        if (!scope.active() || version !== ticket) return false;
        try { localStorage.setItem(key, JSON.stringify(orders)); volatileDrafts.delete(key); return true; } catch { return false; }
      }
    },
    async loadOrdersLocal(hydrate = true): Promise<Order[]> {
      if (!scope.active()) return [];
      if (volatileDrafts.has(key)) return volatileDrafts.get(key)!;
      const raw = localStorage.getItem(key);
      const orders: Order[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(orders)) throw new Error('Invalid local drafts');
      if (!hydrate) return orders;
      return Promise.all(orders.map(async o => ({ ...o, originalImage: o.originalImage ?? await loadImage(o.id).catch(() => undefined) })));
    },
    loadImage,
  };
}
export type LocalStore = ReturnType<typeof createStorage>;
