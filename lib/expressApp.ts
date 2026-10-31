import express from 'express';
import { ordersHandler } from './ordersHandler.js';
import { createGeminiHandler } from '../api/gemini/parse.js';
import callback from '../api/auth/callback.js';
import type { VerifyToken } from './auth.js';
import type { OrderStore } from './data.js';
export function createApiApp(deps: { verify?: VerifyToken; store?: () => OrderStore; origin?: string; fetch?: typeof fetch } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '4mb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.all('/api/orders/bulk', ordersHandler('bulk', deps));
  app.all('/api/orders', ordersHandler('collection', deps));
  app.all('/api/orders/:id', (req, res) => ordersHandler('item', deps)({
    method: req.method, headers: req.headers, body: req.body, query: { id: req.params.id },
  }, res));
  app.all('/api/gemini/parse', createGeminiHandler(deps));
  app.all(['/auth/callback', '/api/auth/callback'], callback);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(err.type === 'entity.too.large' ? 413 : 400).json({ error: 'Invalid request body' });
  });
  return app;
}
