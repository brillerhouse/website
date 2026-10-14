export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE = 'briller:consent';
export const CONSENT_COOKIE = 'briller_cookie_consent';
export const CONSENT_DURATION = 180 * 24 * 60 * 60 * 1000;
export type Consent = { version: number; analytics: boolean; marketing: boolean; savedAt: number };
export function makeConsent(analytics: boolean, marketing: boolean, now: number): Consent {
  return { version: CONSENT_VERSION, analytics, marketing, savedAt: now };
}
export function parseConsent(value: string | null, now: number): Consent | null {
  try {
    const data = JSON.parse(value ?? 'null');
    if (!data || data.version !== CONSENT_VERSION || typeof data.analytics !== 'boolean' || typeof data.marketing !== 'boolean') return null;
    if (typeof data.savedAt !== 'number' || !Number.isFinite(data.savedAt) || data.savedAt > now || now - data.savedAt >= CONSENT_DURATION) return null;
    return makeConsent(data.analytics, data.marketing, data.savedAt);
  } catch { return null; }
}
export function readConsent(stored: string | null, cookie: string, now: number): Consent | null {
  const local = parseConsent(stored, now);
  if (local) return local;
  const item = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(CONSENT_COOKIE + '='));
  try { return parseConsent(item ? decodeURIComponent(item.slice(CONSENT_COOKIE.length + 1)) : null, now); }
  catch { return null; }
}
export function validAnalyticsId(value: string) { return /^G-[A-Z0-9]+$/.test(value); }
export function validPixelId(value: string) { return /^\d{5,20}$/.test(value); }
export function allowedTracking(consent: Consent | null, config: { googleAnalyticsId: string; metaPixelId: string }) {
  return { analytics: consent?.analytics === true && validAnalyticsId(config.googleAnalyticsId), marketing: consent?.marketing === true && validPixelId(config.metaPixelId) };
}
export function withdrawal(previous: Consent | null, next: Consent) {
  return Boolean(previous && ((previous.analytics && !next.analytics) || (previous.marketing && !next.marketing)));
}
export function optionalCookie(name: string, category: 'analytics' | 'marketing') {
  return category === 'analytics' ? /^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name) : /^_fb[pc]$/.test(name);
}
