'use client';

import { useState } from 'react';
import { ArrowUpRight, Check, Sparkles } from 'lucide-react';
import type { solutionExample } from '@/lib/solutions';
import { SolutionComparison } from './SolutionComparison';

const budgetLevels = ['economy', 'standard', 'premium'] as const;
type Budget = typeof budgetLevels[number];
type Recommendation = { summary: string; materials: string; installation: string; tradeoff: string };
type Labels = {
  before: string; after: string; keep: string; advice: string; next: string; note: string; full: string; compare: string;
  take: string; budget: string; budgetNote: string; technical: string; materials: string; installation: string; tradeoff: string;
  budgets: Record<Budget, string>;
};

export function SolutionProject({ slug, example, budgets, labels: l }: {
  slug: string;
  example: ReturnType<typeof solutionExample>;
  budgets: Record<Budget, Recommendation>;
  labels: Labels;
}) {
  const [budget, setBudget] = useState<Budget>('standard');
  const recommendation = budgets[budget];
  const image = `/images/solutions/${slug}.webp`;
  const technical = [
    [l.materials, recommendation.materials],
    [l.installation, recommendation.installation],
    [l.tradeoff, recommendation.tradeoff],
  ];

  return <>
    <figure className="solution-example-figure">
      <div className="solution-example-layout">
        <div className="solution-project-take">
          <p className="eyebrow"><Sparkles size={18} aria-hidden="true"/>BRILLER</p>
          <h3>{l.take}</h3>
          <p className="solution-project-summary" aria-live="polite" aria-atomic="true">{recommendation.summary}</p>
          <div className="solution-project-step"><h4>{l.next}</h4><p>{example.check}</p></div>
          <fieldset className="brill-budget-selector solution-project-budget" aria-describedby="solution-budget-note">
            <legend>{l.budget}</legend>
            <div className="brill-budget-choices">{budgetLevels.map(level => <label key={level} className={budget === level ? 'selected' : ''}>
              <input type="radio" name="solution-project-budget" value={level} checked={budget === level} onChange={() => setBudget(level)} aria-controls="solution-technical-advice"/>
              <span>{l.budgets[level]}</span>
            </label>)}</div>
            <p id="solution-budget-note">{l.budgetNote}</p>
          </fieldset>
        </div>
        <SolutionComparison image={image} width={example.image.width} height={example.image.height}
          alt={`${l.before}: ${example.before} ${l.after}: ${example.after}`} before={l.before} after={l.after}
          label={l.compare} descriptionId="solution-example-disclosure"/>
      </div>
      <figcaption>
        <div className="solution-example-captions">
          <div><h3>{l.before}</h3><p>{example.before}</p></div>
          <div><h3>{l.after}</h3><p>{example.after}</p></div>
        </div>
        <section className="solution-project-technical" id="solution-technical-advice" aria-labelledby="solution-technical-heading">
          <div className="solution-example-advice-heading"><Sparkles size={23} aria-hidden="true"/><div><p className="eyebrow">{l.advice}</p><h3 id="solution-technical-heading">{l.technical}<span className="solution-project-tier">{l.budgets[budget]}</span></h3></div></div>
          <div className="solution-example-advice">{technical.map(([title, text], i) => <article key={title}>
            <span className="solution-example-number">0{i + 1}</span><h4>{title}</h4><p className="solution-project-specification">{text}</p>
            <div className="solution-project-consideration"><h5>{example.advice[i][0]}</h5><p>{example.advice[i][1]}</p></div>
          </article>)}</div>
        </section>
        <div className="solution-example-kept"><Check size={20} aria-hidden="true"/><p><strong>{l.keep}: </strong>{example.keep}</p></div>
        <div className="solution-example-disclosure"><p id="solution-example-disclosure">{l.note}</p><a href={image} className="text-link">{l.full}<ArrowUpRight size={17} aria-hidden="true"/></a></div>
      </figcaption>
    </figure>
  </>;
}
