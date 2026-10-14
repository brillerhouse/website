import type { Locale } from './content';

export const LANGUAGE_KEY = 'briller:language';
export const LANGUAGE_COOKIE = 'briller_language';
export const COUNTRY_KEY = 'briller:country';
export const COUNTRY_TTL = 24 * 60 * 60 * 1000;
export const LOOKUP_FAILURE_TTL = 10 * 60 * 1000;
export const COUNTRY_ENDPOINT = 'https://api.country.is/';
export function validLocale(value: unknown): Locale | null { return value === 'en' || value === 'uk' ? value : null; }
export function preferredLocale(stored: unknown, cookie: string): Locale | null {
  const local = validLocale(stored);
  if (local) return local;
  const match = cookie.match(/(?:^|;\s*)briller_language=(en|uk)(?:;|$)/);
  return validLocale(match?.[1]);
}
export function redirectPath(path: string, preference: Locale | null, country: string | null): string | null {
  const current = path.match(/^\/(en|uk)(?:\/|$)/)?.[1] ?? null;
  const target = preference ?? (country === 'UA' ? 'uk' : null);
  if (!target || current === target) return null;
  const rest = current ? path.replace(/^\/(?:en|uk)(?:\/|$)/, '') : path.replace(/^\//, '');
  return `/${target}/${rest}`;
}
export function redirectAddress(address: string, preference: Locale | null, country: string | null): string | null {
  const url = new URL(address);
  const path = redirectPath(url.pathname, preference, country);
  if (!path) return null;
  url.pathname = path;
  return url.href;
}
export function cachedCountry(value: string | null, now: number): { country: string | null } | null {
  try {
    const parsed = JSON.parse(value ?? 'null');
    if (!parsed || typeof parsed.checkedAt !== 'number' || parsed.checkedAt > now) return null;
    if (parsed.country !== null && (typeof parsed.country !== 'string' || !/^[A-Z]{2}$/.test(parsed.country))) return null;
    const ttl = parsed.country === null ? LOOKUP_FAILURE_TTL : COUNTRY_TTL;
    return now - parsed.checkedAt < ttl ? { country: parsed.country } : null;
  } catch { return null; }
}
export async function lookupCountry(fetcher: typeof fetch = fetch, timeoutMs = 2500): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(COUNTRY_ENDPOINT, { signal: controller.signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    const country = typeof data === 'object' && data !== null && 'country' in data ? data.country : null;
    return typeof country === 'string' && /^[A-Z]{2}$/.test(country) ? country : null;
  } catch { return null; }
  finally { clearTimeout(timer); }
}
