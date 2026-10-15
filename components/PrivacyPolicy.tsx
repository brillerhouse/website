import privacy from '@/content/privacy.json';
import { copy, href, type Locale } from '@/lib/content';
import { privacyDateLabel, privacyEffectiveDate } from '@/lib/privacy';

import { CurrentEffectiveDate } from './CurrentEffectiveDate';

type PolicyBlock = { type: string; text?: string; items?: string[]; columns?: string[]; rows?: string[][] };

function PolicyText({ text, locale }: { text: string; locale: Locale }) {
  return <>{text.split(/(\[EFFECTIVE DATE\]|briller\.house\/pricing|https?:\/\/[^\s]+|hello@briller\.house|Terms of Service|Умовах користування|build\.briller\.house|briller\.house)/g).map((part, i) => {
    if (part === '[EFFECTIVE DATE]') return <CurrentEffectiveDate key={i} locale={locale} initialDate={privacyEffectiveDate}/>;
    if (part === 'briller.house/pricing') return <a key={i} href={href(locale, 'pricing')}>{part}</a>;
    if (part === 'hello@briller.house') return <a key={i} href={`mailto:${part}`}>{part}</a>;
    if (part === 'Terms of Service' || part === 'Умовах користування') return <a key={i} href={href(locale, 'terms')}>{part}</a>;
    if (part === 'build.briller.house' || part === 'briller.house') return <a key={i} href={`https://${part}`}>{part}</a>;
    if (/^https?:\/\//.test(part)) {
      const url = part.replace(/[.,;!?]+$/, '');
      return <span key={i}><a href={url} rel="noopener noreferrer" target="_blank">{url}</a>{part.slice(url.length)}</span>;
    }
    return part;
  })}</>;
}

export function Block({ block, locale }: { block: PolicyBlock; locale: Locale }) {
  if (block.type === 'heading') return <h3>{block.text}</h3>;
  if (block.type === 'list' && block.items) return <ul>{block.items.map((item, i) => <li key={i}><PolicyText text={item} locale={locale}/></li>)}</ul>;
  if (block.type === 'table' && block.columns && block.rows) return <div className="privacy-table-wrap" role="region" tabIndex={0} aria-label={block.columns.join(' / ')}>
    <table><thead><tr>{block.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead>
      <tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0
        ? <th key={j} scope="row"><PolicyText text={cell} locale={locale}/></th>
        : <td key={j}><PolicyText text={cell} locale={locale}/></td>)}</tr>)}</tbody></table>
  </div>;
  return <p><PolicyText text={block.text || ''} locale={locale}/></p>;
}

export function PrivacyPolicy({ locale }: { locale: Locale }) {
  const c = privacy[locale];
  return <article className="legal-page privacy-policy section">
    <p className="eyebrow">BRILLER / {copy(locale).legal}</p>
    <h1>{c.title}</h1>
    <p className="privacy-subtitle">{c.subtitle}</p>
    <p className="privacy-effective-date">{c.effectiveLabel}: <time dateTime={privacyEffectiveDate}>{privacyDateLabel(locale)}</time></p>
    {c.intro.map((text, i) => <p key={i}><PolicyText text={text} locale={locale}/></p>)}
    <nav className="privacy-contents" aria-label={c.contents}>
      <h2>{c.contents}</h2>
      <ol>{c.sections.map(section => <li key={section.id}><a href={`#privacy-${section.id}`}>{section.title}</a></li>)}</ol>
    </nav>
    {c.sections.map(section => <section key={section.id} id={`privacy-${section.id}`} aria-labelledby={`privacy-heading-${section.id}`}>
      <h2 id={`privacy-heading-${section.id}`}>{section.title}</h2>
      {section.blocks.map((block, i) => <Block key={i} block={block} locale={locale}/>)}
    </section>)}
  </article>;
}
