import { Redis } from '@upstash/redis';
import type { Order } from '../types.js';
import { HttpError } from './http.js';
export const tenantKey = (user: string) => {
  if (!/^[a-f0-9-]{36}$/i.test(user)) throw new Error('Invalid identity');
  return `ce:v2:user:${user}:orders`;
};
export interface OrderStore {
  list(user: string): Promise<Order[]>;
  get(user: string, id: string): Promise<Order | null>;
  create(user: string, orders: Order[]): Promise<void>;
  update(user: string, order: Order): Promise<void>;
  remove(user: string, id: string, revision: number): Promise<void>;
  consumeAI(user: string): Promise<boolean>;
}
// One hash per verified identity. Lua makes check + write atomic, including bulk.
export const CREATE_SCRIPT = `
local orders = cjson.decode(ARGV[1])
if redis.call('HLEN', KEYS[1]) + #orders > 1000 then return 413 end
for _, raw in ipairs(orders) do
  if redis.call('HEXISTS', KEYS[1], cjson.decode(raw).id) == 1 then return 409 end
end
for _, raw in ipairs(orders) do redis.call('HSET', KEYS[1], cjson.decode(raw).id, raw) end
return 201`;
export const UPDATE_SCRIPT = `
local raw = redis.call('HGET', KEYS[1], ARGV[1])
if not raw then return 404 end
local current = cjson.decode(raw)
local incoming = cjson.decode(ARGV[2])
if incoming.revision ~= current.revision + 1 then return 409 end
redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
return 200`;
export const DELETE_SCRIPT = `
local raw = redis.call('HGET', KEYS[1], ARGV[1])
if not raw then return 404 end
if cjson.decode(raw).revision ~= tonumber(ARGV[2]) then return 409 end
redis.call('HDEL', KEYS[1], ARGV[1])
return 200`;
export const RATE_SCRIPT = `
local n = redis.call('INCR', KEYS[1])
if n == 1 then redis.call('EXPIRE', KEYS[1], 60) end
return n`;
function checked(code: number) {
  if (code >= 400) throw new HttpError(code, code === 409 ? 'Revision or ID conflict' : code === 404 ? 'Order not found' : 'Order capacity exceeded');
}
export function redisStore(redis: Pick<Redis, 'hvals' | 'hget' | 'eval'>): OrderStore {
  return {
    list: user => redis.hvals(tenantKey(user)) as Promise<Order[]>,
    get: (user, id) => redis.hget<Order>(tenantKey(user), id),
    async create(user, orders) { checked(Number(await redis.eval(CREATE_SCRIPT, [tenantKey(user)], [JSON.stringify(orders.map(order => JSON.stringify(order)))]))); },
    async update(user, order) { checked(Number(await redis.eval(UPDATE_SCRIPT, [tenantKey(user)], [order.id, JSON.stringify(order)]))); },
    async remove(user, id, revision) { checked(Number(await redis.eval(DELETE_SCRIPT, [tenantKey(user)], [id, revision]))); },
    async consumeAI(user) { return Number(await redis.eval(RATE_SCRIPT, [tenantKey(user) + ':ai-rate'], [])) <= 10; },
  };
}
export function getStore(): OrderStore {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) throw new HttpError(503, 'Order storage not configured');
  return redisStore(new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN, retry: false }));
}
