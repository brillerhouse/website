import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { BlogIndex } from './BlogIndex';
import { allPosts, blogCatalog, blogHref } from '@/lib/blog/content';
import { blogCopy } from '@/lib/blog/shared';
import type { Locale } from '@/lib/content';
import { site } from '@/lib/content';

export function BlogPage({ locale, category, tag }: { locale: Locale; category?: string; tag?: string }) {
  const t = blogCopy(locale), { categories: blogCategories, tags: blogTags } = blogCatalog(locale);
  const selectedCategory = blogCategories.find(c => c.slug === category), selectedTag = blogTags.find(t => t.slug === tag);
  const title = selectedCategory?.name || selectedTag?.name || t.heading;
  const posts = allPosts(locale), visible = posts.filter(post => (!category || post.categories.includes(category)) && (!tag || post.tags.includes(tag)));
  const currentPath = category ? blogHref('category/' + category, locale) : tag ? blogHref('tag/' + tag, locale) : blogHref('', locale);
  const schema = { '@context': 'https://schema.org', '@type': 'Blog', name: t.seoTitle, description: t.seoDescription, url: site.origin + currentPath, inLanguage: locale, blogPost: visible.map(post => ({ '@type': 'BlogPosting', headline: post.title, url: site.origin + blogHref(post.slug, locale), author: { '@type': 'Person', name: post.author.name }, datePublished: post.date, image: site.origin + post.image })) };
  return <Shell locale={locale} page={currentPath.replace(/^\/(en|uk)\//, '').replace(/\/$/, '')} breadcrumbs={[{ name: t.blog, href: blogHref('', locale) }, ...(category || tag ? [{ name: title, href: currentPath }] : [])]}>
    <section className="section blog-heading">
      {(category || tag) && <a className="text-link" href={blogHref('', locale)}><ArrowLeft size={17} aria-hidden="true"/>{t.backAll}</a>}
      <p className="eyebrow">{t.eyebrow}{category ? ' / ' + t.categoryEyebrow : tag ? ' / ' + t.topicEyebrow : ''}</p><h1>{title}</h1>
      <p className="blog-intro">{selectedCategory?.description || (selectedTag ? `${t.tagIntro} «${selectedTag.name}».` : t.intro)}</p>
    </section>
    <section className="section blog-library" aria-label={t.library}><BlogIndex locale={locale} posts={posts} categories={blogCategories} tags={blogTags} initialCategory={category} initialTag={tag}/>
      <nav className="blog-browse" aria-label={t.browse}><h2>{t.explore}</h2><div>{blogCategories.filter(c => posts.some(post => post.categories.includes(c.slug))).map(c => <a className="text-link" key={c.slug} href={blogHref('category/' + c.slug, locale)}>{c.name}<ArrowUpRight size={17} aria-hidden="true"/></a>)}</div></nav>
    </section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>
  </Shell>;
}
