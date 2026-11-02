import content from '@/content/comparison2/articles.json';
import ui from '@/content/comparison2/ui.json';
import plans from '@/content/plans.json';
import { competitors, amountLabel, type Competitor, type Localized } from './compare';
import { href, site, socialPreview, type Locale } from './content';

type Editorial = {
  slug: string; intro: Localized;
  sections: { id: string; heading: Localized; paragraphs: Localized[] }[];
  checks: Localized[]; trial: Localized; planDetails: Localized[]; pricingNotes: Localized[];
};
export type Comparison2Product = Competitor & { editorial: Editorial };
export const comparison2Products: Comparison2Product[] = competitors.map(product => {
  const editorial = (content.products as Editorial[]).find(item => item.slug === product.slug);
  if (!editorial || editorial.planDetails.length !== product.pricing.plans.length) throw new Error(`Comparison2 editorial or pricing descriptions need updating: ${product.slug}`);
  return { ...product, editorial };
});
export const comparison2BySlug = (slug: string) => comparison2Products.find(product => product.slug === slug);
export const comparison2Copy = (locale: Locale) => ui[locale];
export const comparison2Href = (locale: Locale, slug?: string) => href(locale, 'comparison2' + (slug ? '/' + slug : ''));
export const comparison2Title = (product: Competitor) => `Briller vs ${product.name}`;
export const comparison2PlanName = (name: string) => name.replace(/ — .+$/, '');
export function comparison2PriceLead(product: Competitor, locale: Locale) {
  const c = comparison2Copy(locale);
  const monthly = product.pricing.plans.filter(plan => plan.billing === 'monthly' || plan.billing === 'publishedMonthly');
  if (!monthly.length) return c.priceUnknown;
  const entry = monthly.reduce((best, plan) => plan.amount < best.amount ? plan : best);
  const prefix = product.slug === 'remodel-ai' ? c.storeOffer : product.slug === 'spacely-ai' ? c.globalOffer : c.from;
  const qualifier = product.slug === 'remodel-ai' ? c.storeQualifier : product.slug === 'spacely-ai' ? c.globalQualifier : entry.billing === 'publishedMonthly' ? c.startingQualifier : '';
  return `${prefix} ${amountLabel(entry.amount, entry.currency, locale)} ${c.perMonth}.${qualifier ? ' ' + qualifier : ''}`;
}
export function comparison2BrillerAllowance(plan: typeof plans.plans[number], locale: Locale) {
  const c = comparison2Copy(locale);
  const seatLabel = locale === 'uk' && new Intl.PluralRules('uk-UA').select(plan.seats) === 'few' ? 'місця' : plan.seats === 1 ? c.seat : c.seats;
  return `${plan.credits} ${plan.monthly === 0 ? c.iterations : c.credits}; ${plan.seats} ${seatLabel}${plan.pdf ? '; ' + c.exports : ''}.`;
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
