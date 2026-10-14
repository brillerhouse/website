import { allowedTracking, optionalCookie, type Consent } from './cookie-consent';

type EventQueue = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[][]; push?: EventQueue; loaded: boolean; version: string };
type TrackingWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; fbq?: EventQueue; _fbq?: EventQueue; __brillerGaStarted?: boolean; __brillerMetaStarted?: boolean };
export type TrackingConfig = { googleAnalyticsId: string; metaPixelId: string };
function appendScript(id: string, source: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id; script.async = true; script.src = source;
  document.head.appendChild(script);
}
export function clearOptionalCookies(category: 'analytics' | 'marketing') {
  const names = document.cookie.split(';').map(item => item.trim().split('=')[0]).filter(name => optionalCookie(name, category));
  const paths = new Set(['/']);
  const segments = location.pathname.split('/').filter(Boolean);
  for (let i = 1; i <= segments.length; i++) { const path = '/' + segments.slice(0,i).join('/'); paths.add(path); paths.add(path + '/'); }
  const domains = ['', location.hostname];
  const labels = location.hostname.split('.');
  for (let i = 0; i < labels.length - 1; i++) { const domain = labels.slice(i).join('.'); domains.push(domain, '.' + domain); }
  for (const name of names) for (const path of paths) for (const domain of new Set(domains)) {
    document.cookie = `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=${path}${domain ? '; Domain=' + domain : ''}${location.protocol === 'https:' ? '; Secure' : ''}`;
  }
}
export function applyTracking(consent: Consent | null, config: TrackingConfig) {
  const permitted = allowedTracking(consent, config);
  const w = window as TrackingWindow;
  const id = config.googleAnalyticsId;
  if (id) (window as unknown as Record<string, unknown>)['ga-disable-' + id] = !permitted.analytics;
  if (!permitted.analytics) {
    w.gtag?.('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    document.getElementById('briller-google-analytics')?.remove();
    try { clearOptionalCookies('analytics'); } catch { /* Storage can be blocked by the browser. */ }
  } else if (!w.__brillerGaStarted) {
    w.__brillerGaStarted = true;
    w.dataLayer = w.dataLayer || [];
    w.gtag = w.gtag || function (..._args: unknown[]) { w.dataLayer!.push(arguments); };
    w.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    w.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    w.gtag('js', new Date());
    const page = location.origin + location.pathname;
    let referrer = ''; try { if (document.referrer) { const url = new URL(document.referrer); referrer = url.origin + url.pathname; } } catch {}
    w.gtag('config', id, { cookie_expires: 180 * 24 * 60 * 60, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: page, page_referrer: referrer });
    appendScript('briller-google-analytics', 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id));
  }
  if (!permitted.marketing) {
    w.fbq?.('consent', 'revoke');
    document.getElementById('briller-meta-pixel')?.remove();
    try { clearOptionalCookies('marketing'); } catch { /* Storage can be blocked by the browser. */ }
  } else if (!w.__brillerMetaStarted) {
    w.__brillerMetaStarted = true;
    if (!w.fbq) {
      const queue = function (...args: unknown[]) { if (queue.callMethod) queue.callMethod(...args); else queue.queue.push(args); } as EventQueue;
      queue.queue = []; queue.push = queue; queue.loaded = true; queue.version = '2.0';
      w.fbq = queue; w._fbq = w._fbq || queue;
    }
    w.fbq('consent', 'grant');
    w.fbq('set', 'autoConfig', false, config.metaPixelId);
    w.fbq('init', config.metaPixelId);
    w.fbq('track', 'PageView');
    appendScript('briller-meta-pixel', 'https://connect.facebook.net/en_US/fbevents.js');
  }
}
