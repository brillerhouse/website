import type { Locale } from '@/lib/content';
import { solutionAdvice, solutionBudgets, solutionExample } from '@/lib/solutions';
import { SolutionProject } from './SolutionProject';

const labels = {
  en: {
    eyebrow: 'A closer look', heading: 'Before & after', before: 'Before', after: 'After concept',
    advice: 'Advice for this project', next: 'Your next practical step',
    compare: 'Compare before and after',
    tipLabel: 'Explore advice for', readAdvice: 'Read advice', closeSpark: 'Close advice bubble',
    take: 'Briller’s take', budget: 'Explore advice for your budget',
    budgets: { economy: 'Economy', standard: 'Standard', premium: 'Premium' },
    budgetNote: 'The comparison shows one illustrative direction. Budget options explore alternative specifications for the project.',
    specification: 'Suggested specification', detail: 'How to implement it', difference: 'What changes:',
    adviceNote: 'Illustrative specifications. Confirm dimensions, loads, compatibility and local requirements with your project team. Use the current technical data and installation instructions for your selected products.',
  },
  uk: {
    eyebrow: 'Розгляньмо детальніше', heading: 'До та після', before: 'До', after: 'Концепція після',
    advice: 'Поради для цього проєкту', next: 'Ваш наступний практичний крок',
    compare: 'Порівняти до та після',
    tipLabel: 'Переглянути пораду про', readAdvice: 'Переглянути пораду', closeSpark: 'Закрити підказку',
    take: 'Погляд Briller', budget: 'Дослідіть поради під свій бюджет',
    budgets: { economy: 'Економ', standard: 'Стандарт', premium: 'Преміум' },
    budgetNote: 'Порівняння показує один ілюстративний напрям. Варіанти бюджету досліджують альтернативні специфікації проєкту.',
    specification: 'Рекомендована специфікація', detail: 'Як це реалізувати', difference: 'Що змінюється:',
    adviceNote: 'Ілюстративні специфікації. Узгодьте розміри, навантаження, сумісність і місцеві вимоги з командою проєкту. Використовуйте чинні технічні карти й інструкції монтажу обраних виробів.',
  },
};

export function SolutionExample({ locale, slug }: { locale: Locale; slug: string }) {
  const example = solutionExample(locale, slug);
  const l = labels[locale];
  return <section className="section solution-example" id="before-after" aria-labelledby="solution-example-heading">
    <p className="eyebrow">{l.eyebrow} / {l.heading}</p>
    <h2 id="solution-example-heading">{example.title}</h2>
    <SolutionProject locale={locale} slug={slug} example={example} budgets={solutionBudgets(locale, slug)} tips={solutionAdvice(locale, slug)} labels={l}/>
  </section>;
}
