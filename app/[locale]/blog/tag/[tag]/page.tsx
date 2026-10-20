import { notFound } from 'next/navigation';
import { BlogPage } from '@/components/blog/BlogPage';
import { allPosts, blogCatalog, blogMetadata, tagHref } from '@/lib/blog/content';
import { blogCopy } from '@/lib/blog/shared';
import { locales, type Locale } from '@/lib/content';
export const dynamicParams = false;
export function generateStaticParams() { return locales.flatMap(locale => blogCatalog(locale).tags.filter(t => allPosts(locale).some(p => p.tags.includes(t.slug))).map(t => ({ locale, tag: t.slug }))); }
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; tag: string }> }) {
  const { locale, tag } = await params; if (!locales.includes(locale)) return {};
  const taxon = blogCatalog(locale).tags.find(t => t.slug === tag), t = blogCopy(locale);
  return taxon ? blogMetadata(`${taxon.name} — ${t.tagSeo}`, `${t.tagIntro} «${taxon.name}».`, tagHref(tag, locale), undefined, locale) : {};
}
export default async function Page({ params }: { params: Promise<{ locale: Locale; tag: string }> }) {
  const { locale, tag } = await params; if (!locales.includes(locale)) notFound();
  if (!blogCatalog(locale).tags.some(t => t.slug === tag) || !allPosts(locale).some(p => p.tags.includes(tag))) notFound();
  return <BlogPage locale={locale} tag={tag}/>;
}
