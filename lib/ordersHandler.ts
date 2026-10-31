import { getStore, OrderStore } from './data.js';
import { requireUser, VerifyToken } from './auth.js';
import { ApiRequest, ApiResponse, HttpError, fail, privateResponse } from './http.js';
import { validId, validateOrder } from './orderValidation.js';
export function ordersHandler(kind: 'collection' | 'item' | 'bulk', deps: { verify?: VerifyToken; store?: () => OrderStore; origin?: string } = {}) {
  return async (req: ApiRequest, res: ApiResponse) => {
    privateResponse(res);
    try {
      const user = await requireUser(req, deps.verify, deps.origin);
      const store = (deps.store ?? getStore)();
      if (kind === 'collection' && req.method === 'GET') return res.json(await store.list(user));
      if ((kind === 'collection' || kind === 'bulk') && req.method === 'POST') {
        const inputs = kind === 'bulk' ? req.body?.orders : [req.body];
        if (!Array.isArray(inputs) || inputs.length < 1 || inputs.length > 100) throw new HttpError(400, 'Expected 1–100 orders');
        if (Buffer.byteLength(JSON.stringify(inputs)) > 4 * 1024 * 1024) throw new HttpError(413, 'Request too large');
        const orders = inputs.map(input => ({ ...validateOrder(input), revision: 1, lastModified: Date.now() }));
        if (new Set(orders.map(o => o.id)).size !== orders.length) throw new HttpError(400, 'Duplicate order IDs');
        await store.create(user, orders);
        return res.status(201).json(kind === 'bulk' ? { saved: orders.length, orders } : orders[0]);
      }
      if (kind === 'item') {
        const id = req.query?.id;
        if (!validId(id)) throw new HttpError(400, 'Invalid order ID');
        if (req.method === 'GET') {
          const order = await store.get(user, id);
          if (!order) throw new HttpError(404, 'Order not found');
          return res.json(order);
        }
        if (req.method === 'PUT') {
          if (req.body?.id !== id) throw new HttpError(400, 'ID mismatch');
          const order = { ...validateOrder(req.body), lastModified: Date.now() };
          await store.update(user, order);
          return res.json(order);
        }
        if (req.method === 'DELETE') {
          const revision = req.body?.revision;
          if (!Number.isSafeInteger(revision) || revision < 1) throw new HttpError(400, 'Revision required');
          await store.remove(user, id, revision);
          return res.json({ deleted: id });
        }
      }
      throw new HttpError(405, 'Method not allowed');
    } catch (error) { return fail(res, error); }
  };
}
