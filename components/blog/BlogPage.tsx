import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { BlogIndex } from './BlogIndex';
import { allPosts, blogCategories, blogTags, blogHref } from '@/lib/blog/content';
import { site } from '@/lib/content';

export function BlogPage({ category, tag }: { category?: string; tag?: string }) {
  const selectedCategory = blogCategories.find(c => c.slug === category), selectedTag = blogTags.find(t => t.slug === tag);
  const title = selectedCategory?.name || selectedTag?.name || 'Good design starts with better questions.';
  const posts = allPosts(), visible = posts.filter(post => (!category || post.categories.includes(category)) && (!tag || post.tags.includes(tag)));
  const currentPath = category ? blogHref('category/' + category) : tag ? blogHref('tag/' + tag) : blogHref();
  const schema = { '@context': 'https://schema.org', '@type': 'Blog', name: 'Briller Field Notes', description: 'Practical notes on design, renovation and the details behind an AI render.', url: site.origin + currentPath, inLanguage: 'en', blogPost: visible.map(post => ({ '@type': 'BlogPosting', headline: post.title, url: site.origin + blogHref(post.slug), author: { '@type': 'Person', name: post.author.name }, datePublished: post.date, image: site.origin + post.image })) };
  return <Shell locale="en" page={currentPath.replace(/^\/|\/$/g, '')} blogPage breadcrumbs={[{ name: 'Blog', href: blogHref() }, ...(category || tag ? [{ name: title, href: currentPath }] : [])]}>
    <section className="section blog-heading">
      {(category || tag) && <a className="text-link" href={blogHref()}><ArrowLeft size={17} aria-hidden="true"/>All field notes</a>}
      <p className="eyebrow">BRILLER / FIELD NOTES{category ? ' / CATEGORY' : tag ? ' / TOPIC' : ''}</p><h1>{title}</h1>
      <p className="blog-intro">{selectedCategory?.description || (selectedTag ? `Guides and practical checks about ${selectedTag.name.toLowerCase()}.` : 'Ideas worth exploring. Details worth checking. Practical guides to help you move from an appealing image to a room that works.')}</p>
    </section>
    <section className="section blog-library" aria-label="Blog articles"><BlogIndex posts={posts} categories={blogCategories} tags={blogTags} initialCategory={category} initialTag={tag}/>
      <nav className="blog-browse" aria-label="Browse blog categories"><h2>Explore by subject</h2><div>{blogCategories.filter(c => posts.some(post => post.categories.includes(c.slug))).map(c => <a className="text-link" key={c.slug} href={blogHref('category/' + c.slug)}>{c.name}<ArrowUpRight size={17} aria-hidden="true"/></a>)}</div></nav>
    </section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>
  </Shell>;
}
