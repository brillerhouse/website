import en from '@/content/solutions/en.json';
import uk from '@/content/solutions/uk.json';
import navigation from '@/content/solutions/navigation.json';
import { href, Locale, site } from './content';

export type Solution = typeof en.pages[number];
export type SolutionsLabels = typeof en.hub;
export const solutionCopy = (locale: Locale): typeof en => locale === 'uk' ? uk : en;
export const solutionNavigation = navigation;
export const solutionSlugs = en.pages.map(page => page.slug);
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
