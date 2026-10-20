import { notFound } from 'next/navigation';
import { ArticleLayout } from '@/components/blog/ArticleLayout';
import { allPosts, blogHref, blogMetadata, getPost, postSource } from '@/lib/blog/content';
import { renderArticle } from '@/lib/blog/markdown';
import { locales, type Locale } from '@/lib/content';
export const dynamicParams = false;
export function generateStaticParams() { return locales.flatMap(locale => allPosts(locale).map(post => ({ locale, slug: post.slug }))); }
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params; if (!locales.includes(locale)) return {};
  const post = getPost(slug, locale); if (!post) return {};
  const metadata = blogMetadata(post.title, post.excerpt, blogHref(slug, locale), post.image, locale);
  return { ...metadata, openGraph: { ...metadata.openGraph, type: 'article', publishedTime: post.date, authors: [post.author.name], tags: post.tags } };
}
export default async function Page({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params; if (!locales.includes(locale)) notFound();
  const post = getPost(slug, locale); if (!post) notFound();
  return <ArticleLayout locale={locale} post={post} {...renderArticle(postSource(slug, locale), locale)}/>;
}
