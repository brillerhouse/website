import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/lib/content';
import { comparison2Metadata } from '@/lib/comparison2';
import { Comparison2Screen } from '@/components/Comparison2Pages';
export const dynamicParams = false;
export function generateStaticParams() { return locales.map(locale => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; return locales.includes(locale as Locale) ? comparison2Metadata(locale as Locale) : {}; }
export default async function Page({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!locales.includes(locale as Locale)) notFound(); return <Comparison2Screen locale={locale as Locale}/>; }
