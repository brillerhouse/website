import { locales, copy, Locale, site, socialPreview, href } from '@/lib/content';
import { Shell } from '@/components/Shell';
import { Home } from '@/components/Pages';
import { notFound } from 'next/navigation';
export const dynamicParams = false;
export function generateStaticParams(){return locales.map(locale=>({locale}));}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!locales.includes(locale as Locale))return {};const c=copy(locale as Locale);return {title:locale==='uk'?'Briller — AI-дизайн інтер’єрів та архітектурна візуалізація':'Briller — AI interior design & architectural visualisation',description:c.home.intro,alternates:{canonical:site.origin+href(locale as Locale),languages:{en:site.origin+href('en'),uk:site.origin+href('uk'),'x-default':site.origin+href('en')}},openGraph:{title:'Briller — '+c.brandLine,description:c.home.intro,url:site.origin+href(locale as Locale),locale:locale==='uk'?'uk_UA':'en_US',type:'website',images:[socialPreview]},twitter:{card:'summary_large_image',title:'Briller — '+c.brandLine,description:c.home.intro,images:[socialPreview]}};}
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!locales.includes(locale as Locale))notFound();return <Shell locale={locale as Locale}><Home locale={locale as Locale}/></Shell>;}
