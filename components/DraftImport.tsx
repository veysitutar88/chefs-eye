import React, { useState } from 'react';
import type { AccountScope } from '../services/accountScope';
import { createAccountScope } from '../services/accountScope';
import { createStorage } from '../services/storageService';
import type { Order } from '../types';
export const copyDrafts = (drafts: Order[], id = () => crypto.randomUUID()): Order[] => drafts.map(order => ({
  ...order, id: id(), revision: 1, syncStatus: 'dirty', lastSyncedAt: undefined,
  isSynced: false, conflict: false, conflictInfo: undefined, syncError: undefined,
  calendarEventIds: undefined, calendarSyncedAt: undefined, lastModified: Date.now(),
}));
export function DraftImport({ scope, onImport }: { scope: AccountScope; onImport(orders: Order[]): Promise<unknown> }) {
 const [drafts, setDrafts] = useState<Order[] | null>(null);
 const [selected, setSelected] = useState<Set<number>>(new Set());
 const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
 async function review() {
  try {
   const guest = createAccountScope(null, async () => '', () => {});
   const local = await createStorage(guest.scope).loadOrdersLocal(); guest.stop();
   // Legacy browser records are inspected only after an explicit review action.
   // They are never fetched from global Redis or the original server JSON file.
   const legacy = JSON.parse(localStorage.getItem('chef_orders') || '[]');
   if (!Array.isArray(legacy)) throw new Error();
   if (!scope.active()) return;
   setDrafts([...local, ...legacy]); setSelected(new Set());
  } catch { setError('Could not read local drafts / Lokale Entwürfe nicht lesbar / Не удалось прочитать черновики'); }
 }
 return <section className="mb-3 text-sm">
  <button className="border rounded p-2" onClick={review}>Review local drafts / Lokale Entwürfe prüfen / Проверить черновики</button>
  {drafts && <div className="border rounded p-3 space-y-2">
   <p>Choose drafts to copy to this account. Originals remain on this device. / Entwürfe für dieses Konto auswählen. / Выберите черновики для этого аккаунта.</p>
   {drafts.length === 0 && <p>No local drafts / Keine lokalen Entwürfe / Нет черновиков</p>}
   <div className="max-h-48 overflow-auto">{drafts.map((o, i) => <label key={i} className="block"><input type="checkbox" checked={selected.has(i)} onChange={() => setSelected(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; })} /> {o.clientName} — {o.deliveryDateTime} — {o.items?.dishes?.join(', ')}</label>)}</div>
   <button className="border rounded p-2" disabled={busy || selected.size === 0} onClick={async () => {
    if (!scope.active()) return; setBusy(true);
    try { await onImport(copyDrafts(drafts.filter((_, i) => selected.has(i)))); if (scope.active()) setDrafts(null); }
    catch { setError('Import failed; originals retained'); } finally { setBusy(false); }
   }}>Import selected / Auswahl importieren / Импортировать выбранное</button>
   <button className="p-2" onClick={() => setDrafts(null)}>Close / Schließen / Закрыть</button>
  </div>}
  {error && <p role="alert">{error}</p>}
 </section>;
}
