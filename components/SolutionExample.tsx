import type { Locale } from '@/lib/content';
import { solutionAdvice, solutionBudgets, solutionExample } from '@/lib/solutions';
import { SolutionProject } from './SolutionProject';

const labels = {
  en: {
    eyebrow: 'A closer look', heading: 'Before & after', before: 'Before', after: 'After concept',
    advice: 'Advice for this project', next: 'Your next practical step',
    note: 'Illustrative AI-generated design concept. Both views are examples, not photographs of a customer project or a promise of results.',
    full: 'View full comparison',
    compare: 'Compare before and after',
    tipLabel: 'Explore advice for', readAdvice: 'Read advice',
    take: 'Briller’s take', budget: 'Explore advice for your budget',
    budgets: { economy: 'Economy', standard: 'Standard', premium: 'Premium' },
    budgetNote: 'The comparison shows one illustrative direction. Budget options explore alternative specifications for the project.',
    specification: 'Suggested specification', detail: 'How to implement it', difference: 'What changes:',
    adviceNote: 'Example specifications for this use case. Confirm dimensions, product compatibility and any required site design with your installer before ordering or building.',
  },
  uk: {
    eyebrow: 'Розгляньмо детальніше', heading: 'До та після', before: 'До', after: 'Концепція після',
    advice: 'Поради для цього проєкту', next: 'Ваш наступний практичний крок',
    note: 'Ілюстративна концепція, створена за допомогою ШІ. Обидва зображення — приклади, а не фото клієнтського проєкту чи обіцянка результату.',
    full: 'Переглянути повне порівняння',
    compare: 'Порівняти до та після',
    tipLabel: 'Переглянути пораду про', readAdvice: 'Переглянути пораду',
    take: 'Погляд Briller', budget: 'Дослідіть поради під свій бюджет',
    budgets: { economy: 'Економ', standard: 'Стандарт', premium: 'Преміум' },
    budgetNote: 'Порівняння показує один ілюстративний напрям. Варіанти бюджету досліджують альтернативні специфікації проєкту.',
    specification: 'Рекомендована специфікація', detail: 'Як це реалізувати', difference: 'Що змінюється:',
    adviceNote: 'Приклади специфікацій для цього сценарію. До замовлення чи виконання узгодьте з монтажником розміри, сумісність виробів і необхідні проєктні рішення для об’єкта.',
  },
};

export function SolutionExample({ locale, slug }: { locale: Locale; slug: string }) {
  const example = solutionExample(locale, slug);
  const l = labels[locale];
  return <section className="section solution-example" id="before-after" aria-labelledby="solution-example-heading">
    <p className="eyebrow">{l.eyebrow} / {l.heading}</p>
    <h2 id="solution-example-heading">{example.title}</h2>
    <SolutionProject slug={slug} example={example} budgets={solutionBudgets(locale, slug)} tips={solutionAdvice(locale, slug)} labels={l}/>
  </section>;
}
