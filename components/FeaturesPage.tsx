import { ArrowUpRight, Check, FolderOpen, Images, Layers, Lightbulb, Mic, PencilRuler, RefreshCw, ScanLine, ShoppingBag, Sparkles } from 'lucide-react';
import { href, site, type Locale } from '@/lib/content';
import { featuresCopy } from '@/lib/features';
import { solutionAdvice, solutionHref } from '@/lib/solutions';
import pricing from '@/content/plans.json';
import { FeatureBudget } from './FeatureBudget';

const icons = [ScanLine, Images, Layers, RefreshCw, ShoppingBag, Sparkles];

export function FeaturesPage({ locale }: { locale: Locale }) {
  const c = featuresCopy(locale);
  const flooring = solutionAdvice(locale, 'flooring-finish-comparison')[0];
  const schema = {
    '@context': 'https://schema.org', '@type': 'WebPage',
    '@id': site.origin + href(locale, 'features') + '#webpage',
    url: site.origin + href(locale, 'features'), name: c.seo.title, description: c.seo.description,
    inLanguage: locale, isPartOf: { '@id': site.origin + '/#website' },
    hasPart: c.features.map(feature => ({ '@type': 'WebPageElement', name: feature.label, url: site.origin + href(locale, 'features') + '#' + feature.id }))
  };
  return <>
    <section className="section features-hero">
      <div><p className="eyebrow">{c.eyebrow}</p><h1>{c.title}</h1><p className="features-intro">{c.intro}</p>
        <div className="button-row"><a className="button" href={site.app}>{c.start}<ArrowUpRight size={17} aria-hidden="true"/></a><a className="text-link" href="#feature-overview">{c.explore}<ArrowUpRight size={17} aria-hidden="true"/></a></div>
      </div>
      <figure className="features-hero-photo"><img src="/images/gallery/quality-featured-living-contemporary-premium.webp" width={1448} height={1086} alt={c.imageAlt} fetchPriority="high"/><figcaption>{c.imageNote}</figcaption></figure>
    </section>
    <nav className="section feature-overview" id="feature-overview" aria-label={c.navigation}>
      {c.features.map((feature, index) => { const Icon = icons[index]; return <a href={'#' + feature.id} key={feature.id}><Icon size={23} strokeWidth={1.5} aria-hidden="true"/><span>{feature.label}</span><ArrowUpRight size={16} aria-hidden="true"/></a>; })}
    </nav>
    <section className="section features-analysis" id="room-analysis" aria-labelledby="room-analysis-title">
      <div className="features-section-intro"><p className="eyebrow">{c.analysis.eyebrow}</p><h2 id="room-analysis-title">{c.analysis.title}</h2><p>{c.analysis.text}</p></div>
      <div className="features-analysis-grid"><ul className="features-output-list">{c.analysis.outputs.map(([title, text]) => <li key={title}><div><h3>{title}</h3><p>{text}</p></div></li>)}</ul>
        <aside className="features-room-brief"><p className="eyebrow">{c.analysis.exampleLabel}</p><h3>{c.analysis.exampleTitle}</h3><dl>{c.analysis.example.map(([title, text]) => <div key={title}><dt><Check size={17} aria-hidden="true"/>{title}</dt><dd>{text}</dd></div>)}</dl></aside>
      </div>
    </section>
    <section className="section features-moodboard" id="moodboards" aria-labelledby="moodboards-title">
      <div className="features-section-intro"><p className="eyebrow">{c.moodboard.eyebrow}</p><h2 id="moodboards-title">{c.moodboard.title}</h2><p>{c.moodboard.text}</p><ul className="features-check-list">{c.moodboard.points.map(point => <li key={point}><Check size={16} aria-hidden="true"/>{point}</li>)}</ul><a className="text-link" href={href(locale, 'gallery')}>{c.moodboard.link}<ArrowUpRight size={17} aria-hidden="true"/></a></div>
      <div className="feature-moodboard-example"><p className="eyebrow">{c.moodboard.boardLabel}</p><h3>{c.moodboard.boardTitle}</h3><ul className="feature-moodboard-picks">{c.moodboard.picks.map(([category, item]) => <li key={category}><span>{category}</span><strong>{item}</strong></li>)}</ul><dl>{c.moodboard.notes.map(([title, text]) => <div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}</dl></div>
    </section>
    <section className="section features-budgets" id="budget-advice" aria-labelledby="budget-advice-title">
      <div className="features-section-intro"><p className="eyebrow">{c.budget.eyebrow}</p><h2 id="budget-advice-title">{c.budget.title}</h2><p>{c.budget.text}</p><p className="features-example-note">{c.budget.note}</p></div>
      <FeatureBudget advice={flooring} labels={c.budget} href={solutionHref(locale, 'flooring-finish-comparison')}/>
    </section>
    <section className="section features-iterations" id="design-iterations" aria-labelledby="design-iterations-title">
      <div className="features-section-intro"><p className="eyebrow">{c.iterations.eyebrow}</p><h2 id="design-iterations-title">{c.iterations.title}</h2><p>{c.iterations.text}</p></div>
      <p className="eyebrow features-example-label">{c.iterations.example}</p><ol className="features-iteration-steps">{c.iterations.steps.map(([title, text], index) => <li key={title}><span className="features-iteration-number">0{index + 1}</span><h3>{title}</h3><blockquote>{text}</blockquote></li>)}</ol><p className="features-example-note">{c.iterations.note}</p>
    </section>
    <section className="section features-shopping" id="shop-the-look" aria-labelledby="shop-the-look-title">
      <div className="features-section-intro"><p className="eyebrow">{c.shopping.eyebrow}</p><h2 id="shop-the-look-title">{c.shopping.title}</h2><p>{c.shopping.text}</p><a className="text-link" href={site.app}>{c.shopping.link}<ArrowUpRight size={17} aria-hidden="true"/></a></div>
      <div className="features-shopping-criteria">{c.shopping.criteria.map(([title, text], index) => { const Icon = [ShoppingBag, Lightbulb, Layers][index]; return <article key={title}><Icon size={23} strokeWidth={1.5} aria-hidden="true"/><div><h3>{title}</h3><p>{text}</p></div></article>; })}<p className="features-example-note">{c.shopping.note}</p></div>
    </section>
    <section className="section features-sparks" id="smart-sparks" aria-labelledby="smart-sparks-title">
      <div className="features-section-intro"><p className="eyebrow">{c.sparks.eyebrow}</p><h2 id="smart-sparks-title">{c.sparks.title}</h2><p>{c.sparks.text}</p></div>
      <div className="features-sparks-grid"><div><p className="eyebrow">{c.sparks.questionsLabel}</p><ul>{c.sparks.questions.map(question => <li key={question}><Sparkles size={20} aria-hidden="true"/><span>{question}</span></li>)}</ul></div><div className="features-knowledge"><h3>{c.sparks.knowledgeTitle}</h3><p>{c.sparks.knowledgeText}</p><a className="text-link" href={href(locale, 'solutions')}>{c.sparks.link}<ArrowUpRight size={17} aria-hidden="true"/></a></div></div>
    </section>
    <section className="section features-tools" aria-labelledby="features-tools-title"><p className="eyebrow">{c.tools.eyebrow}</p><h2 id="features-tools-title">{c.tools.title}</h2><div className="features-tool-grid">{c.tools.items.map(([title, text], index) => { const Icon = [Mic, PencilRuler, FolderOpen][index]; return <article key={title}><Icon size={25} strokeWidth={1.5} aria-hidden="true"/><h3>{title}</h3><p>{text}</p></article>; })}</div><ul className="features-plan-notes"><li><strong>{c.tools.pdf}</strong><span>{pricing.plans.filter(plan => plan.pdf && plan.fastQueue).map(plan => plan.name).join(' · ')}</span></li><li><strong>{c.tools.shared}</strong><span>{pricing.plans.filter(plan => plan.sharedProjects).map(plan => plan.name).join(' · ')}</span></li></ul><a className="text-link" href={href(locale, 'pricing')}>{c.tools.plans}<ArrowUpRight size={17} aria-hidden="true"/></a></section>
    <section className="cta section features-cta"><Sparkles className="cta-spark" size={30} aria-hidden="true"/><p className="eyebrow">BRILLER</p><h2>{c.cta.title}</h2><p>{c.cta.text}</p><div className="button-row"><a className="button light" href={site.app}>{c.cta.start}<ArrowUpRight size={17} aria-hidden="true"/></a><a className="text-link" href={href(locale, 'solutions')}>{c.cta.solutions}<ArrowUpRight size={17} aria-hidden="true"/></a></div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>
  </>;
}
