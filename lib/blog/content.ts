import fs from 'node:fs';
import path from 'node:path';
import en from '@/content/blog/catalog.json';
import uk from '@/content/blog/catalog.uk.json';
import { site, socialPreview, type Locale } from '@/lib/content';
import { blogHref } from './shared';
export { blogHref, categoryHref, tagHref } from './shared';
export const blogCatalog = (locale: Locale = 'en') => locale === 'uk' ? uk : en;
export const blogCategories = en.categories;
export const blogTags = en.tags;
export type BlogPost = typeof en.posts[number];
export function postSource(slug: string, locale: Locale = 'en') {
  if (!blogCatalog(locale).posts.some(post => post.slug === slug)) throw new Error('Unknown blog post');
  return fs.readFileSync(path.join(process.cwd(), 'content/blog/posts', locale === 'uk' ? 'uk' : '', slug + '.md'), 'utf8');
}
export function readingMinutes(markdown: string) {
  return Math.max(1, Math.ceil(markdown.replace(/https?:\/\/\S+/g, '').split(/\s+/).length / 210));
}
export function allPosts(locale: Locale = 'en') {
  const catalog = blogCatalog(locale);
  return [...catalog.posts].sort((a, b) => b.date.localeCompare(a.date)).map(post => {
    const source = postSource(post.slug, locale);
    const labels = [...catalog.categories.filter(c => post.categories.includes(c.slug)), ...catalog.tags.filter(t => post.tags.includes(t.slug))].map(t => t.name).join(' ');
    return { ...post, readingMinutes: readingMinutes(source), searchText: labels + ' ' + source.replace(/[#*_>\[\]`|]/g, ' ') };
  });
}
export function getPost(slug: string, locale: Locale = 'en') { return allPosts(locale).find(post => post.slug === slug); }
export function dateLabel(date: string, locale: Locale = 'en') {
  return new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-GB', { dateStyle: 'long', timeZone: 'Europe/Kyiv' }).format(new Date(date + 'T12:00:00Z'));
}
export function blogMetadata(title: string, description: string, route = blogHref(), image?: string, locale: Locale = 'en') {
  const suffix = route.replace(/^\/(en|uk)\/blog\//, '');
  return {
    title: `${title} | Briller`, description, robots: { index: true, follow: true },
    alternates: { canonical: site.origin + route, languages: { en: site.origin + blogHref(suffix.replace(/\/$/, ''), 'en'), uk: site.origin + blogHref(suffix.replace(/\/$/, ''), 'uk'), 'x-default': site.origin + blogHref(suffix.replace(/\/$/, ''), 'en') } },
    openGraph: { title: `${title} | Briller`, description, type: 'website' as const, url: site.origin + route, locale: locale === 'uk' ? 'uk_UA' : 'en_US', alternateLocale: [locale === 'uk' ? 'en_US' : 'uk_UA'], images: image ? [{ url: site.origin + image, alt: title }] : [socialPreview] },
    twitter: { card: 'summary_large_image' as const, title: `${title} | Briller`, description, images: image ? [site.origin + image] : [socialPreview] }
  };
}
