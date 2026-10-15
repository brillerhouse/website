import type { Locale } from './content';

// Static export evaluates this at build time, using the operator's chosen timezone.
export const privacyEffectiveDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

export function privacyDateLabel(locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-GB', {
    timeZone: 'Europe/Kyiv', year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(`${privacyEffectiveDate}T12:00:00Z`));
}
