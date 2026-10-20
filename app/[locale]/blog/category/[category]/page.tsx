import { notFound } from 'next/navigation';
import { BlogPage } from '@/components/blog/BlogPage';
import { allPosts, blogCatalog, blogMetadata, categoryHref } from '@/lib/blog/content';
import { locales, type Locale } from '@/lib/content';
export const dynamicParams = false;
export function generateStaticParams() { return locales.flatMap(locale => blogCatalog(locale).categories.filter(c => allPosts(locale).some(p => p.categories.includes(c.slug))).map(c => ({ locale, category: c.slug }))); }
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; category: string }> }) {
  const { locale, category } = await params; if (!locales.includes(locale)) return {};
  const taxon = blogCatalog(locale).categories.find(c => c.slug === category);
  return taxon ? blogMetadata(taxon.name, taxon.description, categoryHref(category, locale), undefined, locale) : {};
}
export default async function Page({ params }: { params: Promise<{ locale: Locale; category: string }> }) {
  const { locale, category } = await params; if (!locales.includes(locale)) notFound();
  if (!blogCatalog(locale).categories.some(c => c.slug === category) || !allPosts(locale).some(p => p.categories.includes(category))) notFound();
  return <BlogPage locale={locale} category={category}/>;
}
