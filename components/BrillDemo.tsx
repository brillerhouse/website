'use client';

import { useState } from 'react';
import { Layers, Sparkles, Sun, Wrench } from 'lucide-react';
import { copy, Locale } from '@/lib/content';

const details = [
  { icon: Layers, x: 43, y: 43 },
  { icon: Sun, x: 60, y: 20 },
  { icon: Wrench, x: 84, y: 61 },
];

export function BrillDemo({ locale }: { locale: Locale }) {
  const h = copy(locale).home;
  const c = h.brillDemo;
  const [active, setActive] = useState(0);

  return <section className="brill-demo" aria-labelledby="brill-demo-heading">
    <figure className="sparks-illustration">
      <div className="sparks-room">
        <img src="/images/brill-insights-room.webp" alt={c.imageAlt} loading="lazy" width={1448} height={1086}/>
        <span className="sparks-badge"><Sparkles size={13} aria-hidden="true"/>Smart Sparks</span>
        {details.map((detail, i) => <button
          key={h.strip[i]}
          className={'spark-hotspot' + (active === i ? ' selected' : '')}
          style={{ left: `${detail.x}%`, top: `${detail.y}%` }}
          aria-label={`${c.tipLabel} ${h.strip[i]}`}
          aria-pressed={active === i}
          aria-controls={`brill-advice-${i}`}
          title={c.tips[i].spark}
          onClick={() => setActive(i)}>
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
            <h3><button className="brill-advice-select" aria-pressed={active === i} onClick={() => setActive(i)}>
              <Icon size={19} strokeWidth={1.6} aria-hidden="true"/>
              <span><span className="brill-advice-category">{h.strip[i]}</span><span className="brill-advice-title">{tip.title}</span></span>
            </button></h3>
            <p>{tip.advice}</p>
          </li>;
        })}
      </ul>
    </div>
  </section>;
}
