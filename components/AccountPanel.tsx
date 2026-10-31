import React, { useMemo, useState, useEffect } from 'react';
import { createOTPFlow, OTPProvider } from '../services/authService';
const copy = {
 EN: { email: 'Email address', code: 'Six-digit code', send: 'Send code', verify: 'Verify', resend: 'Resend code', sent: 'If delivery is available, a code will arrive. Check spam or try again later.', invalid: 'Code invalid or expired. Request a new code.', off: 'Email sign-in is not configured. Local drafts only.', guest: 'Local drafts only. Sign in to sync; drafts are never imported automatically.', out: 'Sign out', account: 'Signed in', busy: 'Please wait…' },
 DE: { email: 'E-Mail-Adresse', code: 'Sechsstelliger Code', send: 'Code senden', verify: 'Bestätigen', resend: 'Erneut senden', sent: 'Wenn die Zustellung möglich ist, erhalten Sie einen Code. Spam prüfen oder später erneut versuchen.', invalid: 'Code ungültig oder abgelaufen. Fordern Sie einen neuen Code an.', off: 'E-Mail-Anmeldung nicht eingerichtet. Nur lokale Entwürfe.', guest: 'Nur lokale Entwürfe. Zur Synchronisierung anmelden; kein automatischer Import.', out: 'Abmelden', account: 'Angemeldet', busy: 'Bitte warten…' },
 RU: { email: 'Электронная почта', code: 'Шестизначный код', send: 'Отправить код', verify: 'Подтвердить', resend: 'Отправить повторно', sent: 'Если доставка доступна, придёт код. Проверьте спам или повторите позже.', invalid: 'Код неверен или истёк. Запросите новый код.', off: 'Вход по почте не настроен. Только локальные черновики.', guest: 'Локальные черновики. Войдите для синхронизации; автоматического импорта нет.', out: 'Выйти', account: 'Аккаунт', busy: 'Подождите…' },
};
export function AccountPanel({ provider, email: accountEmail, onSignOut }: { provider: OTPProvider | null; email?: string; onSignOut(): void }) {
 const [lang, setLang] = useState<'DE'|'EN'|'RU'>('DE');
 const [email, setEmail] = useState(''); const [code, setCode] = useState('');
 const [sent, setSent] = useState(false); const [invalid, setInvalid] = useState(false);
 const [busy, setBusy] = useState(false); const [seconds, setSeconds] = useState(0);
 const flow = useMemo(() => provider ? createOTPFlow(provider) : null, [provider]);
 const t = copy[lang];
 useEffect(() => { const timer = setInterval(() => setSeconds(flow?.remaining() ?? 0), 500); return () => clearInterval(timer); }, [flow]);
 useEffect(() => { setCode(''); setEmail(''); setSent(false); setInvalid(false); }, [accountEmail]);
 async function send() { if (!flow) return; setBusy(true); setInvalid(false); if (await flow.request(email)) setSent(true); setSeconds(flow.remaining()); setBusy(false); }
 return <section aria-label="Account" className="print:hidden shrink-0 border-b bg-white text-slate-900 p-3 text-sm max-h-[45vh] overflow-auto">
   <div className="flex gap-3 flex-wrap items-center">
    <strong>Chef’s Eye</strong>
    <select aria-label="Account language" value={lang} onChange={e => setLang(e.target.value as typeof lang)}><option>DE</option><option>EN</option><option>RU</option></select>
    {accountEmail ? <><span>{t.account}: {accountEmail}</span><button className="border rounded px-3 py-2" onClick={onSignOut}>{t.out}</button></> : <span>{provider ? t.guest : t.off}</span>}
   </div>
   {!accountEmail && provider && <form className="flex flex-wrap gap-2 items-end mt-2" onSubmit={async e => {
    e.preventDefault(); if (!sent) { await send(); return; }
    setBusy(true); setInvalid(!await flow!.verify(email, code)); setBusy(false);
   }}>
    <label>{t.email}<input className="block border rounded p-2" type="email" autoComplete="email" required maxLength={254} value={email} disabled={busy || sent} onChange={e => setEmail(e.target.value)} /></label>
    {sent && <label>{t.code}<input className="block border rounded p-2 w-40" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value)} /></label>}
    <button className="border rounded px-3 py-2" disabled={busy || (!sent && seconds > 0)}>{busy ? t.busy : sent ? t.verify : t.send}</button>
    {sent && <><button type="button" className="border rounded px-3 py-2" disabled={busy || seconds > 0} onClick={send}>{t.resend} {seconds > 0 ? `(${seconds}s)` : ''}</button><button type="button" disabled={busy} onClick={() => {setSent(false);setCode('');setInvalid(false);}}>{t.email} ↺</button></>}
    {sent && <p role="status" className="w-full">{t.sent}</p>}
    {invalid && <p role="alert" className="w-full text-red-700">{t.invalid}</p>}
   </form>}
 </section>;
}
