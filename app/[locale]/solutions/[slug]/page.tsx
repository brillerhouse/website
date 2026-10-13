import { notFound } from 'next/navigation';
import { Locale, locales } from '@/lib/content';
import { findSolution, solutionMetadata, solutionSlugs, solutionNavigation, solutionCopy, solutionHref } from '@/lib/solutions';
import { Shell } from '@/components/Shell';
import { SolutionPage } from '@/components/Solutions';
export const dynamicParams = false;
export function generateStaticParams() { return locales.flatMap(locale => solutionSlugs.map(slug => ({ locale, slug }))); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale) || !solutionSlugs.includes(slug)) return {};
  return solutionMetadata(locale as Locale, slug);
}
export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const language = locale as Locale;
  const page = findSolution(language, slug);
  if (!page) notFound();
  const category = solutionNavigation.categories.find(item => item.id === page.category)!;
  const h = solutionCopy(language).hub;
  return <Shell locale={language} page={'solutions/' + slug} breadcrumbs={[{ name: h.allSolutions, href: solutionHref(language) }, { name: category.title[language], href: solutionHref(language) + '#category-' + page.category }, { name: page.label, href: solutionHref(language, slug) }]}><SolutionPage locale={language} page={page}/></Shell>;
}
