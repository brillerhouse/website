import text from '@/content/blog/interface.json';
import type { Locale } from '@/lib/content';
export const blogCopy = (locale: Locale) => text[locale];
export const blogHref = (slug = '', locale: Locale = 'en') => `/${locale}/blog/${slug ? slug + '/' : ''}`;
export const categoryHref = (slug: string, locale: Locale = 'en') => blogHref('category/' + slug, locale);
export const tagHref = (slug: string, locale: Locale = 'en') => blogHref('tag/' + slug, locale);
export const downloadPath = (locale: Locale) => locale === 'uk' ? '/downloads/briller-builder-checklist-uk.pdf' : '/downloads/briller-builder-checklist-letter.pdf';
export const checklistPreview = (locale: Locale) => locale === 'uk' ? '/images/blog/builder-checklist-preview-uk.webp' : '/images/blog/builder-checklist-preview.webp';
export function articleCount(count: number, locale: Locale) {
  if (locale === 'en') return `${count} ${count === 1 ? 'article' : 'articles'}`;
  const form = new Intl.PluralRules('uk').select(count);
  return `${count} ${form === 'one' ? 'стаття' : form === 'few' ? 'статті' : 'статей'}`;
}
