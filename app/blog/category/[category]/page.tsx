import { notFound } from 'next/navigation';
import { BlogPage } from '@/components/blog/BlogPage';
import { allPosts, blogCategories, blogMetadata, categoryHref } from '@/lib/blog/content';
export const dynamicParams = false;
export function generateStaticParams() { return blogCategories.filter(c => allPosts().some(p => p.categories.includes(c.slug))).map(c => ({ category: c.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params, taxon = blogCategories.find(c => c.slug === category);
  return taxon ? blogMetadata(taxon.name, taxon.description, categoryHref(category)) : {};
}
export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!blogCategories.some(c => c.slug === category) || !allPosts().some(p => p.categories.includes(category))) notFound();
  return <BlogPage category={category}/>;
}
