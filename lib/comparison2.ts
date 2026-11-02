import content from '@/content/comparison2/articles.json';
import ui from '@/content/comparison2/ui.json';
import tierPricing from '@/content/comparison2/pricing.json';
import plans from '@/content/plans.json';
import { competitors, amountLabel, type Competitor, type Localized } from './compare';
import { href, site, socialPreview, type Locale } from './content';

type Editorial = {
  slug: string; intro: Localized;
  sections: { id: string; heading: Localized; paragraphs: Localized[] }[];
  checks: Localized[];
};
export type TierOffer = { billing: 'monthly' | 'yearly' | 'annualEquivalent' | 'oneOff' | 'weekly' | 'free' | 'quote'; currency: string; amount?: number; maximum?: number; starting?: boolean; perSeat?: boolean; qualifier?: Localized };
export type ComparisonTier = { id: string; name: string; brillerPlan: string; purpose: Localized; allowance: Localized; offers: TierOffer[]; features: Localized[]; sources: string[]; checks: Localized[] };
export type TierPricing = { slug: string; checkedAt: string; trial: Localized; context: Localized; tiers: ComparisonTier[]; notes: Localized[]; checks: Localized[]; sources: { id: string; title: string; url: string; checkedAt: string; status: string }[] };
export type Comparison2Product = Competitor & { editorial: Editorial; tierPricing: TierPricing };
export const comparison2Products: Comparison2Product[] = competitors.map(product => {
  const editorial = (content.products as Editorial[]).find(item => item.slug === product.slug);
  const pricing = (tierPricing.products as TierPricing[]).find(item => item.slug === product.slug);
  if (!editorial || !pricing) throw new Error(`Comparison2 content missing: ${product.slug}`);
  for (const tier of pricing.tiers) if (!plans.plans.some(plan => plan.name === tier.brillerPlan)) throw new Error(`Unknown Briller plan: ${tier.brillerPlan}`);
  return { ...product, editorial, tierPricing: pricing };
});
export const comparison2BySlug = (slug: string) => comparison2Products.find(product => product.slug === slug);
export const comparison2Copy = (locale: Locale) => ui[locale];
export const comparison2Href = (locale: Locale, slug?: string) => href(locale, 'comparison2' + (slug ? '/' + slug : ''));
export const comparison2Title = (product: Competitor) => `Briller vs ${product.name}`;
export const comparison2BrillerPlan = (tier: ComparisonTier) => plans.plans.find(plan => plan.name === tier.brillerPlan)!;
export const comparison2EntryTier = (product: Comparison2Product) => product.tierPricing.tiers.find(tier => tier.offers.some(offer => (offer.amount ?? 0) > 0))!;
export function comparison2Offer(offer: TierOffer, locale: Locale) {
  const c = comparison2Copy(locale);
  const value = offer.amount === undefined ? c.customQuote : `${offer.starting ? c.from + ' ' : ''}${amountLabel(offer.amount, offer.currency, locale)}${offer.maximum !== undefined ? '–' + amountLabel(offer.maximum, offer.currency, locale) : ''}`;
  const basis = offer.billing === 'monthly' && offer.starting ? (offer.perSeat ? c.startingSeatMonth : c.startingMonth) : c.billingLabels[offer.billing];
  return { value, basis, qualifier: offer.qualifier?.[locale] };
}
export function comparison2PriceLead(product: Comparison2Product, locale: Locale) {
  const tier = comparison2EntryTier(product), offer = tier.offers.find(item => (item.amount ?? 0) > 0)!;
  const price = comparison2Offer(offer, locale);
  return `${tier.name}: ${price.value} ${price.basis}`;
}
export function comparison2BrillerAllowance(plan: typeof plans.plans[number], locale: Locale) {
  const c = comparison2Copy(locale);
  const seatLabel = locale === 'uk' && new Intl.PluralRules('uk-UA').select(plan.seats) === 'few' ? 'місця' : plan.seats === 1 ? c.seat : c.seats;
  const projectUnit = locale === 'uk' && plan.projects !== null && new Intl.PluralRules('uk-UA').select(plan.projects) === 'few' ? 'проєкти' : c.projects;
  const projectLabel = plan.projects === null ? c.unlimitedProjects : `${plan.projects} ${projectUnit}`;
  return `${plan.credits} ${plan.monthly === 0 ? c.iterations : c.credits}; ${projectLabel}; ${plan.seats} ${seatLabel}.`;
}
export function comparison2BrillerFeatures(plan: typeof plans.plans[number], locale: Locale) {
  const c = comparison2Copy(locale);
  return [plan.insights === 'full' ? c.fullAdvice : c.basicAdvice, plan.watermark ? c.watermarked : c.noWatermark, plan.resolution ? c.hdIncluded : c.hdExcluded, plan.pdf ? c.pdfIncluded : c.pdfExcluded, plan.commercial ? c.commercialIncluded : c.commercialExcluded, ...(plan.fastQueue ? [c.fastQueue] : []), ...(plan.sharedProjects ? [c.sharedProjects] : [])];
}
export function comparison2Metadata(locale: Locale, product?: Comparison2Product) {
  const c = comparison2Copy(locale), title = product ? comparison2Title(product) + ': Features & Pricing' : c.title;
  const localizedTitle = product && locale === 'uk' ? comparison2Title(product) + ': можливості й тарифи' : title;
  const text = product ? product.editorial.intro[locale] : c.intro;
  const description = text.length > 180 ? text.slice(0, 180).replace(/\s+\S*$/, '') + '…' : text;
  const url = site.origin + comparison2Href(locale, product?.slug);
  return {
    title: localizedTitle + ' | Briller', description,
    // This parallel editorial version stays unlisted while the original comparison URLs retain their SEO setup.
    robots: { index: false, follow: true },
    alternates: { canonical: url, languages: { en: site.origin + comparison2Href('en', product?.slug), uk: site.origin + comparison2Href('uk', product?.slug), 'x-default': site.origin + comparison2Href('en', product?.slug) } },
    openGraph: { title: localizedTitle, description, url, type: 'website' as const, locale: locale === 'uk' ? 'uk_UA' : 'en_US', images: [socialPreview] },
    twitter: { card: 'summary_large_image' as const, title: localizedTitle, description, images: [socialPreview] }
  };
}
