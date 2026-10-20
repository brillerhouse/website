import { ArrowLeft, ArrowUpRight, Download } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { site } from '@/lib/content';
import { blogCatalog, blogHref, categoryHref, tagHref, dateLabel, type allPosts } from '@/lib/blog/content';
import { blogCopy } from '@/lib/blog/shared';
import type { Locale } from '@/lib/content';
import type { ArticleBlock, ArticleHeading } from '@/lib/blog/markdown';
import { ChecklistForm } from './ChecklistForm';

type Post = ReturnType<typeof allPosts>[number];
export function ArticleLayout({ locale, post, blocks, headings }: { locale: Locale; post: Post; blocks: ArticleBlock[]; headings: ArticleHeading[] }) {
  const t = blogCopy(locale), { categories: blogCategories, tags: blogTags } = blogCatalog(locale);
  const downloadIndex = blocks.findIndex(block => block.type === 'download' && block.resource === post.download);
  const url = site.origin + blogHref(post.slug, locale);
  const schema = { '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': url + '#article', headline: post.title, description: post.excerpt, datePublished: post.date, inLanguage: locale, url, mainEntityOfPage: url, image: site.origin + post.image, author: { '@type': 'Person', name: post.author.name, url: site.origin + `/${locale}/#mike-briller` }, publisher: { '@id': site.origin + '/#organization' }, articleSection: post.categories.map(id => blogCategories.find(c => c.slug === id)!.name), keywords: post.keywords.join(', '), isAccessibleForFree: true };
  return <Shell locale={locale} page={'blog/' + post.slug} breadcrumbs={[{ name: t.blog, href: blogHref('', locale) }, { name: post.title, href: blogHref(post.slug, locale) }]}>
    <article className="blog-article">
      <header className="section blog-article-header">
        <a className="text-link" href={blogHref('', locale)}><ArrowLeft size={17} aria-hidden="true"/>{t.back}</a>
        <div className="blog-category-links">{post.categories.map(id => <a href={categoryHref(id, locale)} key={id}>{blogCategories.find(c => c.slug === id)!.name}</a>)}</div>
        <h1>{post.title}</h1><p className="blog-article-deck">{post.excerpt}</p>
        <div className="blog-author"><img src={post.author.image} width={48} height={48} alt=""/><div><p>{post.author.name}<span>{post.author.role}</span></p><p className="small"><time dateTime={post.date}>{dateLabel(post.date, locale)}</time><span aria-hidden="true"> · </span>{post.readingMinutes} {t.read}</p></div></div>
        <figure className="blog-cover"><img src={post.image} width={1536} height={864} alt={post.imageAlt} fetchPriority="high"/><figcaption>{post.imageCaption}</figcaption></figure>
        {post.download && <a className="blog-download-link" href="#download-checklist"><Download size={20} aria-hidden="true"/><span>{t.freeChecklist}<span>{t.checklistDeck}</span></span><ArrowUpRight size={20} aria-hidden="true"/></a>}
      </header>
      <div className="section blog-article-layout">
        <aside className="blog-contents"><nav aria-label={t.contents}><p className="eyebrow">{t.contentsEyebrow}</p><ol>{headings.map(heading => <li key={heading.id}><a href={'#' + heading.id}>{heading.title}</a></li>)}</ol>{post.download && <a className="text-link" href="#download-checklist"><Download size={16} aria-hidden="true"/>{t.shortChecklist}</a>}</nav></aside>
        <div className="blog-article-body">{blocks.map((block, index) => block.type === 'html'
          ? <div key={index} className="article-prose" dangerouslySetInnerHTML={{ __html: block.html }}/>
          : index === downloadIndex ? <ChecklistForm key={index} locale={locale} postSlug={post.slug} inline/> : null)}<nav className="blog-tags" aria-label={t.topics}>{post.tags.map(id => <a key={id} href={tagHref(id, locale)}>{blogTags.find(t => t.slug === id)!.name}</a>)}</nav></div>
      </div>
      {post.download && downloadIndex === -1 && <div className="section blog-download-section"><ChecklistForm locale={locale} postSlug={post.slug}/></div>}
    </article>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>
  </Shell>;
}
