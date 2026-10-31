import { restoreDOM } from './setup-dom.mjs';
import React from 'react';
import { test, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { requireUser, verifyToken } from '../lib/auth';
import { HttpError, type ApiRequest, type ApiResponse } from '../lib/http';
import { redisStore, tenantKey, getStore } from '../lib/data';
import { ordersHandler } from '../lib/ordersHandler';
import { createApiApp } from '../lib/expressApp';
import { createGeminiHandler } from '../api/gemini/parse';
import callback from '../api/auth/callback';
import { createOTPFlow } from '../services/authService';
import { createAccountScope, accountFetch } from '../services/accountScope';
import { createStorage, ordersKey } from '../services/storageService';
import { createSyncEngine } from '../services/syncEngine';
import { AccountPanel } from '../components/AccountPanel';
import { DraftImport } from '../components/DraftImport';
import type { Order } from '../types';

// No .env loading. Any accidental network request fails before leaving the process.
const originalFetch = globalThis.fetch;
const blockedFetch: typeof fetch = async () => { throw new Error('Network forbidden in offline tests'); };
globalThis.fetch = blockedFetch;
afterEach(() => { cleanup(); localStorage.clear(); globalThis.fetch = blockedFetch; });
after(() => {
  restoreDOM(); globalThis.fetch = originalFetch;
});

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const origin = 'http://localhost';
const verify = async (token: string) => token === A || token === B
  ? { id: token, email: `${token[0]}@example.test`, email_confirmed_at: '2026-10-31' } : null;
const order = (id = 'sample'): Order => ({ id, clientName: 'Fictional diner', orderDate: '2026-10-31',
  deliveryDateTime: '2026-11-01T12:00:00Z', guestsCount: 2, totalItems: 1, revision: 1,
  items: { dishes: ['Soup'], drinks: [], service: [] }, status: 'NEW', language: 'DE',
  confidence: 'high', menuType: 'Lunch', transcription: '' });
type Handler = (req: ApiRequest, res: ApiResponse) => unknown;
async function invoke(handler: Handler, method = 'GET', user: string | null = A, body?: unknown, id?: string) {
  let status = 200; let value: any; const headers: Record<string, string> = {};
  const response: ApiResponse = { status(code) { status = code; return response; },
    json(data) { value = data; return response; }, setHeader(key, val) { headers[key] = val; } };
  await handler({ method, headers: user ? { authorization: `Bearer ${user}`, origin } : {}, body, query: { id } }, response);
  return { status, body: value, headers };
}

// Execute the production Lua scripts, with only Redis commands/JSON bridged to JS.
// This catches atomic bulk/revision behavior rather than duplicating it in a fake store.
const { lua, lauxlib, lualib, to_luastring, to_jsstring } = createRequire(import.meta.url)('fengari');
function fakeRedis() {
  const hashes = new Map<string, Map<string, string>>();
  const counters = new Map<string, number>();
  const keys: string[] = [];
  const hash = (key: string) => { if (!hashes.has(key)) hashes.set(key, new Map()); return hashes.get(key)!; };
  const str = (L: any, index: number) => to_jsstring(lua.lua_tolstring(L, index));
  const push = (L: any, value: any) => {
    if (value === null || value === undefined) lua.lua_pushnil(L);
    else if (typeof value === 'string') lua.lua_pushstring(L, to_luastring(value));
    else if (typeof value === 'number') lua.lua_pushnumber(L, value);
    else if (typeof value === 'boolean') lua.lua_pushboolean(L, value);
    else {
      lua.lua_newtable(L);
      for (const [key, item] of Object.entries(value)) {
        push(L, item);
        if (Array.isArray(value)) lua.lua_rawseti(L, -2, Number(key) + 1);
        else lua.lua_setfield(L, -2, to_luastring(key));
      }
    }
  };
  return { keys, hashes,
    async hvals(key: string) { keys.push(key); return [...hash(key).values()].map(raw => JSON.parse(raw)); },
    async hget(key: string, id: string) { keys.push(key); const raw = hash(key).get(id); return raw ? JSON.parse(raw) : null; },
    async eval(script: string, scriptKeys: string[], args: unknown[]) {
      keys.push(...scriptKeys);
      const L = lauxlib.luaL_newstate(); lualib.luaL_openlibs(L);
      try {
        push(L, scriptKeys); lua.lua_setglobal(L, to_luastring('KEYS'));
        push(L, args.map(String)); lua.lua_setglobal(L, to_luastring('ARGV'));
        lua.lua_newtable(L);
        lua.lua_pushjsfunction(L, (state: any) => { push(state, JSON.parse(str(state, 1))); return 1; });
        lua.lua_setfield(L, -2, to_luastring('decode')); lua.lua_setglobal(L, to_luastring('cjson'));
        lua.lua_newtable(L);
        lua.lua_pushjsfunction(L, (state: any) => {
          const command = str(state, 1); const key = str(state, 2); let result: any;
          switch (command) {
            case 'HLEN': result = hash(key).size; break;
            case 'HEXISTS': result = hash(key).has(str(state, 3)) ? 1 : 0; break;
            case 'HGET': result = hash(key).get(str(state, 3)) ?? false; break;
            case 'HSET': hash(key).set(str(state, 3), str(state, 4)); result = 1; break;
            case 'HDEL': result = hash(key).delete(str(state, 3)) ? 1 : 0; break;
            case 'INCR': result = (counters.get(key) ?? 0) + 1; counters.set(key, result); break;
            case 'EXPIRE': result = 1; break;
            default: throw new Error(`Unexpected Redis command: ${command}`);
          }
          push(state, result); return 1;
        });
        lua.lua_setfield(L, -2, to_luastring('call')); lua.lua_setglobal(L, to_luastring('redis'));
        const result = lauxlib.luaL_dostring(L, to_luastring(script));
        assert.equal(result, lua.LUA_OK, result ? str(L, -1) : undefined);
        return lua.lua_tonumber(L, -1);
      } finally { lua.lua_close(L); }
    },
  };
}
function fixture() {
  const redis = fakeRedis(); const store = redisStore(redis as any);
  const deps = { verify, store: () => store, origin };
  return { redis, store, deps, collection: ordersHandler('collection', deps),
    item: ordersHandler('item', deps), bulk: ordersHandler('bulk', deps) };
}
const scopeFor = (user: string | null) => createAccountScope(user, async () => user ?? '', () => {});

test('all order operations and AI reject absent/invalid sessions before storage/provider work', async () => {
  const deps = { verify, origin, store: () => { throw new Error('Must not access storage'); } };
  for (const user of [null, 'expired']) {
    for (const kind of ['collection', 'item', 'bulk'] as const)
      for (const method of ['GET', 'POST', 'PUT', 'DELETE'])
        assert.equal((await invoke(ordersHandler(kind, deps), method, user, order(), 'sample')).status, 401);
    assert.equal((await invoke(createGeminiHandler(deps), 'POST', user)).status, 401);
  }
});

test('identity must be confirmed email, non-anonymous, and trusted origin; cookie is insufficient', async () => {
  for (const identity of [{ id: A }, { id: A, email: 'a@example.test' },
    { id: A, email: 'a@example.test', email_confirmed_at: 'today', is_anonymous: true }])
    await assert.rejects(requireUser({ headers: { authorization: 'Bearer sample' } }, async () => identity), { status: 401 });
  await assert.rejects(requireUser({ headers: { cookie: 'session=sample' } }, verify), { status: 401 });
  await assert.rejects(requireUser({ headers: { authorization: `Bearer ${A}`, origin: 'https://evil.example.test' } }, verify, origin), { status: 403 });
  await assert.rejects(requireUser({ headers: { authorization: `Bearer ${A}` } }, async () => { throw new HttpError(503, 'Authentication unavailable'); }), { status: 503 });
});

test('missing authentication/storage configuration fails closed without network', async () => {
  // Dedicated test process: discard configuration without inspecting any values.
  delete process.env.SUPABASE_URL; delete process.env.SUPABASE_PUBLISHABLE_KEY;
  delete process.env.KV_REST_API_URL; delete process.env.KV_REST_API_TOKEN;
  await assert.rejects(verifyToken('fictional-token'), { status: 503 });
  assert.throws(getStore, { status: 503 });
  assert.equal((await invoke(ordersHandler('collection', { verify, origin }))).status, 503);
});

test('two users have isolated CRUD, including identical IDs and guessed foreign IDs', async () => {
  const f = fixture();
  assert.equal((await invoke(f.collection, 'POST', A, { ...order(), ownerId: B, syncStatus: 'synced' })).status, 201);
  assert.deepEqual((await invoke(f.collection, 'GET', B)).body, []);
  for (const method of ['GET', 'PUT', 'DELETE'])
    assert.equal((await invoke(f.item, method, B, { ...order(), revision: 2 }, 'sample')).status, 404);
  assert.equal((await invoke(f.collection, 'POST', B, { ...order(), clientName: 'Other fictional diner' })).status, 201);
  assert.equal((await invoke(f.item, 'GET', A, undefined, 'sample')).body.clientName, 'Fictional diner');
  const saved = (await invoke(f.item, 'PUT', A, { ...order(), revision: 2, status: 'CANCELLED' }, 'sample'));
  assert.equal(saved.status, 200); assert.equal(saved.body.status, 'CANCELLED');
  assert.equal((await invoke(f.item, 'PUT', A, { ...order(), revision: 2 }, 'sample')).status, 409);
  assert.equal((await invoke(f.item, 'DELETE', A, { revision: 1 }, 'sample')).status, 409);
  assert.equal((await invoke(f.item, 'DELETE', A, { revision: 2 }, 'sample')).status, 200);
  assert.equal((await invoke(f.item, 'GET', B, undefined, 'sample')).body.clientName, 'Other fictional diner');
  assert.equal(saved.headers['Cache-Control'], 'private, no-store');
  assert.equal(saved.body.ownerId, undefined); assert.equal(saved.body.syncStatus, undefined);
});

test('bulk is atomic create-only, bounded, validates every order, and never accesses legacy keys', async () => {
  const f = fixture();
  f.redis.hashes.set('chef_order:legacy', new Map([['legacy', JSON.stringify(order('legacy'))]]));
  assert.deepEqual((await invoke(f.collection)).body, []);
  assert.equal((await invoke(f.bulk, 'POST', A, { orders: [order('one'), order('two')] })).status, 201);
  assert.equal((await invoke(f.bulk, 'POST', A, { orders: [order('three'), order('one')] })).status, 409);
  assert.equal((await invoke(f.item, 'GET', A, undefined, 'three')).status, 404);
  assert.equal((await invoke(f.bulk, 'POST', B, { orders: [order('one')] })).status, 201);
  for (const orders of [[], [order(), order()], Array.from({ length: 101 }, (_, i) => order(`o${i}`)), [order('valid'), { ...order('bad'), amount: -1 }]])
    assert.equal((await invoke(f.bulk, 'POST', A, { orders })).status, 400);
  assert.equal((await invoke(f.item, 'GET', A, undefined, 'valid')).status, 404);
  assert.equal((await invoke(f.item, 'PUT', A, order('other'), 'one')).status, 400);
  assert.equal((await invoke(f.collection, 'POST', A, { ...order(), originalImage: 'x'.repeat(2100000) })).status, 413);
  assert.ok(f.redis.keys.every(key => key === tenantKey(A) || key === tenantKey(B)));
  assert.equal(f.redis.hashes.get('chef_order:legacy')!.size, 1);
});

test('actual Lua caps account capacity, enforces concurrent revisions and per-user AI budget', async () => {
  const { store, redis } = fixture();
  await store.create(A, [order()]);
  const results = await Promise.allSettled([store.update(A, { ...order(), revision: 2 }), store.update(A, { ...order(), revision: 2 })]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  for (let i = 0; i < 10; i++) assert.equal(await store.consumeAI(A), true);
  assert.equal(await store.consumeAI(A), false); assert.equal(await store.consumeAI(B), true);
  const hash = redis.hashes.get(tenantKey(A))!;
  for (let i = 1; i < 1000; i++) hash.set(`capacity${i}`, JSON.stringify(order(`capacity${i}`)));
  await assert.rejects(store.create(A, [order('overflow')]), { status: 413 });
  assert.equal(await store.get(A, 'overflow'), null);
});

test('Express routes share isolation/auth and disabled OAuth callback over loopback only', async () => {
  const f = fixture(); const server = createApiApp(f.deps).listen(0, '127.0.0.1');
  await once(server, 'listening'); const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const request = (path: string, user?: string, method = 'GET', body?: unknown) => originalFetch(base + path, {
    method, headers: { ...(user ? { Authorization: `Bearer ${user}` } : {}), 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  try {
    for (const path of ['/api/orders', '/api/orders/sample', '/api/orders/bulk', '/api/gemini/parse'])
      assert.equal((await request(path)).status, 401);
    assert.equal((await request('/api/orders', A, 'POST', order())).status, 201);
    assert.deepEqual(await (await request('/api/orders', B)).json(), []);
    assert.equal((await request('/api/orders/sample', B)).status, 404);
    assert.equal((await request('/api/orders/bulk', B, 'POST', { orders: [order('bulk')] })).status, 201);
    assert.equal((await request('/auth/callback')).status, 410);
    assert.equal((await request('/api/unknown')).status, 404);
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});

test('AI credit authorization/rate limit runs before fake provider; upstream errors are sanitized', async () => {
  // Dedicated test process: use only a fictional key, without reading any value.
  process.env.GEMINI_API_KEY = 'fictional-offline-key';
  try {
    const f = fixture(); let calls = 0;
    const handler = createGeminiHandler({ ...f.deps, fetch: async () => { calls++; return new Response(JSON.stringify({ private: 'upstream detail' }), { status: 500 }); } });
    const input = { model: 'gemini-3-flash-preview', contents: [] };
    assert.equal((await invoke(handler, 'POST', null, input)).status, 401); assert.equal(calls, 0);
    assert.equal((await invoke(handler, 'POST', A, { ...input, model: '../invalid' })).status, 400); assert.equal(calls, 0);
    const error = await invoke(handler, 'POST', A, input);
    assert.equal(error.status, 502); assert.deepEqual(error.body, { error: 'AI provider unavailable' });
    for (let i = 1; i < 10; i++) await invoke(handler, 'POST', A, input);
    assert.equal((await invoke(handler, 'POST', A, input)).status, 429); assert.equal(calls, 10);
    assert.equal((await invoke(handler, 'POST', B, input)).status, 502); assert.equal(calls, 11);
  } finally { delete process.env.GEMINI_API_KEY; }
});

test('OTP supports generic emails, cooldown, anti-enumeration and invalid/expired errors', async () => {
  let now = 0; let sends = 0; let checks = 0;
  const flow = createOTPFlow({ signInWithOtp: async () => { sends++; throw new Error('Private provider reason'); },
    verifyOtp: async () => { checks++; return { error: 'expired' }; } }, () => now);
  assert.equal(await flow.request('invalid'), false);
  assert.equal(await flow.request('person@custom.example.test'), true);
  assert.equal(flow.remaining(), 60); assert.equal(await flow.request('person@custom.example.test'), false);
  assert.equal(await flow.verify('different@example.test', '123456'), false);
  assert.equal(await flow.verify('person@custom.example.test', '12345'), false); assert.equal(checks, 0);
  assert.equal(await flow.verify('person@custom.example.test', '123456'), false); assert.equal(checks, 1);
  now += 60000; assert.equal(await flow.request('person@outlook.example.test'), true); assert.equal(sends, 2);
  const success = createOTPFlow({ signInWithOtp: async () => ({ error: null }), verifyOtp: async () => ({ error: null }) });
  await success.request('person@gmx.example.test'); assert.equal(await success.verify('person@gmx.example.test', '012345'), true);
});

test('AccountPanel shows localized OTP/error/cooldown, unconfigured state and sign-out action', async () => {
  const view = render(<AccountPanel provider={{ signInWithOtp: async () => ({ error: 'unknown mailbox' }), verifyOtp: async () => ({ error: 'expired' }) }} onSignOut={() => {}} />);
  fireEvent.change(view.getByLabelText('Account language'), { target: { value: 'EN' } });
  fireEvent.change(view.getByLabelText('Email address'), { target: { value: 'person@example.test' } });
  fireEvent.submit(view.container.querySelector('form')!);
  await waitFor(() => assert.ok(view.getByLabelText('Six-digit code')));
  assert.equal((view.getByText(/Resend code/) as HTMLButtonElement).disabled, true);
  assert.match(view.getByRole('status').textContent!, /If delivery is available/);
  fireEvent.change(view.getByLabelText('Six-digit code'), { target: { value: '123456' } });
  fireEvent.submit(view.container.querySelector('form')!);
  await waitFor(() => assert.match(view.getByRole('alert').textContent!, /invalid or expired/));
  let signedOut = false;
  view.rerender(<AccountPanel provider={null} email="person@example.test" onSignOut={() => { signedOut = true; }} />);
  fireEvent.click(view.getByText('Sign out')); assert.equal(signedOut, true);
  view.rerender(<AccountPanel provider={null} onSignOut={() => {}} />);
  assert.match(view.container.textContent!, /not configured/);
});

test('logout/account switch abort pending work; 401 expires scope; no cookies are sent', async () => {
  const first = scopeFor(A); let complete!: (response: Response) => void;
  globalThis.fetch = async (_url, options) => {
    assert.equal(options!.credentials, 'omit'); assert.equal(options!.signal, first.scope.signal);
    return new Promise<Response>(resolve => { complete = resolve; });
  };
  const pending = accountFetch(first.scope, '/api/orders');
  await new Promise(resolve => setImmediate(resolve));
  first.stop(); const second = scopeFor(B); complete(new Response('[]'));
  await assert.rejects(pending, /Account changed/); assert.equal(first.scope.signal.aborted, true); assert.equal(second.scope.active(), true);
  let expired = false;
  const next = createAccountScope(A, async () => A, () => { expired = true; });
  globalThis.fetch = async () => new Response('{}', { status: 401 });
  await assert.rejects(accountFetch(next.scope, '/api/orders'), /Session expired/);
  assert.equal(expired, true); assert.equal(next.scope.active(), false);
});

test('browser drafts are scoped, retained on logout, and never read/uploaded automatically as guest', async () => {
  const guest = scopeFor(null); const a = scopeFor(A); const b = scopeFor(B);
  localStorage.setItem('chef_orders', JSON.stringify([order('legacy')]));
  const guestStore = createStorage(guest.scope); const aStore = createStorage(a.scope); const bStore = createStorage(b.scope);
  await guestStore.saveOrdersLocal([{ ...order('guest'), originalImage: 'fictional-image' }]);
  await aStore.saveOrdersLocal([order('private-a')]);
  assert.deepEqual(await bStore.loadOrdersLocal(), []);
  assert.deepEqual((await aStore.loadOrdersLocal()).map(o => o.id), ['private-a']);
  assert.equal((await guestStore.loadOrdersLocal())[0].originalImage, 'fictional-image');
  assert.equal((await createSyncEngine(guest.scope, guestStore)(() => assert.fail('Guest must not sync'))).status, 'guest');
  a.stop(); assert.deepEqual(await aStore.loadOrdersLocal(), []);
  assert.match(localStorage.getItem(ordersKey(A))!, /private-a/);
  assert.match(localStorage.getItem('chef_orders')!, /legacy/);
});

test('draft import requires review and selection, copies IDs, and retains originals', async () => {
  const { scope } = scopeFor(A); let imported: Order[] = [];
  localStorage.setItem('chef_orders', JSON.stringify([order('legacy')]));
  const view = render(<DraftImport scope={scope} onImport={async orders => { imported = orders; }} />);
  assert.equal(view.queryByRole('checkbox'), null); assert.equal(imported.length, 0);
  fireEvent.click(view.getByText(/Review local drafts/));
  await waitFor(() => assert.ok(view.getByRole('checkbox')));
  const button = view.getByText(/Import selected/) as HTMLButtonElement;
  assert.equal(button.disabled, true);
  fireEvent.click(view.getByRole('checkbox')); fireEvent.click(button);
  await waitFor(() => assert.equal(imported.length, 1));
  assert.notEqual(imported[0].id, 'legacy'); assert.equal(imported[0].syncStatus, 'dirty');
  assert.equal(imported[0].revision, 1); assert.match(localStorage.getItem('chef_orders')!, /legacy/);
});

test('sync preserves conflicts and ignores response arriving after logout', async () => {
  const a = scopeFor(A); const storage = createStorage(a.scope);
  await storage.saveOrdersLocal([{ ...order(), revision: 1, syncStatus: 'dirty' }]);
  globalThis.fetch = async () => new Response(JSON.stringify([{ ...order(), revision: 2 }]));
  let rendered: Order[] = [];
  assert.equal((await createSyncEngine(a.scope, storage)(orders => { rendered = orders; })).status, 'partial');
  assert.equal(rendered[0].conflict, true); assert.equal(rendered[0].revision, 1);
  let resolve!: (response: Response) => void;
  globalThis.fetch = async () => new Promise<Response>(done => { resolve = done; });
  const pending = createSyncEngine(a.scope, storage)(() => assert.fail('Stale sync rendered private orders'));
  await new Promise(done => setImmediate(done)); a.stop(); resolve(new Response('[]'));
  assert.equal((await pending).status, 'unavailable');
});

test('disabled callback cannot hand off OAuth tokens', async () => {
  const result = await invoke(callback);
  assert.equal(result.status, 410); assert.match(result.headers['Content-Security-Policy'], /default-src 'none'/);
  assert.deepEqual(result.body, { error: 'External account linking is disabled' });
});
