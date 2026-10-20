import { ArrowLeft, ArrowUpRight, Download } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { site } from '@/lib/content';
import { blogCategories, blogTags, blogHref, categoryHref, tagHref, dateLabel, type allPosts } from '@/lib/blog/content';
import type { ArticleBlock, ArticleHeading } from '@/lib/blog/markdown';
import { ChecklistForm } from './ChecklistForm';

type Post = ReturnType<typeof allPosts>[number];
export function ArticleLayout({ post, blocks, headings }: { post: Post; blocks: ArticleBlock[]; headings: ArticleHeading[] }) {
  const downloadIndex = blocks.findIndex(block => block.type === 'download' && block.resource === post.download);
  const url = site.origin + blogHref(post.slug);
  const schema = { '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': url + '#article', headline: post.title, description: post.excerpt, datePublished: post.date, inLanguage: 'en', url, mainEntityOfPage: url, image: site.origin + post.image, author: { '@type': 'Person', name: post.author.name, url: site.origin + '/en/#mike-briller' }, publisher: { '@id': site.origin + '/#organization' }, articleSection: post.categories.map(id => blogCategories.find(c => c.slug === id)!.name), keywords: post.keywords.join(', '), isAccessibleForFree: true };
  return <Shell locale="en" page={'blog/' + post.slug} blogPage breadcrumbs={[{ name: 'Blog', href: blogHref() }, { name: post.title, href: blogHref(post.slug) }]}>
    <article className="blog-article">
      <header className="section blog-article-header">
        <a className="text-link" href={blogHref()}><ArrowLeft size={17} aria-hidden="true"/>Back to field notes</a>
        <div className="blog-category-links">{post.categories.map(id => <a href={categoryHref(id)} key={id}>{blogCategories.find(c => c.slug === id)!.name}</a>)}</div>
        <h1>{post.title}</h1><p className="blog-article-deck">{post.excerpt}</p>
        <div className="blog-author"><img src={post.author.image} width={48} height={48} alt=""/><div><p>{post.author.name}<span>{post.author.role}</span></p><p className="small"><time dateTime={post.date}>{dateLabel(post.date)}</time><span aria-hidden="true"> · </span>{post.readingMinutes} min read</p></div></div>
        <figure className="blog-cover"><img src={post.image} width={1536} height={864} alt={post.imageAlt} fetchPriority="high"/><figcaption>{post.imageCaption}</figcaption></figure>
        {post.download && <a className="blog-download-link" href="#download-checklist"><Download size={20} aria-hidden="true"/><span>Free builder checklist<span>A one-page PDF to use during your site review</span></span><ArrowUpRight size={20} aria-hidden="true"/></a>}
      </header>
      <div className="section blog-article-layout">
        <aside className="blog-contents"><nav aria-label="In this article"><p className="eyebrow">IN THIS ARTICLE</p><ol>{headings.map(heading => <li key={heading.id}><a href={'#' + heading.id}>{heading.title}</a></li>)}</ol>{post.download && <a className="text-link" href="#download-checklist"><Download size={16} aria-hidden="true"/>Free checklist</a>}</nav></aside>
        <div className="blog-article-body">{blocks.map((block, index) => block.type === 'html'
          ? <div key={index} className="article-prose" dangerouslySetInnerHTML={{ __html: block.html }}/>
          : index === downloadIndex ? <ChecklistForm key={index} postSlug={post.slug} inline/> : null)}<nav className="blog-tags" aria-label="Article topics">{post.tags.map(id => <a key={id} href={tagHref(id)}>{blogTags.find(t => t.slug === id)!.name}</a>)}</nav></div>
      </div>
      {post.download && downloadIndex === -1 && <div className="section blog-download-section"><ChecklistForm postSlug={post.slug}/></div>}
    </article>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>
  </Shell>;
}
