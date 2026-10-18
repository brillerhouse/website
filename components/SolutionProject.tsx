'use client';

import { useState } from 'react';
import { ChevronDown, ClipboardList, Layers, Ruler, Sparkles, Sun, Wrench } from 'lucide-react';
import type { SolutionAdvice, solutionExample } from '@/lib/solutions';
import type { Locale } from '@/lib/content';
import { AdviceReferences } from './AdviceReferences';
import { SolutionComparison } from './SolutionComparison';

const budgetLevels = ['economy', 'standard', 'premium'] as const;
type Budget = typeof budgetLevels[number];
const icons = { lighting: Sun, materials: Layers, joinery: Wrench, layout: Ruler, planning: ClipboardList };
type Labels = {
  before: string; after: string; advice: string; next: string; compare: string;
  tipLabel: string; readAdvice: string; closeSpark: string;
  take: string; budget: string; budgetNote: string; specification: string; detail: string; difference: string; adviceNote: string;
  budgets: Record<Budget, string>;
};

export function SolutionProject({ locale, slug, example, budgets, tips, labels: l }: {
  locale: Locale;
  slug: string;
  example: ReturnType<typeof solutionExample>;
  budgets: Record<Budget, { summary: string }>;
  tips: SolutionAdvice[];
  labels: Labels;
}) {
  const [budget, setBudget] = useState<Budget>('standard');
  const initialTip = tips.find(tip => tip.position) ?? tips[0];
  const [expanded, setExpanded] = useState<string | null>(initialTip.id);
  const [active, setActive] = useState(initialTip.id);
  const image = `/images/solutions/${slug}.webp`;

  return <figure className="solution-example-figure">
    <div className="solution-example-layout">
      <div className="solution-project-take">
        <p className="eyebrow"><Sparkles size={18} aria-hidden="true"/>BRILLER</p>
        <h3>{l.take}</h3>
        <p className="solution-project-summary" aria-live="polite" aria-atomic="true">{budgets[budget].summary}</p>
        <div className="solution-project-step"><h4>{l.next}</h4><p>{example.check}</p></div>
      </div>
      <div className="solution-project-visual">
        <SolutionComparison image={image} width={example.image.width} height={example.image.height} focusY={example.image.focusY}
          alt={`${l.before}: ${example.before} ${l.after}: ${example.after}`} before={l.before} after={l.after}
          label={l.compare}
          sparks={tips.flatMap(tip => tip.position ? [{ id: tip.id, title: tip.title, specification: tip.budgets[budget].specification, position: tip.position }] : [])} selectedSpark={active} sparkLabel={l.tipLabel}
          budgetLabel={l.budgets[budget]}
          readAdvice={l.readAdvice} closeSpark={l.closeSpark}
          onReadAdvice={id => setExpanded(id)} onSelectSpark={id => { setActive(id); setExpanded(id); }}/>
      </div>
    </div>
    <figcaption>
      <section className="solution-project-advice" id="solution-technical-advice" aria-labelledby="solution-advice-heading">
        <div className="solution-advice-layout">
          <div className="solution-advice-budget">
            <fieldset className="brill-budget-selector solution-project-budget" aria-describedby="solution-budget-note">
              <legend>{l.budget}</legend>
              <div className="brill-budget-choices">{budgetLevels.map(level => <label key={level} className={budget === level ? 'selected' : ''}>
                <input type="radio" name="solution-project-budget" value={level} checked={budget === level} onChange={() => setBudget(level)} aria-controls="solution-advice-options"/>
                <span>{l.budgets[level]}</span>
              </label>)}</div>
              <p id="solution-budget-note">{l.budgetNote}</p>
            </fieldset>
          </div>
          <div className="solution-advice-content">
            <div className="solution-advice-header">
              <h3 id="solution-advice-heading"><Sparkles size={23} aria-hidden="true"/>{l.advice}</h3>
            </div>
            <ul className="brill-advice-list" id="solution-advice-options">
              {tips.map(tip => {
                const Icon = icons[tip.kind as keyof typeof icons] ?? ClipboardList;
                const recommendation = tip.budgets[budget];
                const open = expanded === tip.id;
                return <li key={tip.id} className={'brill-advice-card' + (active === tip.id ? ' selected' : '')} id={`solution-advice-${tip.id}`} data-advice={tip.id}>
                  <h4><button className="brill-advice-select" aria-expanded={open} aria-controls={`solution-specification-${tip.id}`} onClick={() => { setActive(tip.id); setExpanded(open ? null : tip.id); }}>
                    <Icon size={19} strokeWidth={1.6} aria-hidden="true"/>
                    <span><span className="brill-advice-category">{tip.category}</span><span className="brill-advice-title">{tip.title}</span></span>
                    <ChevronDown className="brill-advice-chevron" size={18} aria-hidden="true"/>
                  </button></h4>
                  <p className="brill-budget-recommendation"><span>{l.budgets[budget]} · {l.specification}</span>{recommendation.specification}</p>
                  <div className="brill-specification" id={`solution-specification-${tip.id}`} hidden={!open}>
                    <p className="brill-specification-label">{l.detail}</p>
                    <p>{recommendation.detail}</p>
                    <p className="brill-budget-difference"><strong>{l.difference}</strong> {recommendation.difference}</p>
                    <AdviceReferences locale={locale} check={tip.check} references={tip.references}/>
                  </div>
                </li>;
              })}
            </ul>
            <p className="solution-advice-note">{l.adviceNote}</p>
          </div>
        </div>
      </section>
    </figcaption>
  </figure>;
}
