import { comparison2Metadata } from '@/lib/comparison2';
import { Comparison2Screen } from '@/components/Comparison2Pages';
export function generateMetadata() { return comparison2Metadata('en'); }
export default function Page() { return <Comparison2Screen locale="en"/>; }
