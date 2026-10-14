'use client';
import { useEffect } from 'react';
import { href, Locale } from '@/lib/content';
import { cachedCountry, COUNTRY_KEY, LANGUAGE_COOKIE, LANGUAGE_KEY, lookupCountry, preferredLocale, redirectAddress } from '@/lib/locale-routing';

function stored(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function store(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* The page still works when storage is unavailable. */ } }
function preference() { let cookie = ''; try { cookie = document.cookie; } catch {} return preferredLocale(stored(LANGUAGE_KEY), cookie); }
function remember(locale: Locale) {
  store(LANGUAGE_KEY, locale);
  try { document.cookie = `${LANGUAGE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`; } catch { /* Local storage remains the preference fallback. */ }
}
export function LocaleRouting() {
  useEffect(() => {
    let active = true;
    function forward(country: string | null) {
      if (!active) return;
      // Re-read preference so a footer click during the lookup always wins.
      const target = redirectAddress(location.href, preference(), country);
      if (target) location.replace(target);
    }
    const manual = preference();
    if (manual) { forward(null); return () => { active = false; }; }
    if (/^\/uk(?:\/|$)/.test(location.pathname) || /bot|crawler|spider|lighthouse/i.test(navigator.userAgent)) return;
    const cached = cachedCountry(stored(COUNTRY_KEY), Date.now());
    if (cached) { forward(cached.country); return () => { active = false; }; }
    lookupCountry().then(country => {
      if (!active) return;
      // Store only the country code and lookup time, never the visitor's IP address.
      store(COUNTRY_KEY, JSON.stringify({ country, checkedAt: Date.now() }));
      forward(country);
    });
    return () => { active = false; };
  }, []);
  return null;
}
export function FooterLanguages({ locale, page }: { locale: Locale; page: string }) {
  return <nav className="footer-languages" aria-label={locale === 'uk' ? 'Мова сайту' : 'Website language'}>
    {(['en','uk'] as const).map(language => <a key={language} href={href(language,page)} hrefLang={language} lang={language} aria-current={locale === language ? 'true' : undefined}
      aria-label={language === 'uk' ? 'Перемкнути українською' : 'Switch to English'}
      onClick={event => {
        remember(language);
        // Native links remain usable without JavaScript; preserve URL extras for ordinary clicks.
        if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
          event.preventDefault();
          location.assign(href(language,page) + location.search + location.hash);
        }
      }}>{language.toUpperCase()}</a>)}
  </nav>;
}
