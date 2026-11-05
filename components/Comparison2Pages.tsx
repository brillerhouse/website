import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { amountLabel, brillerTrial, compareDate, comparisonCopy } from '@/lib/compare';
import { comparison2Products, comparison2Copy, comparison2Href, comparison2Title, comparison2PriceLead, comparison2BrillerAllowance, comparison2BrillerPlan, comparison2EntryTier, comparison2Offer, comparison2MonthlyTiers, comparison2MonthlyOffer, comparison2Roundup, comparison2RoundupProducts, type ComparisonTier, type Comparison2Product, type FeatureScreenshot } from '@/lib/comparison2';
import { href, site, socialPreview, type Locale } from '@/lib/content';
import { solutionHref } from '@/lib/solutions';

function Card({ product, locale }: { product: Comparison2Product; locale: Locale }) {
  const c = comparison2Copy(locale);
  return <article className="comparison2-card"><h3><a href={comparison2Href(locale, product.slug)}>{comparison2Title(product)}<ArrowUpRight size={19} aria-hidden="true"/></a></h3><p>{product.editorial.intro[locale]}</p><a className="text-link" href={comparison2Href(locale, product.slug)}>{c.read}<ArrowRight size={16} aria-hidden="true"/></a></article>;
}
function CTA({ locale }: { locale: Locale }) {
  const c = comparison2Copy(locale);
  return <aside className="comparison2-cta"><div><h2>{c.ctaTitle}</h2><p>{c.ctaText}</p></div><a className="button" href={site.app}>{c.cta}<ArrowUpRight size={17} aria-hidden="true"/></a></aside>;
}
function Screenshot({ image, product, locale }: { image: FeatureScreenshot; product: Comparison2Product; locale: Locale }) {
  const c = comparison2Copy(locale);
  return <figure className="comparison2-screenshot" data-screenshot-id={image.id} style={{ maxWidth: image.width }}>
    <a href={image.src} target="_blank" rel="noopener noreferrer" aria-label={`${c.openScreenshot}: ${image.alt[locale]}`}>
      <img src={image.src} width={image.width} height={image.height} alt={image.alt[locale]} loading="lazy" decoding="async"/>
    </a>
    <figcaption><p>{image.caption[locale]}</p><div><span>{product.name} · {c.officialDemo}</span><a href={image.src} target="_blank" rel="noopener noreferrer">{c.openScreenshot}<ArrowUpRight size={14} aria-hidden="true"/></a></div></figcaption>
  </figure>;
}
function Homepage({ product, locale, priority = false }: { product: Comparison2Product; locale: Locale; priority?: boolean }) {
  const c = comparison2Copy(locale), image = product.brand.homepage;
  return <figure className="comparison2-homepage"><a href={product.url} target="_blank" rel="noopener noreferrer" aria-label={`${product.name}: ${c.official} (${c.opensInNewTab})`}><img src={image.src} width={image.width} height={image.height} alt={image.alt[locale]} fetchPriority={priority ? 'high' : undefined} loading={priority ? undefined : 'lazy'} decoding="async"/></a></figure>;
}
function OfficialLink({ product, locale }: { product: Comparison2Product; locale: Locale }) {
  const c = comparison2Copy(locale), logo = product.brand.logo;
  return <a className="comparison2-brand-link" href={product.url} target="_blank" rel="noopener noreferrer"><span className={'comparison2-logo-well comparison2-logo-' + logo.background}><img src={logo.src} width={logo.width} height={logo.height} alt={product.name} loading="lazy" decoding="async"/></span><span>{c.official}<ArrowUpRight size={16} aria-hidden="true"/></span></a>;
}
function ArticleHero({ product, locale }: { product: Comparison2Product; locale: Locale }) {
  const c = comparison2Copy(locale), image = product.brand.homepage;
  return <section className="page-heading comparison2-hero">
    <a className="text-link comparison2-back" href={comparison2Href(locale)}><ArrowRight size={16} aria-hidden="true"/>{c.overview}</a>
    <div className="comparison2-hero-layout"><div className="comparison2-hero-copy"><p className="eyebrow">BRILLER / {c.label}</p><h1>{comparison2Title(product)}</h1><p>{product.editorial.intro[locale]}</p></div>
      <Homepage product={product} locale={locale} priority/>
    </div>
  </section>;
}
function CompetitorPackage({ tier, locale }: { tier: ComparisonTier; locale: Locale }) {
  const c = comparison2Copy(locale), offer = comparison2MonthlyOffer(tier);
  const price = offer ? comparison2Offer(offer, locale) : undefined;
  return <><h3>{tier.name}</h3><div className="comparison2-offer">{price ? <><strong>{price.value}</strong> <span>{price.basis}</span>{price.qualifier && <small>{price.qualifier}</small>}</> : <span className="comparison2-check-label">{c.monthlyUnknown}</span>}</div><p className="comparison2-package-allowance">{tier.monthlyAllowance?.[locale]}</p></>;
}
function BrillerPackage({ tier, locale }: { tier: ComparisonTier; locale: Locale }) {
  const plan = comparison2BrillerPlan(tier), c = comparison2Copy(locale);
  return <><h3>{plan.name}</h3><div className="comparison2-offer"><strong>{amountLabel(plan.monthly, 'USD', locale)}</strong> <span>{comparisonCopy(locale).monthly}</span></div><p className="comparison2-package-allowance">{comparison2BrillerAllowance(plan, locale)}</p><p className="comparison2-package-advice">{plan.insights === 'full' ? c.fullAdvice : c.basicAdvice}</p></>;
}
function Pricing({ product, locale }: { product: Comparison2Product; locale: Locale }) {
  const c = comparison2Copy(locale), pricing = product.tierPricing, tiers = comparison2MonthlyTiers(product);
  return <section className="comparison2-pricing" id="pricing" aria-labelledby="comparison2-pricing-title"><h2 id="comparison2-pricing-title">{c.pricing}</h2>
    <p>{pricing.context[locale]}</p>{tiers.length > 0 && <p className="comparison2-units-note">{c.unitsNote}</p>}
    <div className="comparison2-trial-pair"><p><strong>{product.name}</strong>{pricing.trial[locale]}</p><p><strong>Briller</strong>{brillerTrial(locale)}</p></div>
    {tiers.length > 0 && <div className="comparison2-table-scroll comparison2-paired-scroll" role="region" aria-label={c.pricing} tabIndex={0}><table className="comparison2-paired-pricing" role="table"><caption className="sr-only">{c.pricing}: {product.name} / Briller</caption><thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">{c.useCase}</th><th scope="col" role="columnheader">{product.name}</th><th scope="col" role="columnheader">Briller</th></tr></thead><tbody role="rowgroup">
      {tiers.map(tier => <tr key={tier.id} role="row" data-tier-id={tier.id} data-briller-plan={tier.brillerPlan}><th scope="row" role="rowheader">{tier.purpose[locale]}</th><td role="cell" data-platform={product.name}><CompetitorPackage tier={tier} locale={locale}/></td><td role="cell" data-platform="Briller" className="comparison2-briller-package"><BrillerPackage tier={tier} locale={locale}/></td></tr>)}
    </tbody></table></div>}
    {pricing.monthlyNotes.map(note => <p className="comparison2-price-note" key={note.en}>{note[locale]}</p>)}
    {pricing.monthlyChecks.length > 0 && <aside className="comparison2-pricing-checks" aria-label={c.pricingFlags}><span className="comparison2-check-label">{c.confirm}</span><ul>{pricing.monthlyChecks.map(check => <li key={check.en}>{check[locale]}</li>)}</ul></aside>}
    <p className="comparison2-date">{c.pricesDate}: <time dateTime={pricing.checkedAt}>{compareDate(pricing.checkedAt, locale)}</time></p>
    <a className="text-link" href={href(locale, 'pricing')}>{c.brillerPlans}<ArrowRight size={16} aria-hidden="true"/></a>
  </section>;
}
function RoundupProduct({ product, locale }: { product: typeof comparison2RoundupProducts[number]; locale: Locale }) {
  const c = comparison2Copy(locale), entry = product.roundup, tier = comparison2EntryTier(product);
  return <section className="comparison2-roundup-product" id={product.slug} aria-labelledby={'guide-' + product.slug}>
    <h2 id={'guide-' + product.slug}>{product.name}<span>{entry.fit[locale]}</span></h2>
    <div className="comparison2-roundup-lead"><p>{entry.summary[locale]}</p><Homepage product={product} locale={locale}/></div>
    <h3>{c.keyFeatures}</h3>{entry.features.map(feature => <p key={feature.title.en}><strong>{feature.title[locale]}.</strong> {feature.text[locale]}</p>)}
    {product.reviews.length > 0 && <aside className="comparison2-feedback"><h3>{c.reviewHeading}</h3>{product.reviews.map(review => <div className="comparison2-review" key={review.id}><p>{review.summary[locale]}</p><p className="comparison2-review-credit"><strong>{review.author}</strong>{review.role && <span>{review.role}</span>}<span><time dateTime={review.reviewedAt}>{compareDate(review.reviewedAt, locale)}</time> · {review.score} {c.reviewScore}</span><a href={review.sourceUrl} target="_blank" rel="noopener noreferrer">{c.reviewSource}<ArrowUpRight size={14} aria-hidden="true"/></a></p></div>)}</aside>}
    <div className="comparison2-tradeoffs"><div><h3>{c.pros}</h3><ul>{entry.pros.map(point => <li key={point.en}>{point[locale]}</li>)}</ul></div><div><h3>{c.cons}</h3><ul>{entry.cons.map(point => <li key={point.en}>{point[locale]}</li>)}</ul></div></div>
    <h3>{c.pricing}</h3><p className="comparison2-roundup-price">{comparison2PriceLead(product, locale)}{tier && <>. {tier.monthlyAllowance?.[locale]}</>}</p>
    <div className="comparison2-best-for"><h3>{c.bestFor}</h3><p>{entry.bestFor[locale]}</p></div>
    <p className="comparison2-roundup-confirm"><span className="comparison2-check-label">{c.confirm}</span> {entry.confirm[locale]}</p>
    <div className="comparison2-roundup-links"><OfficialLink product={product} locale={locale}/><a className="text-link" href={comparison2Href(locale, product.slug)}>{c.readDetailed}<ArrowRight size={16} aria-hidden="true"/></a></div>
  </section>;
}
export function Comparison2Hub({ locale }: { locale: Locale }) {
  const c = comparison2Copy(locale), url = site.origin + comparison2Href(locale), conclusion = comparison2Roundup.conclusion;
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': url, url, name: c.title, description: c.seoDescription, dateModified: comparison2Roundup.updatedAt, inLanguage: locale, publisher: { '@id': site.origin + '/#organization' }, mainEntity: { '@type': 'ItemList', numberOfItems: comparison2RoundupProducts.length, itemListElement: comparison2RoundupProducts.map((product, i) => ({ '@type': 'ListItem', position: i + 1, name: product.name, url: site.origin + comparison2Href(locale, product.slug) })) }, hasPart: [{ '@id': url + '#guide' }, { '@id': url + '#questions' }] },
    { '@type': 'Article', '@id': url + '#guide', mainEntityOfPage: { '@id': url }, headline: c.title, description: c.seoDescription, image: socialPreview.url, datePublished: comparison2Roundup.publishedAt, dateModified: comparison2Roundup.updatedAt, inLanguage: locale, author: { '@type': 'Organization', '@id': site.origin + '/#organization', name: 'Briller' }, publisher: { '@id': site.origin + '/#organization' } },
    { '@type': 'FAQPage', '@id': url + '#questions', isPartOf: { '@id': url }, inLanguage: locale, mainEntity: comparison2Roundup.questions.map(item => ({ '@type': 'Question', name: item.question[locale], acceptedAnswer: { '@type': 'Answer', text: item.answer[locale] } })) }
  ] };
  return <article className="comparison2-page comparison2-guide"><section className="page-heading comparison2-hero"><p className="eyebrow">BRILLER / {c.label}</p><h1>{c.title}</h1><p>{comparison2Roundup.intro[locale]}</p><p className="comparison2-byline">{c.publishedBy} · {c.updated} <time dateTime={comparison2Roundup.updatedAt}>{compareDate(comparison2Roundup.updatedAt, locale)}</time></p></section>
    <section className="section comparison2-selection"><h2>{c.roundupTitle}</h2><p>{comparison2Roundup.selection[locale]}</p><div className="comparison2-quick-picks">{comparison2RoundupProducts.map(product => <a href={'#' + product.slug} key={product.slug}><strong>{product.name}</strong><span>{product.roundup.fit[locale]}</span><ArrowRight size={16} aria-hidden="true"/></a>)}</div></section>
    <div className="section comparison2-reading-layout comparison2-guide-layout"><aside className="comparison2-contents"><nav aria-label={c.roundupContents}><p className="eyebrow">{c.roundupContents}</p>{comparison2RoundupProducts.map(product => <a href={'#' + product.slug} key={product.slug}>{product.name}</a>)}<a href="#pricing">{c.pricing}</a><a href="#questions">{c.questionsTitle}</a><a href="#briller-conclusion">{c.conclusion}</a></nav></aside><div className="comparison2-prose">{comparison2RoundupProducts.map(product => <RoundupProduct product={product} locale={locale} key={product.slug}/>)}</div></div>
    <section className="section comparison2-hub-pricing" id="pricing"><h2>{c.pricing}</h2><p>{brillerTrial(locale)}</p><p className="comparison2-units-note">{c.unitsNote}</p><div className="comparison2-table-scroll" role="region" aria-label={c.pricing} tabIndex={0}><table><caption className="sr-only">{c.pricing}</caption><thead><tr><th scope="col">{c.provider}</th><th scope="col">{c.competitorEntry}</th><th scope="col">{c.brillerMatch}</th></tr></thead><tbody>{comparison2RoundupProducts.map(product => { const tier = comparison2EntryTier(product), plan = tier ? comparison2BrillerPlan(tier) : undefined; return <tr key={product.slug}><th scope="row"><a href={comparison2Href(locale, product.slug) + '#pricing'}>{product.name}</a></th><td>{comparison2PriceLead(product, locale)}{tier && <p>{tier.monthlyAllowance?.[locale]}</p>}</td><td>{plan ? <><strong>{plan.name}</strong><p>{amountLabel(plan.monthly, 'USD', locale)} {comparisonCopy(locale).monthly}</p><p>{comparison2BrillerAllowance(plan, locale)}</p></> : <a href={href(locale, 'pricing')}>{c.brillerPlans}</a>}</td></tr>; })}</tbody></table></div><p className="comparison2-date">{c.pricesDate}: <time dateTime={comparison2Products[0].tierPricing.checkedAt}>{compareDate(comparison2Products[0].tierPricing.checkedAt, locale)}</time></p></section>
    <section className="section comparison2-questions" id="questions"><h2>{c.questionsTitle}</h2>{comparison2Roundup.questions.map(item => <div key={item.question.en}><h3>{item.question[locale]}</h3><p>{item.answer[locale]}</p></div>)}</section>
    <section className="section comparison2-conclusion" id="briller-conclusion"><h2>{conclusion.title[locale]}</h2>{conclusion.paragraphs.map(paragraph => <p key={paragraph.en}>{paragraph[locale]}</p>)}<h3>{c.bestFor}</h3><p>{conclusion.bestFor[locale]}</p><p>{brillerTrial(locale)}</p><div className="comparison2-conclusion-links"><a className="text-link" href={solutionHref(locale, 'first-room-refresh')}>{c.exploreRoom}<ArrowRight size={16} aria-hidden="true"/></a><a className="text-link" href={solutionHref(locale, 'interior-designers-freelance-decorators')}>{c.explorePractice}<ArrowRight size={16} aria-hidden="true"/></a></div><CTA locale={locale}/></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>
  </article>;
}
export function Comparison2Article({ product, locale }: { product: Comparison2Product; locale: Locale }) {
  const c = comparison2Copy(locale), e = product.editorial;
  const decision = comparison2RoundupProducts.find(item => item.slug === product.slug)!.roundup;
  const schema = { '@context': 'https://schema.org', '@type': 'WebPage', url: site.origin + comparison2Href(locale, product.slug), name: comparison2Title(product), description: e.intro[locale], inLanguage: locale, publisher: { '@id': site.origin + '/#organization' }, isPartOf: { '@id': site.origin + comparison2Href(locale) }, citation: { '@type': 'WebPage', name: product.name, url: product.url } };
  const related = comparison2Products.filter(item => item.slug !== product.slug).sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category)).slice(0, 2);
  return <article className="comparison2-page"><ArticleHero product={product} locale={locale}/>
    <div className="section comparison2-reading-layout"><aside className="comparison2-contents"><nav aria-label={c.onPage}><p className="eyebrow">{c.onPage}</p>{e.sections.map(section => <a href={'#' + section.id} key={section.id}>{section.heading[locale]}</a>)}<a href="#pros">{c.pros}</a><a href="#cons">{c.cons}</a><a href="#best-for">{c.bestFor}</a><a href="#pricing">{c.pricing}</a><a href="#to-confirm">{c.confirmTitle}</a></nav></aside>
      <div className="comparison2-prose">{e.sections.map(section => <section className="comparison2-capability" id={section.id} key={section.id}><h2>{section.heading[locale]}</h2><p>{section.paragraphs[0][locale]}</p>{product.screenshots.filter(image => image.section === section.id).map(image => <Screenshot image={image} product={product} locale={locale} key={image.id}/>)}{section.paragraphs.slice(1).map(paragraph => <p key={paragraph.en}>{paragraph[locale]}</p>)}<div className="comparison2-perspective"><h3>{section.perspective.audience[locale]}</h3><p>{section.perspective.text[locale]}</p><a className="text-link" href={solutionHref(locale, section.perspective.solution)}>{section.perspective.label[locale]}<ArrowRight size={16} aria-hidden="true"/></a></div></section>)}
        <div className="comparison2-tradeoffs comparison2-article-tradeoffs">
          <section className="comparison2-capability" id="pros" aria-labelledby="comparison2-pros-title"><h2 id="comparison2-pros-title">{c.pros}</h2><ul>{decision.pros.map(point => <li key={point.en}>{point[locale]}</li>)}</ul></section>
          <section className="comparison2-capability" id="cons" aria-labelledby="comparison2-cons-title"><h2 id="comparison2-cons-title">{c.cons}</h2><ul>{decision.cons.map(point => <li key={point.en}>{point[locale]}</li>)}</ul></section>
        </div>
        <section className="comparison2-capability comparison2-best-for" id="best-for" aria-labelledby="comparison2-best-for-title"><h2 id="comparison2-best-for-title">{c.bestFor}</h2><p>{decision.bestFor[locale]}</p></section>
        <Pricing product={product} locale={locale}/>
        <aside className="comparison2-checks" id="to-confirm"><span className="comparison2-check-label">{c.confirm}</span><h2>{c.confirmTitle}</h2><ul>{e.checks.map(check => <li key={check.en}>{check[locale]}</li>)}</ul></aside>
      </div>
    </div>
    <section className="section"><CTA locale={locale}/></section>
    <section className="section comparison2-related"><h2>{c.related}</h2><div className="comparison2-cards">{related.map(item => <Card product={item} locale={locale} key={item.slug}/>)}</div></section>
    <section className="section comparison2-official"><OfficialLink product={product} locale={locale}/></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>
  </article>;
}
export function Comparison2Screen({ locale, product }: { locale: Locale; product?: Comparison2Product }) {
  const c = comparison2Copy(locale);
  const breadcrumbs = [{ name: c.label, href: comparison2Href(locale) }, ...(product ? [{ name: comparison2Title(product), href: comparison2Href(locale, product.slug) }] : [])];
  return <Shell locale={locale} page={'comparison2' + (product ? '/' + product.slug : '')} breadcrumbs={breadcrumbs}>{product ? <Comparison2Article product={product} locale={locale}/> : <Comparison2Hub locale={locale}/>}</Shell>;
}
