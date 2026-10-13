import { notFound } from 'next/navigation';
import { Locale, locales } from '@/lib/content';
import { solutionMetadata } from '@/lib/solutions';
import { Shell } from '@/components/Shell';
import { SolutionsHub } from '@/components/Solutions';
export const dynamicParams = false;
export function generateStaticParams() { return locales.map(locale => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  return solutionMetadata(locale as Locale);
}
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  return <Shell locale={locale as Locale} page="solutions"><SolutionsHub locale={locale as Locale}/></Shell>;
}
