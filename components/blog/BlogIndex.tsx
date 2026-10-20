'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Search, X } from 'lucide-react';
import type { Locale } from '@/lib/content';
import { blogCopy, blogHref, categoryHref, tagHref, articleCount } from '@/lib/blog/shared';
import { searchPosts, type SearchPost } from '@/lib/blog/search';

type Post = SearchPost & { date: string; image: string; imageAlt: string; readingMinutes: number; author: { name: string } };
type Taxon = { slug: string; name: string };
export function BlogIndex({ locale, posts, categories, tags, initialCategory = '', initialTag = '' }: { locale: Locale; posts: Post[]; categories: Taxon[]; tags: Taxon[]; initialCategory?: string; initialTag?: string }) {
  const t = blogCopy(locale);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [tag, setTag] = useState(initialTag);
  useEffect(() => {
    const read = () => {
      const params = new URLSearchParams(location.search);
      setQuery(params.get('q')?.slice(0, 240) || '');
      setCategory(params.has('category') ? categories.some(c => c.slug === params.get('category')) ? params.get('category')! : '' : initialCategory);
      setTag(params.has('tag') ? tags.some(t => t.slug === params.get('tag')) ? params.get('tag')! : '' : initialTag);
    };
    read(); window.addEventListener('popstate', read); return () => window.removeEventListener('popstate', read);
  }, [categories, tags, initialCategory, initialTag]);
  function update(next: { query?: string; category?: string; tag?: string }) {
    const values = { query, category, tag, ...next }, params = new URLSearchParams();
    if (values.query) params.set('q', values.query);
    if (values.category) params.set('category', values.category);
    if (values.tag) params.set('tag', values.tag);
    if ((initialCategory && values.category !== initialCategory) || (initialTag && values.tag !== initialTag)) {
      location.assign(blogHref('', locale) + (params.size ? '?' + params.toString() : '')); return;
    }
    setQuery(values.query); setCategory(values.category); setTag(values.tag);
    history.replaceState(null, '', location.pathname + (params.size ? '?' + params.toString() : '') + location.hash);
  }
  const visible = searchPosts(posts, query, category, tag);
  const active = Boolean(query || category || tag);
  return <>
    <form className="blog-search" role="search" onSubmit={event => event.preventDefault()}>
      <label className="blog-search-query" htmlFor="blog-query"><span>{t.searchLabel}</span><div><Search size={20} aria-hidden="true"/><input id="blog-query" type="search" placeholder={t.searchPlaceholder} value={query} maxLength={240} onChange={e => update({ query: e.target.value })} aria-controls="blog-results"/></div></label>
      <label htmlFor="blog-category">{t.category}<select id="blog-category" value={category} onChange={e => update({ category: e.target.value })} aria-controls="blog-results"><option value="">{t.allCategories}</option>{categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
      <label htmlFor="blog-tag">{t.topic}<select id="blog-tag" value={tag} onChange={e => update({ tag: e.target.value })} aria-controls="blog-results"><option value="">{t.allTopics}</option>{tags.map(t => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select></label>
    </form>
    <noscript><p>{t.noScript}</p></noscript>
    <div className="blog-results-status"><p role="status" aria-live="polite" aria-atomic="true">{articleCount(visible.length, locale)}{query ? (locale === 'uk' ? ` за запитом «${query}»` : ` matching “${query}”`) : ''}</p>{active && <button className="text-link" type="button" onClick={() => update({ query: '', category: '', tag: '' })}><X size={16} aria-hidden="true"/>{t.clear}</button>}</div>
    <div className="blog-posts" id="blog-results">
      {visible.map(post => <article className="blog-card" key={post.slug}>
        <a className="blog-card-image" href={blogHref(post.slug, locale)} tabIndex={-1} aria-hidden="true"><img src={post.image} alt="" width={1536} height={864} loading="lazy"/></a>
        <div className="blog-card-copy"><div className="blog-category-links">{post.categories.map(id => <a key={id} href={categoryHref(id, locale)}>{categories.find(c => c.slug === id)?.name}</a>)}</div>
          <h2><a href={blogHref(post.slug, locale)}>{post.title}<ArrowUpRight size={23} aria-hidden="true"/></a></h2>
          <p>{post.excerpt}</p><p className="blog-byline">{post.author.name}<span aria-hidden="true">·</span>{post.readingMinutes} {t.read}<span aria-hidden="true">·</span><time dateTime={post.date}>{new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-GB', { dateStyle: 'medium', timeZone: 'Europe/Kyiv' }).format(new Date(post.date + 'T12:00:00Z'))}</time></p>
          <div className="blog-tags">{post.tags.map(id => <a key={id} href={tagHref(id, locale)}>{tags.find(t => t.slug === id)?.name}</a>)}</div>
        </div>
      </article>)}
      {!visible.length && <div className="blog-empty"><h2>{t.emptyTitle}</h2><p>{t.emptyText}</p><button className="button outline" type="button" onClick={() => update({ query: '', category: '', tag: '' })}>{t.showAll}</button></div>}
    </div>
  </>;
}
