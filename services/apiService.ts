import type { Order } from '../types';
import { accountFetch, AccountScope } from './accountScope';
export async function request<T>(scope: AccountScope, path: string, options: RequestInit = {}): Promise<T> {
  const res = await accountFetch(scope, `/api${path}`, options);
  if (!res.ok) {
    const error = new Error((await res.json().catch(() => ({}))).error ?? `Request failed (${res.status})`);
    Object.assign(error, { status: res.status });
    throw error;
  }
  return res.json();
}
export const loadOrdersFromServer = (scope: AccountScope) => request<Order[]>(scope, '/orders');
export const saveOrderOnServer = (scope: AccountScope, order: Order, exists: boolean) => request<Order>(scope,
  exists ? `/orders/${encodeURIComponent(order.id)}` : '/orders', {
    method: exists ? 'PUT' : 'POST', body: JSON.stringify(order),
  });
export const deleteOrderFromServer = (scope: AccountScope, id: string, revision: number) =>
  request<{ deleted: string }>(scope, `/orders/${encodeURIComponent(id)}`, { method: 'DELETE', body: JSON.stringify({ revision }) });
