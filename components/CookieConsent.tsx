'use client';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { href, Locale } from '@/lib/content';
import labels from '@/content/cookie-consent.json';
import tracking from '@/content/tracking.json';
import { CONSENT_COOKIE, CONSENT_DURATION, CONSENT_STORAGE, makeConsent, readConsent, withdrawal, type Consent } from '@/lib/cookie-consent';
import { applyTracking } from '@/lib/tracking';

function loadConsent(): Consent | null {
  let stored = null, cookie = '';
  try { stored = localStorage.getItem(CONSENT_STORAGE); } catch {}
  try { cookie = document.cookie; } catch {}
  return readConsent(stored, cookie, Date.now());
}
function persist(consent: Consent) {
  const value = JSON.stringify(consent);
  try { localStorage.setItem(CONSENT_STORAGE, value); } catch {}
  try { document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${CONSENT_DURATION / 1000}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`; } catch {}
}
export function CookieConsent({ locale }: { locale: Locale }) {
  const c = labels[locale];
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [saved, setSaved] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const footerButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const currentConsent = useRef<Consent | null>(null);
  useEffect(() => {
    const current = loadConsent();
    currentConsent.current = current;
    setConsent(current); setReady(true);
    applyTracking(current, tracking);
    function refresh() {
      const next = loadConsent();
      const previous = currentConsent.current;
      if (JSON.stringify(next) === JSON.stringify(previous)) return;
      currentConsent.current = next;
      applyTracking(next, tracking); setConsent(next);
      if (withdrawal(previous, next ?? makeConsent(false,false,Date.now()))) location.reload();
    }
    const storage = (event: StorageEvent) => { if (event.key === CONSENT_STORAGE || event.key === null) refresh(); };
    const visible = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('storage', storage);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', visible);
    return () => { window.removeEventListener('storage', storage); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', visible); };
  }, []);
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  function settings() {
    opener.current = document.activeElement as HTMLElement | null;
    setAnalytics(consent?.analytics ?? false); setMarketing(consent?.marketing ?? false); setOpen(true);
  }
  function close() {
    dialog.current?.close();
    setOpen(false);
    window.requestAnimationFrame(() => (opener.current?.isConnected ? opener.current : footerButton.current)?.focus());
  }
  function save(allowAnalytics: boolean, allowMarketing: boolean) {
    const next = makeConsent(allowAnalytics, allowMarketing, Date.now());
    const previous = currentConsent.current;
    persist(next); applyTracking(next, tracking); currentConsent.current = next;
    setConsent(next); setSaved(true); close();
    // Reload on withdrawal so already-executed vendor code cannot continue in this page.
    if (withdrawal(previous, next)) location.reload();
  }
  return <>
    <button ref={footerButton} className="footer-cookie-settings" type="button" onClick={settings} disabled={!ready}>{c.footer}</button>
    <span className="sr-only" role="status" aria-live="polite">{saved ? c.saved : ''}</span>
    {ready && !consent && !open && <section className="cookie-banner" aria-labelledby="cookie-banner-title">
      <div className="cookie-banner-copy"><h2 id="cookie-banner-title">{c.title}</h2><p>{c.intro} <a href={href(locale,'privacy')}>{c.privacy}</a> · <a href={href(locale,'cookies')}>{c.cookies}</a></p></div>
      <div className="cookie-banner-actions"><button className="button outline" type="button" onClick={() => save(false,false)}>{c.reject}</button><button className="button outline" type="button" onClick={() => save(true,true)}>{c.accept}</button><button className="text-link" type="button" onClick={settings}>{c.manage}</button></div>
    </section>}
    <dialog ref={dialog} className="cookie-dialog" aria-labelledby="cookie-preferences-title" aria-describedby="cookie-preferences-intro"
      onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === dialog.current) close(); }}>
      <div className="cookie-preferences"><div className="cookie-dialog-heading"><h2 id="cookie-preferences-title">{c.settingsTitle}</h2><button className="cookie-close" type="button" onClick={close} aria-label={c.close}><X size={21}/></button></div>
        <p id="cookie-preferences-intro">{c.settingsIntro}</p>
        <fieldset className="cookie-categories"><legend className="sr-only">{c.categories}</legend>
          <label><span><strong>{c.essential} <small>{c.alwaysOn}</small></strong><span>{c.essentialText}</span></span><input type="checkbox" checked disabled/></label>
          <label><span><strong>{c.analytics}</strong><span>{c.analyticsText}</span></span><input type="checkbox" name="analytics" checked={analytics} onChange={event => setAnalytics(event.target.checked)}/></label>
          <label><span><strong>{c.marketing}</strong><span>{c.marketingText}</span></span><input type="checkbox" name="marketing" checked={marketing} onChange={event => setMarketing(event.target.checked)}/></label>
        </fieldset>
        <div className="cookie-policy-links"><a href={href(locale,'privacy')}>{c.privacy}</a><a href={href(locale,'cookies')}>{c.cookies}</a></div>
        <div className="cookie-dialog-actions"><button className="button outline" type="button" onClick={() => save(false,false)}>{c.reject}</button><button className="button" type="button" onClick={() => save(analytics,marketing)}>{c.save}</button></div>
      </div>
    </dialog>
  </>;
}
