import en from '@/content/solutions/en.json';
import uk from '@/content/solutions/uk.json';
import navigation from '@/content/solutions/navigation.json';
import examples from '@/content/solutions/examples.json';
import media from '@/content/solutions/media.json';
import budgets from '@/content/solutions/budgets.json';
import advice from '@/content/solutions/advice.json';
import sparks from '@/content/solutions/sparks.json';
import { copy, href, Locale, site } from './content';

export type Solution = typeof en.pages[number];
export type SolutionsLabels = typeof en.hub;
export const solutionCopy = (locale: Locale): typeof en => locale === 'uk' ? uk : en;
export const solutionNavigation = navigation;
export const solutionSlugs = en.pages.map(page => page.slug);
export function solutionExample(locale: Locale, slug: string) {
  if (!Object.hasOwn(examples, slug)) throw new Error(`Missing solution example: ${slug}`);
  const key = slug as keyof typeof examples;
  return { ...examples[key][locale], image: media[key] };
}
export function solutionBudgets(locale: Locale, slug: string) {
  if (!Object.hasOwn(budgets, slug)) throw new Error(`Missing solution budgets: ${slug}`);
  return budgets[slug as keyof typeof budgets][locale];
}
export type SolutionAdvice = {
  id: string;
  kind: string;
  category: string;
  title: string;
  position?: { x: number; y: number };
  budgets: Record<'economy' | 'standard' | 'premium', { specification: string; detail: string; difference: string }>;
};
export function solutionAdvice(locale: Locale, slug: string): SolutionAdvice[] {
  if (!Object.hasOwn(advice.pages, slug)) throw new Error(`Missing solution advice: ${slug}`);
  const positions: Record<string, number[]> = sparks[slug as keyof typeof sparks];
  return advice.pages[slug as keyof typeof advice.pages].map(id => {
    const coordinates = positions?.[id];
    const position = coordinates ? { x: coordinates[0], y: coordinates[1] } : undefined;
    if (Object.hasOwn(advice.sharedHomeTips, id)) {
      const { index, kind } = advice.sharedHomeTips[id as keyof typeof advice.sharedHomeTips];
      const tip = copy(locale).home.brillDemo.tips[index];
      return { id, kind, category: tip.category, title: tip.title, budgets: tip.budgets, position };
    }
    if (!Object.hasOwn(advice.topics, id)) throw new Error(`Missing solution advice topic: ${id}`);
    const topic = advice.topics[id as keyof typeof advice.topics];
    return { id, kind: topic.kind, ...topic[locale], position };
  });
}
export const solutionHref = (locale: Locale, slug = '') => href(locale, 'solutions' + (slug ? '/' + slug : ''));
export const findSolution = (locale: Locale, slug: string) => solutionCopy(locale).pages.find(page => page.slug === slug);
export const solutionPaths = ['solutions', ...solutionSlugs.map(slug => 'solutions/' + slug)];
export function solutionMetadata(locale: Locale, slug = '') {
  const c = solutionCopy(locale);
  const page = slug ? findSolution(locale, slug) : undefined;
  const title = (page?.label ?? (locale === 'uk' ? 'Рішення для дому, клієнтів і нерухомості' : 'Solutions for your home, clients & property')) + ' | Briller';
  const description = page?.intro ?? c.hub.intro;
  const url = site.origin + solutionHref(locale, slug);
  return {
    title, description,
    alternates: { canonical: url, languages: { en: site.origin + solutionHref('en', slug), uk: site.origin + solutionHref('uk', slug), 'x-default': site.origin + solutionHref('en', slug) } },
    openGraph: { title, description, url, type: 'website' as const, locale: locale === 'uk' ? 'uk_UA' : 'en_US', images: [site.origin + '/images/hero.jpg'] },
    twitter: { card: 'summary_large_image' as const, title, description, images: [site.origin + '/images/hero.jpg'] }
  };
}

export type SolutionMenuGroup = {
  id: string;
  kind: 'audience' | 'project';
  label: string;
  href: string;
  links: { label: string; href: string; slug: string }[];
};
export function buildSolutionMenu(locale: Locale): SolutionMenuGroup[] {
  const pages = solutionCopy(locale).pages;
  const link = (page: Solution) => ({ label: page.label, href: solutionHref(locale, page.slug), slug: page.slug });
  return [
    ...navigation.groups.map(group => ({ id: group.id, kind: 'audience' as const, label: group.title[locale], href: solutionHref(locale) + '#' + group.id, links: group.pages.map(slug => link(pages.find(page => page.slug === slug)!)) })),
    ...navigation.categories.map(category => ({ id: category.id, kind: 'project' as const, label: category.title[locale], href: solutionHref(locale) + '#category-' + category.id, links: pages.filter(page => page.category === category.id).map(link) }))
  ];
}
