import { notFound } from 'next/navigation';
import { ArticleLayout } from '@/components/blog/ArticleLayout';
import { allPosts, blogHref, blogMetadata, getPost, postSource } from '@/lib/blog/content';
import { renderArticle } from '@/lib/blog/markdown';
export const dynamicParams = false;
export function generateStaticParams() { return allPosts().map(post => ({ slug: post.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params, post = getPost(slug);
  if (!post) return {};
  const metadata = blogMetadata(post.title, post.excerpt, blogHref(slug), post.image);
  return { ...metadata, openGraph: { ...metadata.openGraph, type: 'article', publishedTime: post.date, authors: [post.author.name], tags: post.tags } };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params, post = getPost(slug);
  if (!post) notFound();
  return <ArticleLayout post={post} {...renderArticle(postSource(slug))}/>;
}
