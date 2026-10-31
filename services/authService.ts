import { createClient } from '@supabase/supabase-js';
const env: Record<string, string> = import.meta.env ?? {};
export const AUTH_STORAGE_KEY = 'ce-auth-v2';
export const authClient = env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY
  ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: AUTH_STORAGE_KEY },
    }) : null;
export const validEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validOTP = (code: string) => /^\d{6}$/.test(code);
export interface OTPProvider {
  signInWithOtp(input: { email: string; options: { shouldCreateUser: boolean } }): Promise<{ error: unknown }>;
  verifyOtp(input: { email: string; token: string; type: 'email' }): Promise<{ error: unknown }>;
}
export function createOTPFlow(provider: OTPProvider, now = Date.now) {
  let nextRequest = 0;
  let requestedEmail = '';
  let busy = false;
  return {
    remaining: () => Math.max(0, Math.ceil((nextRequest - now()) / 1000)),
    async request(email: string) {
      email = email.trim();
      if (!validEmail(email) || busy || now() < nextRequest) return false;
      busy = true;
      requestedEmail = email;
      nextRequest = now() + 60000;
      try { await provider.signInWithOtp({ email, options: { shouldCreateUser: true } }); }
      catch { /* Same response regardless of mailbox existence or provider error. */ }
      finally { busy = false; }
      return true;
    },
    async verify(email: string, code: string) {
      if (busy || email.trim() !== requestedEmail || !validOTP(code)) return false;
      busy = true;
      try { return !(await provider.verifyOtp({ email: requestedEmail, token: code, type: 'email' })).error; }
      catch { return false; }
      finally { busy = false; }
    },
  };
}
