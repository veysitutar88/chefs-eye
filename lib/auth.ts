import { createClient } from '@supabase/supabase-js';
import { ApiRequest, HttpError } from './http.js';
export interface Identity { id: string; email?: string; email_confirmed_at?: string; is_anonymous?: boolean }
export type VerifyToken = (token: string) => Promise<Identity | null>;
export const verifyToken: VerifyToken = async token => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new HttpError(503, 'Authentication not configured');
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(10000) }) },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error) {
    if (!error.status || error.status >= 500) throw new HttpError(503, 'Authentication unavailable');
    return null;
  }
  return data.user;
};
export async function requireUser(req: ApiRequest, verify: VerifyToken = verifyToken, origin = process.env.APP_ORIGIN) {
  const authorization = req.headers.authorization;
  if (typeof authorization !== 'string' || !/^Bearer [^\s]{1,8192}$/.test(authorization))
    throw new HttpError(401, 'Sign in required');
  // No cookie authentication and no cross-origin CORS grants. Do not trust Host.
  const requestOrigin = req.headers.origin;
  if (requestOrigin && (!origin || requestOrigin !== origin)) throw new HttpError(403, 'Origin not allowed');
  const user = await verify(authorization.slice(7));
  if (!user || !/^[a-f0-9-]{36}$/i.test(user.id) || user.is_anonymous || !user.email || !user.email_confirmed_at)
    throw new HttpError(401, 'Sign in required');
  return user.id;
}
