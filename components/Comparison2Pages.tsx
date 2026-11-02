import { ArrowRight, ArrowUpRight } from 'lucide-react';
import plans from '@/content/plans.json';
import { Shell } from '@/components/Shell';
import { amountLabel, brillerPrice, brillerTrial, compareDate, comparisonCopy, latestComparisonReview } from '@/lib/compare';
import { comparison2Products, comparison2Copy, comparison2Href, comparison2Title, comparison2PriceLead, comparison2PlanName, comparison2BrillerAllowance, type Comparison2Product } from '@/lib/comparison2';
import { href, site, type Locale } from '@/lib/content';

function Card({ product, locale }: { product: Comparison2Product; locale: Locale }) {
  const c = comparison2Copy(locale);
  return <article className="comparison2-card"><h3><a href={comparison2Href(locale, product.slug)}>{comparison2Title(product)}<ArrowUpRight size={19} aria-hidden="true"/></a></h3><p>{product.editorial.intro[locale]}</p><a className="text-link" href={comparison2Href(locale, product.slug)}>{c.read}<ArrowRight size={16} aria-hidden="true"/></a></article>;
}
function CTA({ locale }: { locale: Locale }) {
  const c = comparison2Copy(locale);
  return <aside className="comparison2-cta"><div><h2>{c.ctaTitle}</h2><p>{c.ctaText}</p></div><a className="button" href={site.app}>{c.cta}<ArrowUpRight size={17} aria-hidden="true"/></a></aside>;
}
function Pricing({ product, locale }: { product: Comparison2Product; locale: Locale }) {
  const c = comparison2Copy(locale), billing = comparisonCopy(locale);
  return <section className="comparison2-pricing" id="pricing" aria-labelledby="comparison2-pricing-title"><h2 id="comparison2-pricing-title">{c.pricing}</h2>
    <p><strong>Briller.</strong> {brillerTrial(locale)}</p><p><strong>{product.name}.</strong> {product.editorial.trial[locale]}</p>
    <div className="comparison2-table-scroll" role="region" aria-label={c.pricing} tabIndex={0}><table><caption className="sr-only">{c.pricing}: Briller / {product.name}</caption><thead><tr><th scope="col">{c.plan}</th><th scope="col">{c.price}</th><th scope="col">{c.includes}</th></tr></thead><tbody>
      {plans.plans.map(plan => <tr className="comparison2-briller-price" key={plan.name}><th scope="row">Briller<span>{plan.name}</span></th><td><strong>{amountLabel(plan.monthly, 'USD', locale)}</strong> {plan.monthly === 0 ? c.free : billing.monthly}{plan.monthly > 0 && <span>{amountLabel(plan.annualMonthly, 'USD', locale)} {billing.annual}</span>}</td><td>{comparison2BrillerAllowance(plan, locale)}</td></tr>)}
      {product.pricing.plans.map((plan, index) => <tr key={plan.name + index}><th scope="row">{product.name}<span>{comparison2PlanName(plan.name)}</span></th><td><strong>{amountLabel(plan.amount, plan.currency, locale)}</strong> {billing[plan.billing]}</td><td>{product.editorial.planDetails[index][locale]}</td></tr>)}
      {!product.pricing.plans.length && <tr><th scope="row">{product.name}</th><td colSpan={2}>{c.priceUnknown}</td></tr>}
    </tbody></table></div>
    {product.editorial.pricingNotes.map(note => <p className="comparison2-price-note" key={note.en}>{note[locale]}</p>)}
    {product.reviewedAt && <p className="comparison2-date">{c.pricesDate}: <time dateTime={product.reviewedAt}>{compareDate(product.reviewedAt, locale)}</time></p>}
    <a className="text-link" href={href(locale, 'pricing')}>{c.brillerPlans}<ArrowRight size={16} aria-hidden="true"/></a>
  </section>;
}
export function Comparison2Hub({ locale }: { locale: Locale }) {
  const c = comparison2Copy(locale), url = site.origin + comparison2Href(locale);
  const schema = { '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': url, url, name: c.title, description: c.intro, inLanguage: locale, publisher: { '@id': site.origin + '/#organization' }, mainEntity: { '@type': 'ItemList', itemListElement: comparison2Products.map((product, i) => ({ '@type': 'ListItem', position: i + 1, name: comparison2Title(product), url: site.origin + comparison2Href(locale, product.slug) })) } };
  return <div className="comparison2-page"><section className="page-heading comparison2-hero"><p className="eyebrow">BRILLER / {c.label}</p><h1>{c.title}</h1><p>{c.intro}</p></section>
    <section className="section comparison2-position"><h2>{c.brillerTitle}</h2><p>{c.brillerIntro}</p></section>
    <section className="section comparison2-directory"><h2>{c.directory}</h2><div className="comparison2-cards">{comparison2Products.map(product => <Card product={product} locale={locale} key={product.slug}/>)}</div></section>
    <section className="section comparison2-hub-pricing" id="pricing"><h2>{c.pricing}</h2><div className="comparison2-table-scroll" role="region" aria-label={c.pricing} tabIndex={0}><table><caption className="sr-only">{c.pricing}</caption><thead><tr><th scope="col">{c.provider}</th><th scope="col">{c.paid}</th><th scope="col">{c.trial}</th></tr></thead><tbody><tr className="comparison2-briller-price"><th scope="row"><a href={href(locale, 'pricing')}>Briller</a></th><td>{c.from} {brillerPrice(locale)}</td><td>{brillerTrial(locale)}</td></tr>{comparison2Products.map(product => <tr key={product.slug}><th scope="row"><a href={comparison2Href(locale, product.slug) + '#pricing'}>{product.name}</a></th><td>{comparison2PriceLead(product, locale)}</td><td>{product.editorial.trial[locale]}</td></tr>)}</tbody></table></div>{latestComparisonReview && <p className="comparison2-date">{c.pricesDate}: <time dateTime={latestComparisonReview}>{compareDate(latestComparisonReview, locale)}</time></p>}</section>
    <section className="section"><CTA locale={locale}/></section><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>
  </div>;
}
export function Comparison2Article({ product, locale }: { product: Comparison2Product; locale: Locale }) {
  const c = comparison2Copy(locale), e = product.editorial;
  const schema = { '@context': 'https://schema.org', '@type': 'WebPage', url: site.origin + comparison2Href(locale, product.slug), name: comparison2Title(product), description: e.intro[locale], inLanguage: locale, publisher: { '@id': site.origin + '/#organization' }, isPartOf: { '@id': site.origin + comparison2Href(locale) }, citation: { '@type': 'WebPage', name: product.name, url: product.url } };
  const related = comparison2Products.filter(item => item.slug !== product.slug).sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category)).slice(0, 2);
  return <article className="comparison2-page"><section className="page-heading comparison2-hero"><a className="text-link comparison2-back" href={comparison2Href(locale)}><ArrowRight size={16} aria-hidden="true"/>{c.overview}</a><p className="eyebrow">BRILLER / {c.label}</p><h1>{comparison2Title(product)}</h1><p>{e.intro[locale]}</p></section>
    <div className="section comparison2-reading-layout"><aside className="comparison2-contents"><nav aria-label={c.onPage}><p className="eyebrow">{c.onPage}</p>{e.sections.map(section => <a href={'#' + section.id} key={section.id}>{section.heading[locale]}</a>)}<a href="#pricing">{c.pricing}</a><a href="#to-confirm">{c.confirmTitle}</a></nav></aside>
      <div className="comparison2-prose">{e.sections.map(section => <section className="comparison2-capability" id={section.id} key={section.id}><h2>{section.heading[locale]}</h2>{section.paragraphs.map(paragraph => <p key={paragraph.en}>{paragraph[locale]}</p>)}</section>)}
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
