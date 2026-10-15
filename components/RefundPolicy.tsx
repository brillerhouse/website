import refunds from '@/content/refunds.json';
import { copy, type Locale } from '@/lib/content';
import { Block } from './PrivacyPolicy';

export function RefundPolicy({ locale }: { locale: Locale }) {
  const c = refunds[locale];
  return <article className="legal-page privacy-policy refunds-policy section">
    <p className="eyebrow">BRILLER / {copy(locale).legal}</p>
    <h1>{c.title}</h1>
    <nav className="privacy-contents" aria-label={c.contents}>
      <h2>{c.contents}</h2>
      <ol>{c.sections.map(section => <li key={section.id}><a href={`#refunds-${section.id}`}>{section.title}</a></li>)}</ol>
    </nav>
    {c.sections.map(section => <section key={section.id} id={`refunds-${section.id}`} aria-labelledby={`refunds-heading-${section.id}`}>
      <h2 id={`refunds-heading-${section.id}`}>{section.title}</h2>
      {section.blocks.map((block, i) => <Block key={i} block={block} locale={locale}/>)}
    </section>)}
  </article>;
}
