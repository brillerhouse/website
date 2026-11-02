import {notFound} from 'next/navigation';
import {locales,type Locale} from '@/lib/content';
import {comparisonCopy,comparisonHref,comparisonMetadata} from '@/lib/compare';
import {ComparisonHub} from '@/components/ComparisonPages';
import {Shell} from '@/components/Shell';
export const dynamicParams=false;
export function generateStaticParams(){return locales.map(locale=>({locale}));}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const {locale}=await params;return locales.includes(locale as Locale)?comparisonMetadata(locale as Locale):{};}
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!locales.includes(locale as Locale))notFound();const language=locale as Locale;return <Shell locale={language} page="compare" breadcrumbs={[{name:comparisonCopy(language).label,href:comparisonHref(language)}]}><ComparisonHub locale={language}/></Shell>;}
