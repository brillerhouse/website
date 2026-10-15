'use client';

import { useState } from 'react';
import { ArrowUpRight, ChevronDown, Layers, Sparkles, Sun, Wrench } from 'lucide-react';
import { copy, Locale, site } from '@/lib/content';

const details = [
  { icon: Layers, x: 78, y: 22 },
  { icon: Sun, x: 26, y: 44 },
  { icon: Wrench, x: 47, y: 47 },
];

export function BrillDemo({ locale }: { locale: Locale }) {
  const h = copy(locale).home;
  const c = h.brillDemo;
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(0);

  function selectTip(index: number) {
    setActive(index);
    setExpanded(index);
  }

  return <section className="brill-demo" aria-labelledby="brill-demo-heading">
    <figure className="sparks-illustration">
      <div className="sparks-room sparks-room-kitchen">
        <img src="/images/kitchen-comparison.webp" alt={c.imageAlt} loading="lazy" width={1774} height={887}/>
        <span className="sparks-badge"><Sparkles size={13} aria-hidden="true"/>Smart Sparks</span>
        {details.map((detail, i) => <button
          key={h.strip[i]}
          className={'spark-hotspot' + (active === i ? ' selected' : '')}
          style={{ left: `${detail.x}%`, top: `${detail.y}%` }}
          aria-label={`${c.tipLabel} ${h.strip[i]}`}
          aria-pressed={active === i}
          aria-controls={`brill-advice-${i}`}
          title={c.tips[i].spark}
          onClick={() => selectTip(i)}>
          <span><Sparkles size={17} strokeWidth={1.7} aria-hidden="true"/></span>
        </button>)}
        <div className="spark-question" aria-live="polite" aria-atomic="true">
          <span className="spark-question-label"><Sparkles size={12} aria-hidden="true"/>{c.sparkLabel} / {h.strip[active]}</span>
          <p>{c.tips[active].spark}</p>
        </div>
      </div>
      <figcaption>{c.imageNote}</figcaption>
    </figure>
    <div className="brill-demo-advice">
      <p className="eyebrow">{c.eyebrow}</p>
      <h2 id="brill-demo-heading">{c.title}</h2>
      <p className="brill-demo-intro">{c.intro}</p>
      <ul className="brill-advice-list">
        {c.tips.map((tip, i) => {
          const Icon = details[i].icon;
          return <li key={tip.title} className={'brill-advice-card' + (active === i ? ' selected' : '')} id={`brill-advice-${i}`}>
            <h3><button className="brill-advice-select" aria-expanded={expanded === i} aria-controls={`brill-specification-${i}`} onClick={() => {
              setActive(i);
              setExpanded(expanded === i ? null : i);
            }}>
              <Icon size={19} strokeWidth={1.6} aria-hidden="true"/>
              <span><span className="brill-advice-category">{h.strip[i]}</span><span className="brill-advice-title">{tip.title}</span></span>
              <ChevronDown className="brill-advice-chevron" size={18} aria-hidden="true"/>
            </button></h3>
            <p>{tip.advice}</p>
            <div className="brill-specification" id={`brill-specification-${i}`} hidden={expanded !== i}>
              <p className="brill-specification-label">{c.detailLabel}</p>
              <p>{tip.detail}</p>
              <dl className="brill-budget-options">
                <div><dt>{c.standardLabel}</dt><dd>{tip.standard}</dd></div>
                <div><dt>{c.saveLabel}</dt><dd>{tip.save}</dd></div>
                <div><dt>{c.upgradeLabel}</dt><dd>{tip.upgrade}</dd></div>
              </dl>
            </div>
          </li>;
        })}
      </ul>
      <p className="brill-demo-note">{c.projectNote}</p>
      <a className="text-link" href={site.app}>{c.cta}<ArrowUpRight size={17} aria-hidden="true"/></a>
    </div>
  </section>;
}
