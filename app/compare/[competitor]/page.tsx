import { notFound } from 'next/navigation';
import { comparison2Products, comparison2BySlug, comparison2Metadata } from '@/lib/comparison2';
import { Comparison2Screen } from '@/components/Comparison2Pages';
export const dynamicParams = false;
export function generateStaticParams() { return comparison2Products.map(product => ({ competitor: product.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ competitor: string }> }) { const { competitor } = await params; const product = comparison2BySlug(competitor); return product ? comparison2Metadata('en', product) : {}; }
export default async function Page({ params }: { params: Promise<{ competitor: string }> }) { const { competitor } = await params; const product = comparison2BySlug(competitor); if (!product) notFound(); return <Comparison2Screen locale="en" product={product}/>; }
