import { ApiRequest, ApiResponse, fail, privateResponse, HttpError } from '../../lib/http.js';
import { requireUser, VerifyToken } from '../../lib/auth.js';
import { getStore, OrderStore } from '../../lib/data.js';

// Allowlist of model IDs accepted by this proxy.
// Prevents path traversal / SSRF via the model URL segment.
const ALLOWED_MODELS = new Set([
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-pro-exp-03-25',
  'gemini-2.5-pro-preview-03-25',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
]);

const MAX_BODY_BYTES = 4 * 1024 * 1024; // 10 MB — matches Express dev server

// POST /api/gemini/parse — server-side Gemini proxy.
// Keeps GEMINI_API_KEY on the server; never exposed to the browser.
export function createGeminiHandler(deps: { verify?: VerifyToken; store?: () => OrderStore; fetch?: typeof fetch; origin?: string } = {}) {
return async function handler(req: ApiRequest, res: ApiResponse) {
  privateResponse(res);
  let user: string;
  try { user = await requireUser(req, deps.verify, deps.origin); } catch (error) { return fail(res, error); }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI parsing not configured' });
  }

  // Basic body-size guard
  const bodyStr = JSON.stringify(req.body ?? {});
  if (Buffer.byteLength(bodyStr) > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Request body too large' });
  }

  const { model, contents, config } = req.body ?? {};

  // Validate required fields
  if (!model || !contents) {
    return res.status(400).json({ error: 'Missing required fields: model, contents' });
  }

  // Validate model against allowlist (prevents path traversal / SSRF)
  if (typeof model !== 'string' || !ALLOWED_MODELS.has(model)) {
    return res.status(400).json({ error: `Unsupported model: ${model}` });
  }

  try {
    if (!await (deps.store ?? getStore)().consumeAI(user)) throw new HttpError(429, 'Please try again later');
  } catch (error) { return fail(res, error); }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000); // 30 s timeout

  try {
    const geminiRes = await (deps.fetch ?? fetch)(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({ contents, generationConfig: config }),
        signal: controller.signal,
      }
    );

    const data = await geminiRes.json();
    if (!geminiRes.ok) {
      return res.status(502).json({ error: 'AI provider unavailable' });
    }

    res.json(data);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Gemini API request timed out' });
    }
    // Don't leak internal error details to the client

    res.status(500).json({ error: 'Internal server error' });
  } finally {
    clearTimeout(timeout);
  }
}

}
export default createGeminiHandler();
