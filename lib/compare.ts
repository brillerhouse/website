import catalog from '@/content/compare/catalog.json';
import labels from '@/content/compare/ui.json';
import plans from '@/content/plans.json';
import { href, site, socialPreview, type Locale } from './content';

export type Localized = Record<Locale, string>;
export type ComparisonSource = { id: string; title: string; url: string; checkedAt: string | null; status: 'pending' | 'verified' | 'unavailable' };
export type ComparisonFact = { state: 'documented' | 'unconfirmed' | 'different'; text: Localized; sources: string[] };
export type ComparisonPlan = { name: string; amount: number; currency: string; billing: 'monthly' | 'annual' | 'oneOff' | 'yearly'; allowance: Localized; sources: string[] };
export const featureKeys = ['workflow','references','iterations','technical','planning','shopping','exports','commercial','teams'] as const;
export type FeatureKey = typeof featureKeys[number];
export type Competitor = {
  slug: string; name: string; url: string; category: 'photo' | 'planning'; verification: 'pending' | 'reviewed'; reviewedAt: string | null;
  summary: Localized; bestFor: Localized; freeTrial: { text: Localized; sources: string[] };
  pricing: { state: 'pending' | 'verified' | 'unavailable'; summary: Localized; plans: ComparisonPlan[]; notes: Localized[]; sources: string[] };
  features: Record<FeatureKey, ComparisonFact>; takeaways: Localized[]; chooseCompetitor: Localized[]; chooseBriller: Localized[]; watchouts: Localized[]; sources: ComparisonSource[];
};
export const competitors = catalog.products as Competitor[];
export const comparisonCopy = (locale: Locale) => labels[locale];
export const comparisonHref = (locale: Locale, slug?: string) => href(locale, 'compare' + (slug ? '/' + slug : ''));
export const competitorBySlug = (slug: string) => competitors.find(item => item.slug === slug);
export const compareDate = (date: string, locale: Locale) => new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-GB', { dateStyle: 'long', timeZone: 'Europe/Kyiv' }).format(new Date(date + 'T12:00:00Z'));
export const amountLabel = (amount: number, currency: string, locale: Locale) => new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : 'en-US', { style: 'currency', currency, minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(amount);
export function brillerPrice(locale: Locale) {
  const entry = plans.plans.find(plan => plan.name === 'Explorer')!;
  return `${amountLabel(entry.monthly, 'USD', locale)} ${comparisonCopy(locale).monthly}`;
}
export function brillerTrial(locale: Locale) {
  return locale === 'uk' ? `${plans.trial.durationHours} години Pro з ${plans.trial.credits} кредитами після реєстрації; також є Free.` : `${plans.trial.durationHours}-hour Pro trial with ${plans.trial.credits} credits at registration; Free also available.`;
}
export function brillerFeature(key: FeatureKey, locale: Locale) {
  const content: Record<FeatureKey, Localized> = {
    workflow: { en: 'Upload a room photo, describe the goal and explore a visual concept with room analysis.', uk: 'Завантажте фото кімнати, опишіть задачу та досліджуйте концепцію з аналізом простору.' },
    references: { en: 'Moodboards can guide materials, furniture, lighting and specific technical elements from reference images.', uk: 'Мудборди можуть задавати матеріали, меблі, світло й конкретні технічні елементи з референсів.' },
    iterations: { en: 'Refine a room through successive design iterations and project history.', uk: 'Уточнюйте кімнату послідовними ітераціями зі збереженням історії проєкту.' },
    technical: { en: 'Budget-dependent specifications, materials and installation advice. Full insights on Pro Design and Studio / Architect.', uk: 'Специфікації, матеріали й поради з монтажу для різних бюджетів. Повні рекомендації у Pro Design та Studio / Architect.' },
    planning: { en: 'Use photos and blueprints as references. Briller is not a measured floor-plan or CAD editor.', uk: 'Фото та креслення використовуються як референси. Briller не є редактором обмірних планів чи CAD.' },
    shopping: { en: 'Shop the Look supports moving from a design image to an item shortlist. Confirm product dimensions, fit and current availability.', uk: 'Shop the Look допомагає перейти від дизайнерського зображення до списку предметів. Розміри, сумісність і наявність потрібно уточнювати.' },
    exports: { en: 'HD / 4K and PDF specification exports on Pro Design and Studio / Architect.', uk: 'HD / 4K та PDF-експорт специфікацій у Pro Design та Studio / Architect.' },
    commercial: { en: 'Commercial licensing on every paid plan; Free excludes it.', uk: 'Комерційна ліцензія на всіх платних тарифах; Free її не включає.' },
    teams: { en: `Studio / Architect includes ${plans.plans.find(plan => plan.name === 'Studio / Architect')!.seats} seats and shared projects.`, uk: `Studio / Architect включає ${plans.plans.find(plan => plan.name === 'Studio / Architect')!.seats} місця та спільні проєкти.` }
  };
  return content[key][locale];
}
export function comparisonMetadata(locale: Locale, competitor?: Competitor) {
  const c = comparisonCopy(locale);
  const title = competitor ? (locale === 'uk' ? `Альтернатива ${competitor.name}: Briller — можливості й тарифи` : `${competitor.name} Alternative: Briller Features & Pricing`) : locale === 'uk' ? 'Порівняння ШІ-дизайнерів: Briller та альтернативи' : 'AI Interior Design Alternatives: Compare Briller';
  const descriptionText = competitor ? (locale === 'uk' ? `Альтернатива ${competitor.name}: ${competitor.summary[locale]}` : `${competitor.name} alternative: ${competitor.summary[locale]}`) : c.intro;
  const description = descriptionText.length > 180 ? descriptionText.slice(0,180).replace(/\s+\S*$/,'') + '…' : descriptionText;
  const url = site.origin + comparisonHref(locale, competitor?.slug);
  return { title: title + ' | Briller', description, robots: { index: competitor ? competitor.verification === 'reviewed' : competitors.every(item => item.verification === 'reviewed'), follow: true }, alternates: { canonical: url, languages: { en: site.origin + comparisonHref('en', competitor?.slug), uk: site.origin + comparisonHref('uk', competitor?.slug), 'x-default': site.origin + comparisonHref('en', competitor?.slug) } }, openGraph: { title, description, url, type: 'website' as const, locale: locale === 'uk' ? 'uk_UA' : 'en_US', images: [socialPreview] }, twitter: { card: 'summary_large_image' as const, title, description, images: [socialPreview] } };
}

export function comparisonFAQs(product: Competitor, locale: Locale) {
  if(product.verification!=='reviewed')return [];
  const c=comparisonCopy(locale),title=(value:string)=>value.replace('{name}',product.name);
  return [
    {question:title(c.faqBriller),answer:product.chooseBriller.map(point=>point[locale]).join(' ')},
    {question:title(c.faqCompetitor),answer:product.chooseCompetitor.map(point=>point[locale]).join(' ')},
    {question:title(c.faqPricing),answer:`Briller: ${brillerPrice(locale)}. ${product.name}: ${product.pricing.summary[locale]} ${c.method[1]}`}
  ].filter(item=>item.answer.trim());
}
