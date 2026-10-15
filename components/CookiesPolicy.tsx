import cookies from '@/content/cookies.json';
import { copy, type Locale } from '@/lib/content';
import { Block } from './PrivacyPolicy';

export function CookiesPolicy({ locale }: { locale: Locale }) {
  const c = cookies[locale];
  return <article className="legal-page privacy-policy cookies-policy section">
    <p className="eyebrow">BRILLER / {copy(locale).legal}</p>
    <h1>{c.title}</h1>
    <nav className="privacy-contents" aria-label={c.contents}>
      <h2>{c.contents}</h2>
      <ol>{c.sections.map(section => <li key={section.id}><a href={`#cookies-${section.id}`}>{section.title}</a></li>)}</ol>
    </nav>
    {c.sections.map(section => <section key={section.id} id={`cookies-${section.id}`} aria-labelledby={`cookies-heading-${section.id}`}>
      <h2 id={`cookies-heading-${section.id}`}>{section.title}</h2>
      {section.blocks.map((block, i) => <Block key={i} block={block} locale={locale}/>)}
    </section>)}
  </article>;
}
