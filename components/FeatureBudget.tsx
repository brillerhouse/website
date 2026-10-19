'use client';

import { GalleryCategoryIcon } from './GalleryCategoryIcon';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { SolutionAdvice } from '@/lib/solutions';
import type { featuresCopy } from '@/lib/features';

const levels = ['economy', 'standard', 'premium'] as const;

export function FeatureBudget({ advice, labels: c, href }: {
  advice: SolutionAdvice;
  labels: ReturnType<typeof featuresCopy>['budget'];
  href: string;
}) {
  const [budget, setBudget] = useState<typeof levels[number]>('standard');
  const specification = advice.budgets[budget];
  return <div className="feature-budget-example">
    <p className="eyebrow">{c.example}</p><h3>{advice.title}</h3>
    <fieldset className="feature-budget-selector">
      <legend>{c.try}</legend>
      <div className="feature-budget-choices">{levels.map(level => <label key={level} className={budget === level ? 'selected' : ''}>
        <input type="radio" name="feature-budget" value={level} checked={budget === level} onChange={() => setBudget(level)} aria-controls="feature-budget-detail"/>
        <GalleryCategoryIcon category="budgets" id={level === 'standard' ? 'budget' : level} size={22}/><span>{c.labels[level]}</span>
      </label>)}</div>
    </fieldset>
    <div id="feature-budget-detail" aria-live="polite" aria-atomic="true">
      <p className="feature-budget-level">{c.labels[budget]}</p>
      <dl className="feature-specification">
        <div><dt>{c.specification}</dt><dd>{specification.specification}</dd></div>
        <div><dt>{c.implementation}</dt><dd>{specification.detail}</dd></div>
        <div><dt>{c.difference}</dt><dd>{specification.difference}</dd></div>
      </dl>
    </div>
    <p className="feature-budget-check"><strong>{c.check}</strong>{advice.check}</p>
    <a className="text-link" href={href}>{c.link}<ArrowUpRight size={16} aria-hidden="true"/></a>
  </div>;
}
