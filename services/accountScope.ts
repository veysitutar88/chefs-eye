export interface AccountScope {
  userId: string | null;
  active(): boolean;
  signal: AbortSignal;
  token(): Promise<string>;
  invalidate(): void;
}
export function createAccountScope(userId: string | null, token: () => Promise<string>, expired: () => void) {
  const controller = new AbortController();
  const scope: AccountScope = {
    userId, active: () => !controller.signal.aborted, signal: controller.signal,
    async token() {
      if (!scope.active() || !userId) throw new Error('Sign in required');
      const value = await token();
      if (!scope.active()) throw new Error('Account changed');
      return value;
    },
    invalidate() { controller.abort(); expired(); },
  };
  return { scope, stop: () => controller.abort() };
}
export async function accountFetch(scope: AccountScope, path: string, options: RequestInit = {}) {
  const token = await scope.token();
  const response = await fetch(path, {
    ...options, credentials: 'omit', signal: scope.signal,
    headers: { ...options.headers, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!scope.active()) throw new Error('Account changed');
  if (response.status === 401) { scope.invalidate(); throw new Error('Session expired. Sign in again.'); }
  return response;
}
