import { notFound } from 'next/navigation';
import { BlogPage } from '@/components/blog/BlogPage';
import { blogHref, blogMetadata } from '@/lib/blog/content';
import { blogCopy } from '@/lib/blog/shared';
import { locales, type Locale } from '@/lib/content';
export const dynamicParams = false;
export function generateStaticParams() { return locales.map(locale => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params; if (!locales.includes(locale)) return {};
  const t = blogCopy(locale); return blogMetadata(t.seoTitle, t.seoDescription, blogHref('', locale), undefined, locale);
}
export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params; if (!locales.includes(locale)) notFound();
  return <BlogPage locale={locale}/>;
}
