import type { Order } from '../types.js';
import { HttpError } from './http.js';
export function validId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id);
}
export function validateOrder(input: any): Order {
  const bad = () => { throw new HttpError(400, 'Invalid order'); };
  if (!input || typeof input !== 'object' || Array.isArray(input) || !validId(input.id)) bad();
  if (Buffer.byteLength(JSON.stringify(input)) > 2 * 1024 * 1024) throw new HttpError(413, 'Order too large');
  const text = (name: string, max: number, optional = false) => {
    const value = input[name];
    if (optional && value === undefined) return undefined;
    if (typeof value !== 'string' || value.length > max) bad();
    return value;
  };
  for (const field of ['orderDate', 'deliveryDateTime']) if (!Number.isFinite(Date.parse(text(field, 64)))) bad();
  for (const field of ['guestsCount', 'totalItems', 'revision'])
    if (!Number.isSafeInteger(input[field]) || input[field] < 0 || input[field] > 1000000000) bad();
  if (input.amount !== undefined && (!Number.isFinite(input.amount) || input.amount < 0 || input.amount > 1e9)) bad();
  if (!['NEW','IN_PROGRESS','DONE','CANCELLED'].includes(input.status) || !['DE','EN','RU'].includes(input.language) || !['high','medium','low'].includes(input.confidence)) bad();
  const items: any = {};
  for (const field of ['dishes','drinks','service']) {
    const arr = input.items?.[field];
    if (!Array.isArray(arr) || arr.length > 500 || arr.some(x => typeof x !== 'string' || x.length > 2000)) bad();
    items[field] = arr;
  }
  // Allowlist only order fields. Ownership and sync state can never be supplied.
  return {
    id: input.id, clientName: text('clientName', 300), orderDate: input.orderDate,
    deliveryDateTime: input.deliveryDateTime, guestsCount: input.guestsCount,
    totalItems: input.totalItems, revision: input.revision, items, status: input.status,
    language: input.language, confidence: input.confidence, amount: input.amount,
    menuType: text('menuType', 300), transcription: text('transcription', 50000),
    notes: text('notes', 50000, true), discounts: text('discounts', 2000, true),
    orderNumber: text('orderNumber', 200, true), tableNumber: text('tableNumber', 200, true),
    originalImage: text('originalImage', 2000000, true),
  };
}
