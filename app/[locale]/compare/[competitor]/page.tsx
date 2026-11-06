import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/lib/content';
import { comparison2Products, comparison2BySlug, comparison2Metadata } from '@/lib/comparison2';
import { Comparison2Screen } from '@/components/Comparison2Pages';
export const dynamicParams = false;
export function generateStaticParams() { return locales.flatMap(locale => comparison2Products.map(product => ({ locale, competitor: product.slug }))); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string; competitor: string }> }) { const { locale, competitor } = await params; const product = comparison2BySlug(competitor); return locales.includes(locale as Locale) && product ? comparison2Metadata(locale as Locale, product) : {}; }
export default async function Page({ params }: { params: Promise<{ locale: string; competitor: string }> }) { const { locale, competitor } = await params; if (!locales.includes(locale as Locale)) notFound(); const product = comparison2BySlug(competitor); if (!product) notFound(); return <Comparison2Screen locale={locale as Locale} product={product}/>; }
