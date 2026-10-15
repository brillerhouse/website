import terms from '@/content/terms.json';
import { copy, type Locale } from '@/lib/content';
import { privacyEffectiveDate } from '@/lib/privacy';
import { Block } from './PrivacyPolicy';
import { CurrentEffectiveDate } from './CurrentEffectiveDate';

export function TermsOfService({ locale }: { locale: Locale }) {
  const c = terms[locale];
  return <article className="legal-page privacy-policy terms-policy section">
    <p className="eyebrow">BRILLER / {copy(locale).legal}</p>
    <h1>{c.title}</h1>
    <p className="privacy-subtitle">{c.subtitle}</p>
    <p className="privacy-effective-date">{c.effectiveLabel}: <CurrentEffectiveDate locale={locale} initialDate={privacyEffectiveDate}/></p>
    <nav className="privacy-contents" aria-label={c.contents}>
      <h2>{c.contents}</h2>
      <ol>{c.sections.map(section => <li key={section.id}><a href={`#terms-${section.id}`}>{section.title}</a></li>)}</ol>
    </nav>
    {c.sections.map(section => <section key={section.id} id={`terms-${section.id}`} aria-labelledby={`terms-heading-${section.id}`}>
      <h2 id={`terms-heading-${section.id}`}>{section.title}</h2>
      {section.blocks.map((block, i) => <Block key={i} block={block} locale={locale}/>)}
    </section>)}
  </article>;
}
