import './globals.css';
import type { Metadata } from 'next';
import { socialPreview } from '@/lib/content';
export const metadata: Metadata = { metadataBase: new URL('https://briller.house'), title: 'Briller — AI interior design & architectural visualisation', description: 'Explore your space with Briller, an AI co-pilot for interior design, architectural visualisation and thoughtful renovation ideas.', openGraph: { images: [socialPreview] }, twitter: { card: 'summary_large_image', images: [socialPreview] } };
export default function RootLayout({children}: {children: React.ReactNode}) {
  return <html lang="en">
    {/* Extensions can add body attributes before hydration; descendants still report mismatches. */}
    <body suppressHydrationWarning>{children}</body>
  </html>;
}
