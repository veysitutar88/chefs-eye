import React, { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import App from '../App';
import { authClient, AUTH_STORAGE_KEY } from '../services/authService';
import { createAccountScope } from '../services/accountScope';
import { AccountPanel } from './AccountPanel';
export function AuthShell() {
  const [ready, setReady] = useState(!authClient);
  const [session, setSession] = useState<Session | null>(null);
  const [warning, setWarning] = useState('');
  const [generation, setGeneration] = useState(0);
  const identity = useRef<string | null>(null);
  const scopeRef = useRef<ReturnType<typeof createAccountScope>>(null);
  const signingOut = useRef(false);
  const change = (next: Session | null) => {
    if (signingOut.current && next) return;
    const user = next?.user?.id ?? null;
    if (!scopeRef.current || user !== identity.current || !scopeRef.current.scope.active()) {
      scopeRef.current?.stop(); identity.current = user;
      scopeRef.current = createAccountScope(user, async () => {
        const { data, error } = await authClient!.auth.getSession();
        if (error || !data.session || data.session.user.id !== user) throw new Error('Sign in required');
        return data.session.access_token;
      }, () => { change(null); setWarning('Session expired / Sitzung abgelaufen / Сессия истекла'); });
      setGeneration(value => value + 1);
    }
    setSession(next); setReady(true);
  };
  useEffect(() => {
    if (!authClient) { change(null); return; }
    const { data } = authClient.auth.onAuthStateChange((_event, next) => change(next));
    return () => { data.subscription.unsubscribe(); scopeRef.current?.stop(); };
  }, []);
  async function signOut() {
    signingOut.current = true;
    change(null); // Abort requests and unmount private views before network work.
    try {
      const result = await authClient!.auth.signOut({ scope: 'local' });
      if (result.error) setWarning('Signed out here; server revocation unavailable. Existing tokens expire normally.');
    } finally {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      signingOut.current = false;
    }
  }
  if (!ready || !scopeRef.current) return <p role="status">Loading account…</p>;
  return <div className="h-screen flex flex-col print:block print:h-auto">
    <AccountPanel provider={authClient?.auth ?? null} email={session?.user.email} onSignOut={signOut} />
    {warning && <p role="alert" className="print:hidden bg-amber-50 text-amber-900 p-2">{warning}</p>}
    <div className="flex-1 min-h-0"><App key={generation} scope={scopeRef.current.scope} /></div>
  </div>;
}
