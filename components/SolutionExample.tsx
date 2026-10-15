import type { Locale } from '@/lib/content';
import { solutionBudgets, solutionExample } from '@/lib/solutions';
import { SolutionProject } from './SolutionProject';

const labels = {
  en: {
    eyebrow: 'A closer look', heading: 'Before & after', before: 'Before', after: 'After concept',
    keep: 'What stays', advice: 'What matters for this project', next: 'Your next practical step',
    note: 'Illustrative AI-generated design concept. Both views are examples, not photographs of a customer project or a promise of results.',
    full: 'View full comparison',
    compare: 'Compare before and after',
    take: 'Briller’s take', budget: 'Explore advice for your budget',
    budgets: { economy: 'Economy', standard: 'Standard', premium: 'Premium' },
    budgetNote: 'The comparison shows one illustrative direction. Budget options explore alternative specifications for the project.',
    technical: 'Technical advice', materials: 'Materials & specification', installation: 'Installation & coordination', tradeoff: 'What changes with this budget',
  },
  uk: {
    eyebrow: 'Розгляньмо детальніше', heading: 'До та після', before: 'До', after: 'Концепція після',
    keep: 'Що залишається', advice: 'Що важливо для цього проєкту', next: 'Ваш наступний практичний крок',
    note: 'Ілюстративна концепція, створена за допомогою ШІ. Обидва зображення — приклади, а не фото клієнтського проєкту чи обіцянка результату.',
    full: 'Переглянути повне порівняння',
    compare: 'Порівняти до та після',
    take: 'Погляд Briller', budget: 'Дослідіть поради під свій бюджет',
    budgets: { economy: 'Економ', standard: 'Стандарт', premium: 'Преміум' },
    budgetNote: 'Порівняння показує один ілюстративний напрям. Варіанти бюджету досліджують альтернативні специфікації проєкту.',
    technical: 'Технічні поради', materials: 'Матеріали та специфікація', installation: 'Монтаж і узгодження', tradeoff: 'Що змінюється з цим бюджетом',
  },
};

export function SolutionExample({ locale, slug }: { locale: Locale; slug: string }) {
  const example = solutionExample(locale, slug);
  const l = labels[locale];
  return <section className="section solution-example" id="before-after" aria-labelledby="solution-example-heading">
    <p className="eyebrow">{l.eyebrow} / {l.heading}</p>
    <h2 id="solution-example-heading">{example.title}</h2>
    <SolutionProject slug={slug} example={example} budgets={solutionBudgets(locale, slug)} labels={l}/>
  </section>;
}
