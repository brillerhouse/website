'use client';

import { GalleryCategoryIcon } from './GalleryCategoryIcon';
import { useState } from 'react';
import { ArrowUpRight, ChevronDown, Layers, Sparkles, Sun, Wrench } from 'lucide-react';
import { copy, Locale, site } from '@/lib/content';
import { adviceReferences } from '@/lib/advice';
import { AdviceReferences } from './AdviceReferences';

const details = [
  { icon: Sun, x: 58, y: 17 },
  { icon: Layers, x: 79, y: 38 },
  { icon: Wrench, x: 24, y: 12 },
  { icon: Layers, x: 53, y: 68 },
];
const budgetLevels = ['economy', 'standard', 'premium'] as const;
type Budget = typeof budgetLevels[number];

export function BrillDemo({ locale }: { locale: Locale }) {
  const h = copy(locale).home;
  const c = h.brillDemo;
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [budget, setBudget] = useState<Budget>('standard');

  function selectTip(index: number) {
    setActive(index);
    setExpanded(index);
  }

  return <section className="brill-demo" aria-labelledby="brill-demo-heading">
    <div className="brill-demo-visual">
    <figure className="sparks-illustration">
      <div className="sparks-room sparks-room-living">
        <img src="/images/hero-room-after.webp" alt={c.imageAlt} loading="lazy" width={1376} height={768}/>
        <span className="sparks-badge"><Sparkles size={13} aria-hidden="true"/>Smart Sparks</span>
        {details.map((detail, i) => <button
          key={c.tips[i].title}
          className={'spark-hotspot' + (active === i ? ' selected' : '')}
          style={{ left: `${detail.x}%`, top: `${detail.y}%` }}
          aria-label={`${c.tipLabel} ${c.tips[i].title}`}
          aria-pressed={active === i}
          aria-controls={`brill-advice-${i}`}
          title={c.tips[i].spark}
          onClick={() => selectTip(i)}>
          <span><Sparkles size={17} strokeWidth={1.7} aria-hidden="true"/></span>
        </button>)}
      </div>
      <div className="spark-question" aria-live="polite" aria-atomic="true">
          <span className="spark-question-label"><Sparkles size={12} aria-hidden="true"/>{c.sparkLabel} / {c.tips[active].category}</span>
          <p>{c.tips[active].spark}</p>
          <p className="spark-question-specification"><strong>{c.budgets[budget].label}:</strong> {c.tips[active].quick[budget]}</p>
      </div>
      <figcaption>{c.imageNote}</figcaption>
    </figure>
      <fieldset className="brill-budget-selector" aria-describedby="brill-budget-description">
        <legend>{c.budgetLabel}</legend>
        <div className="brill-budget-choices">
          {budgetLevels.map(level => <label key={level} className={budget === level ? 'selected' : ''}>
            <input type="radio" name="briller-demo-budget" value={level} checked={budget === level} onChange={() => setBudget(level)}/>
            <GalleryCategoryIcon category="budgets" id={level === 'standard' ? 'budget' : level} size={22}/><span>{c.budgets[level].label}</span>
          </label>)}
        </div>
        <p id="brill-budget-description" aria-live="polite" aria-atomic="true"><strong>{c.budgets[budget].label}:</strong> {c.budgets[budget].description}</p>
      </fieldset>
    </div>
    <div className="brill-demo-advice">
      <div className="brill-demo-heading">
      <p className="eyebrow">{c.eyebrow}</p>
      <h2 id="brill-demo-heading">{c.title}</h2>
      <p className="brill-demo-intro">{c.intro}</p>
      </div>
      <div className="brill-demo-details">

      <ul className="brill-advice-list">
        {c.tips.map((tip, i) => {
          const Icon = details[i].icon;
          const recommendation = tip.budgets[budget];
          return <li key={tip.title} className={'brill-advice-card' + (active === i ? ' selected' : '')} id={`brill-advice-${i}`}>
            <h3><button className="brill-advice-select" aria-expanded={expanded === i} aria-controls={`brill-specification-${i}`} onClick={() => {
              setActive(i);
              setExpanded(expanded === i ? null : i);
            }}>
              <Icon size={19} strokeWidth={1.6} aria-hidden="true"/>
              <span><span className="brill-advice-category">{tip.category}</span><span className="brill-advice-title">{tip.title}</span></span>
              <ChevronDown className="brill-advice-chevron" size={18} aria-hidden="true"/>
            </button></h3>
            <p className="brill-budget-recommendation"><span>{c.budgets[budget].label} · {c.specificationLabel}</span>{recommendation.specification}</p>
            <div className="brill-specification" id={`brill-specification-${i}`} hidden={expanded !== i}>
              <p className="brill-specification-label">{c.detailLabel}</p>
              <p>{recommendation.detail}</p>
              <p className="brill-budget-difference"><strong>{c.differenceLabel}</strong> {recommendation.difference}</p>
              <AdviceReferences locale={locale} check={tip.check} references={adviceReferences(locale, tip.references)}/>
            </div>
          </li>;
        })}
      </ul>
      <p className="brill-demo-note">{c.projectNote}</p>
      <a className="text-link" href={site.app}>{c.cta}<ArrowUpRight size={17} aria-hidden="true"/></a>
      </div>
    </div>
  </section>;
}
