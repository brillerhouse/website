import { ArrowUpRight, Check, Sparkles } from 'lucide-react';
import type { Locale } from '@/lib/content';
import { solutionExample } from '@/lib/solutions';

const labels = {
  en: {
    eyebrow: 'A closer look', heading: 'Before & after', before: 'Before', after: 'After concept',
    keep: 'What stays', advice: 'What matters for this project', next: 'Your next practical step',
    note: 'Illustrative AI-generated design concept. Both views are examples, not photographs of a customer project or a promise of results.',
    full: 'View full comparison',
  },
  uk: {
    eyebrow: 'Розгляньмо детальніше', heading: 'До та після', before: 'До', after: 'Концепція після',
    keep: 'Що залишається', advice: 'Що важливо для цього проєкту', next: 'Ваш наступний практичний крок',
    note: 'Ілюстративна концепція, створена за допомогою ШІ. Обидва зображення — приклади, а не фото клієнтського проєкту чи обіцянка результату.',
    full: 'Переглянути повне порівняння',
  },
};

export function SolutionExample({ locale, slug }: { locale: Locale; slug: string }) {
  const example = solutionExample(locale, slug);
  const l = labels[locale];
  const image = `/images/solutions/${slug}.webp`;
  return <section className="section solution-example" id="before-after" aria-labelledby="solution-example-heading">
    <p className="eyebrow">{l.eyebrow} / {l.heading}</p>
    <h2 id="solution-example-heading">{example.title}</h2>
    <figure className="solution-example-figure">
      <div className="solution-example-image">
        <img src={image} alt={`${l.before}: ${example.before} ${l.after}: ${example.after}`} width={example.image.width} height={example.image.height} loading="lazy" decoding="async"/>
        <span className="solution-example-label solution-example-label-before" aria-hidden="true">{l.before}</span>
        <span className="solution-example-label solution-example-label-after" aria-hidden="true">{l.after}</span>
      </div>
      <figcaption>
        <div className="solution-example-captions">
          <div><h3>{l.before}</h3><p>{example.before}</p></div>
          <div><h3>{l.after}</h3><p>{example.after}</p></div>
        </div>
        <div className="solution-example-kept"><Check size={20} aria-hidden="true"/><p><strong>{l.keep}: </strong>{example.keep}</p></div>
        <div className="solution-example-disclosure"><p>{l.note}</p><a href={image} className="text-link">{l.full}<ArrowUpRight size={17} aria-hidden="true"/></a></div>
      </figcaption>
    </figure>
    <div className="solution-example-advice-heading"><Sparkles size={23} aria-hidden="true"/><div><p className="eyebrow">BRILLER</p><h3>{l.advice}</h3></div></div>
    <div className="solution-example-advice">{example.advice.map(([title, text], i) => <article key={title}><span className="solution-example-number">0{i + 1}</span><h4>{title}</h4><p>{text}</p></article>)}</div>
    <div className="solution-example-next"><h3>{l.next}</h3><p>{example.check}</p></div>
  </section>;
}
