import { notFound } from 'next/navigation';
import { BlogPage } from '@/components/blog/BlogPage';
import { allPosts, blogTags, blogMetadata, tagHref } from '@/lib/blog/content';
export const dynamicParams = false;
export function generateStaticParams() { return blogTags.filter(t => allPosts().some(p => p.tags.includes(t.slug))).map(t => ({ tag: t.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params, taxon = blogTags.find(t => t.slug === tag);
  return taxon ? blogMetadata(`${taxon.name} — Guides & Articles`, `Practical design and renovation guides about ${taxon.name.toLowerCase()}.`, tagHref(tag)) : {};
}
export default async function Page({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  if (!blogTags.some(t => t.slug === tag) || !allPosts().some(p => p.tags.includes(tag))) notFound();
  return <BlogPage tag={tag}/>;
}
