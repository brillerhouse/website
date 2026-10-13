'use client';
import { useState } from 'react';
import { ArrowUpRight, Check, Copy, Search } from 'lucide-react';
import { href, Locale } from '@/lib/content';
import type { Solution, SolutionsLabels } from '@/lib/solutions';
import solutionNavigation from '@/content/solutions/navigation.json';

type DirectoryPage = Pick<Solution, 'slug' | 'label' | 'title' | 'intro' | 'category' | 'audiences' | 'briefs'>;

export function SolutionDirectory({ locale, pages, labels: h }: { locale: Locale; pages: DirectoryPage[]; labels: SolutionsLabels }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [audience, setAudience] = useState('all');
  const words = query.toLocaleLowerCase(locale).trim().split(/\s+/).filter(Boolean);
  const visible = pages.filter(page => {
    const roles = solutionNavigation.audiences.filter(role => page.audiences.includes(role.id)).map(role => role.label[locale]);
    const text = [page.label, page.title, page.intro, ...roles, ...page.briefs].join(' ').toLocaleLowerCase(locale);
    return (category === 'all' || page.category === category) && (audience === 'all' || page.audiences.includes(audience)) && words.every(word => text.includes(word));
  });
  const filtered = query.trim() || category !== 'all' || audience !== 'all';
  function reset() { setQuery(''); setCategory('all'); setAudience('all'); }
  return <>
    <div className="solution-controls">
      <label className="solution-search">{h.searchLabel}<span><Search size={18} aria-hidden="true"/><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={h.searchPlaceholder} aria-controls="solution-results"/></span></label>
      <label className="solution-role">{h.audienceLabel}<select value={audience} onChange={e => setAudience(e.target.value)} aria-controls="solution-results"><option value="all">{h.allAudiences}</option>{solutionNavigation.audiences.map(role => <option key={role.id} value={role.id}>{role.label[locale]}</option>)}</select></label>
    </div>
    <div className="filter-chips solution-filters" role="group" aria-label={h.projectTitle}>
      <button type="button" className={category === 'all' ? 'active' : ''} aria-pressed={category === 'all'} onClick={() => setCategory('all')}>{h.all}</button>
      {solutionNavigation.categories.map(item => <button type="button" key={item.id} className={category === item.id ? 'active' : ''} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.title[locale]}</button>)}
    </div>
    <div className="solution-result-status"><p role="status" aria-live="polite" aria-atomic="true">{visible.length} {h.results}</p>{filtered && <button className="text-link" type="button" onClick={reset}>{h.clear}</button>}</div>
    <div id="solution-results">
      {solutionNavigation.categories.map(item => {
        const items = visible.filter(page => page.category === item.id);
        if (!items.length) return null;
        return <section className="solution-directory-group" key={item.id} aria-labelledby={'category-' + item.id}>
          <h3 id={'category-' + item.id}>{item.title[locale]} <span>{items.length.toString().padStart(2, '0')}</span></h3>
          <div className="solution-card-grid">{items.map(page => <a className="solution-card" key={page.slug} href={href(locale, 'solutions/' + page.slug)}>
            <span className="solution-card-role">{solutionNavigation.audiences.find(role => role.id === page.audiences[0])?.label[locale]}</span>
            <h4>{page.label}</h4><p>{page.intro}</p><span className="solution-card-link">{h.open}<ArrowUpRight size={18} aria-hidden="true"/></span>
          </a>)}</div>
        </section>;
      })}
      {!visible.length && <div className="solution-empty"><p>{h.empty}</p><button type="button" className="button outline" onClick={reset}>{h.clear}</button></div>}
    </div>
  </>;
}

export function SolutionBriefs({ briefs, labels: h }: { briefs: string[]; labels: SolutionsLabels }) {
  const [copied, setCopied] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  async function copyBrief(text: string, index: number) {
    try { await navigator.clipboard.writeText(text); setCopied(index); setFailed(false); }
    catch { setCopied(null); setFailed(true); }
  }
  return <><ul className="solution-briefs">{briefs.map((brief, i) => <li key={brief}><p>{brief}</p><button className="text-link" type="button" onClick={() => copyBrief(brief, i)} aria-label={`${h.copyBrief}: ${brief}`}>{copied === i ? <Check size={17} aria-hidden="true"/> : <Copy size={17} aria-hidden="true"/>}{copied === i ? h.copied : h.copyBrief}</button></li>)}</ul><p className="small" role="status" aria-live="polite">{failed ? h.copyFailed : copied !== null ? h.copied : ''}</p></>;
}
