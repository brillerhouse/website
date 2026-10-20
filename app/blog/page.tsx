import { BlogPage } from '@/components/blog/BlogPage';
import { blogMetadata } from '@/lib/blog/content';
export const metadata = blogMetadata('Field Notes — Design & Renovation', 'Practical guides to AI interior design, renovation planning, materials and the technical details to check before you build.');
export default function Page() { return <BlogPage/>; }
