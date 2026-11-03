import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { amountLabel, brillerTrial, compareDate, comparisonCopy } from '@/lib/compare';
import { comparison2Products, comparison2Copy, comparison2Href, comparison2Title, comparison2PriceLead, comparison2BrillerAllowance, comparison2BrillerPlan, comparison2EntryTier, comparison2Offer, comparison2MonthlyTiers, comparison2MonthlyOffer, type ComparisonTier, type Comparison2Product, type FeatureScreenshot } from '@/lib/comparison2';
import { href, site, type Locale } from '@/lib/content';
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
export function Comparison2Hub({ locale }: { locale: Locale }) {
  const c = comparison2Copy(locale), url = site.origin + comparison2Href(locale);
  const schema = { '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': url, url, name: c.title, description: c.intro, inLanguage: locale, publisher: { '@id': site.origin + '/#organization' }, mainEntity: { '@type': 'ItemList', itemListElement: comparison2Products.map((product, i) => ({ '@type': 'ListItem', position: i + 1, name: comparison2Title(product), url: site.origin + comparison2Href(locale, product.slug) })) } };
  return <div className="comparison2-page"><section className="page-heading comparison2-hero"><p className="eyebrow">BRILLER / {c.label}</p><h1>{c.title}</h1><p>{c.intro}</p></section>
    <section className="section comparison2-position"><h2>{c.brillerTitle}</h2><p>{c.brillerIntro}</p></section>
    <section className="section comparison2-directory"><h2>{c.directory}</h2><div className="comparison2-cards">{comparison2Products.map(product => <Card product={product} locale={locale} key={product.slug}/>)}</div></section>
    <section className="section comparison2-hub-pricing" id="pricing"><h2>{c.pricing}</h2><p>{brillerTrial(locale)}</p><p className="comparison2-units-note">{c.unitsNote}</p><div className="comparison2-table-scroll" role="region" aria-label={c.pricing} tabIndex={0}><table><caption className="sr-only">{c.pricing}</caption><thead><tr><th scope="col">{c.provider}</th><th scope="col">{c.competitorEntry}</th><th scope="col">{c.brillerMatch}</th></tr></thead><tbody>{comparison2Products.map(product => { const tier = comparison2EntryTier(product), plan = tier ? comparison2BrillerPlan(tier) : undefined; return <tr key={product.slug}><th scope="row"><a href={comparison2Href(locale, product.slug) + '#pricing'}>{product.name}</a></th><td>{comparison2PriceLead(product, locale)}{tier && <p>{tier.monthlyAllowance?.[locale]}</p>}</td><td>{plan ? <><strong>{plan.name}</strong><p>{amountLabel(plan.monthly, 'USD', locale)} {comparisonCopy(locale).monthly}</p><p>{comparison2BrillerAllowance(plan, locale)}</p></> : <a href={href(locale, 'pricing')}>{c.brillerPlans}</a>}</td></tr>; })}</tbody></table></div><p className="comparison2-date">{c.pricesDate}: <time dateTime={comparison2Products[0].tierPricing.checkedAt}>{compareDate(comparison2Products[0].tierPricing.checkedAt, locale)}</time></p></section>
    <section className="section"><CTA locale={locale}/></section><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>
  </div>;
}
export function Comparison2Article({ product, locale }: { product: Comparison2Product; locale: Locale }) {
  const c = comparison2Copy(locale), e = product.editorial;
  const schema = { '@context': 'https://schema.org', '@type': 'WebPage', url: site.origin + comparison2Href(locale, product.slug), name: comparison2Title(product), description: e.intro[locale], inLanguage: locale, publisher: { '@id': site.origin + '/#organization' }, isPartOf: { '@id': site.origin + comparison2Href(locale) }, citation: { '@type': 'WebPage', name: product.name, url: product.url } };
  const related = comparison2Products.filter(item => item.slug !== product.slug).sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category)).slice(0, 2);
  return <article className="comparison2-page"><section className="page-heading comparison2-hero"><a className="text-link comparison2-back" href={comparison2Href(locale)}><ArrowRight size={16} aria-hidden="true"/>{c.overview}</a><p className="eyebrow">BRILLER / {c.label}</p><h1>{comparison2Title(product)}</h1><p>{e.intro[locale]}</p></section>
    <div className="section comparison2-reading-layout"><aside className="comparison2-contents"><nav aria-label={c.onPage}><p className="eyebrow">{c.onPage}</p>{e.sections.map(section => <a href={'#' + section.id} key={section.id}>{section.heading[locale]}</a>)}<a href="#pricing">{c.pricing}</a><a href="#to-confirm">{c.confirmTitle}</a></nav></aside>
      <div className="comparison2-prose">{e.sections.map(section => <section className="comparison2-capability" id={section.id} key={section.id}><h2>{section.heading[locale]}</h2><p>{section.paragraphs[0][locale]}</p>{product.screenshots.filter(image => image.section === section.id).map(image => <Screenshot image={image} product={product} locale={locale} key={image.id}/>)}{section.paragraphs.slice(1).map(paragraph => <p key={paragraph.en}>{paragraph[locale]}</p>)}<div className="comparison2-perspective"><h3>{section.perspective.audience[locale]}</h3><p>{section.perspective.text[locale]}</p><a className="text-link" href={solutionHref(locale, section.perspective.solution)}>{section.perspective.label[locale]}<ArrowRight size={16} aria-hidden="true"/></a></div></section>)}
        <Pricing product={product} locale={locale}/>
        <aside className="comparison2-checks" id="to-confirm"><span className="comparison2-check-label">{c.confirm}</span><h2>{c.confirmTitle}</h2><ul>{e.checks.map(check => <li key={check.en}>{check[locale]}</li>)}</ul></aside>
      </div>
    </div>
    <section className="section"><CTA locale={locale}/></section>
    <section className="section comparison2-related"><h2>{c.related}</h2><div className="comparison2-cards">{related.map(item => <Card product={item} locale={locale} key={item.slug}/>)}</div></section>
    <section className="section comparison2-official"><a className="text-link" href={product.url} target="_blank" rel="noopener noreferrer">{product.name} — {c.official}<ArrowUpRight size={16} aria-hidden="true"/></a></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>
  </article>;
}
export function Comparison2Screen({ locale, product }: { locale: Locale; product?: Comparison2Product }) {
  const c = comparison2Copy(locale);
  const breadcrumbs = [{ name: c.label, href: comparison2Href(locale) }, ...(product ? [{ name: comparison2Title(product), href: comparison2Href(locale, product.slug) }] : [])];
  return <Shell locale={locale} page={'comparison2' + (product ? '/' + product.slug : '')} breadcrumbs={breadcrumbs}>{product ? <Comparison2Article product={product} locale={locale}/> : <Comparison2Hub locale={locale}/>}</Shell>;
}
