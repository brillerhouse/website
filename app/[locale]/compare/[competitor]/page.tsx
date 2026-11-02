import {notFound} from 'next/navigation';
import {locales,type Locale} from '@/lib/content';
import {competitors,competitorBySlug,comparisonCopy,comparisonHref,comparisonMetadata} from '@/lib/compare';
import {CompetitorComparison} from '@/components/ComparisonPages';
import {Shell} from '@/components/Shell';
export const dynamicParams=false;
export function generateStaticParams(){return locales.flatMap(locale=>competitors.map(product=>({locale,competitor:product.slug})));}
export async function generateMetadata({params}:{params:Promise<{locale:string;competitor:string}>}){const {locale,competitor}=await params;const product=competitorBySlug(competitor);return locales.includes(locale as Locale)&&product?comparisonMetadata(locale as Locale,product):{};}
export default async function Page({params}:{params:Promise<{locale:string;competitor:string}>}){const {locale,competitor}=await params;if(!locales.includes(locale as Locale))notFound();const product=competitorBySlug(competitor);if(!product)notFound();const language=locale as Locale;return <Shell locale={language} page={'compare/'+product.slug} breadcrumbs={[{name:comparisonCopy(language).label,href:comparisonHref(language)},{name:`Briller vs ${product.name}`,href:comparisonHref(language,product.slug)}]}><CompetitorComparison product={product} locale={language}/></Shell>;}
