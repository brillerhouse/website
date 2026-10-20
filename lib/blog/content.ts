import fs from 'node:fs';
import path from 'node:path';
import catalog from '@/content/blog/catalog.json';
import { site, socialPreview } from '@/lib/content';

export const blogCategories = catalog.categories;
export const blogTags = catalog.tags;
export const blogHref = (slug = '') => `/blog/${slug ? slug + '/' : ''}`;
export const categoryHref = (slug: string) => blogHref('category/' + slug);
export const tagHref = (slug: string) => blogHref('tag/' + slug);
export type BlogPost = typeof catalog.posts[number];

export function postSource(slug: string) {
  if (!catalog.posts.some(post => post.slug === slug)) throw new Error('Unknown blog post');
  return fs.readFileSync(path.join(process.cwd(), 'content/blog/posts', slug + '.md'), 'utf8');
}
export function readingMinutes(markdown: string) {
  return Math.max(1, Math.ceil(markdown.replace(/https?:\/\/\S+/g, '').split(/\s+/).length / 210));
}
export function allPosts() {
  return [...catalog.posts].sort((a, b) => b.date.localeCompare(a.date)).map(post => {
    const source = postSource(post.slug);
    return { ...post, readingMinutes: readingMinutes(source), searchText: source.replace(/[#*_>\[\]`|]/g, ' ') };
  });
}
export function getPost(slug: string) { return allPosts().find(post => post.slug === slug); }
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'Europe/Kyiv' }).format(new Date(date + 'T12:00:00Z'));
}
export function blogMetadata(title: string, description: string, path = blogHref(), image?: string) {
  return {
    title: `${title} | Briller`, description, robots: { index: true, follow: true },
    alternates: { canonical: site.origin + path },
    openGraph: { title: `${title} | Briller`, description, type: 'website' as const, url: site.origin + path, locale: 'en_US', images: image ? [{ url: site.origin + image, alt: title }] : [socialPreview] },
    twitter: { card: 'summary_large_image' as const, title: `${title} | Briller`, description, images: image ? [site.origin + image] : [socialPreview] }
  };
}
