import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { metadataBase: new URL('https://briller.house'), title: 'Briller — AI interior design & architectural visualisation', description: 'Explore your space with Briller, an AI co-pilot for interior design, architectural visualisation and thoughtful renovation ideas.' };
export default function RootLayout({children}: {children: React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
