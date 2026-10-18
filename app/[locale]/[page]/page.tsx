import { locales, copy, Locale, site, socialPreview, href, pageKeys, PageKey } from '@/lib/content';
import { Shell } from '@/components/Shell';
import { inspirationCopy, inspirationImage } from '@/lib/inspiration';
import { ContentPage } from '@/components/Pages';
import { notFound } from 'next/navigation';
import privacy from '@/content/privacy.json';
import terms from '@/content/terms.json';
import refunds from '@/content/refunds.json';
import cookies from '@/content/cookies.json';
export const dynamicParams = false;
export function generateStaticParams(){return locales.flatMap(locale=>pageKeys.map(page=>({locale,page})));}
export async function generateMetadata({params}:{params:Promise<{locale:string,page:string}>}){const {locale,page}=await params;if(!locales.includes(locale as Locale)||!pageKeys.includes(page as PageKey))return {};const c=copy(locale as Locale);const normal=c.pages[page as keyof typeof c.pages];const title=page==='gallery'?inspirationCopy(locale as Locale).seo.title:normal?.[0].replaceAll('\n',' ')||c.legalNames[page as keyof typeof c.legalNames];const description=page==='gallery'?inspirationCopy(locale as Locale).seo.description:page==='privacy'?privacy[locale as Locale].description:page==='terms'?terms[locale as Locale].description:page==='refunds'?refunds[locale as Locale].description:page==='cookies'?cookies[locale as Locale].description:normal?.[1]||c.draft;const images=page==='gallery'?[inspirationImage(locale as Locale)]:[socialPreview];return {title:title+' | Briller',description,robots:normal||page==='privacy'||page==='terms'||page==='refunds'||page==='cookies'?{index:true,follow:true}:{index:false,follow:true},alternates:{canonical:site.origin+href(locale as Locale,page),languages:{en:site.origin+href('en',page),uk:site.origin+href('uk',page),'x-default':site.origin+href('en',page)}},openGraph:{title:title+' | Briller',description,url:site.origin+href(locale as Locale,page),locale:locale==='uk'?'uk_UA':'en_US',type:'website',images},twitter:{card:'summary_large_image',title:title+' | Briller',description,images}};}
export default async function Page({params}:{params:Promise<{locale:string,page:string}>}){const {locale,page}=await params;if(!locales.includes(locale as Locale)||!pageKeys.includes(page as PageKey))notFound();return <Shell locale={locale as Locale} page={page}><ContentPage locale={locale as Locale} page={page as PageKey}/></Shell>;}
