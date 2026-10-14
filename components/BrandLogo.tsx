import { href, type Locale } from '@/lib/content';

export function BrandLogo({ locale, className = '' }: { locale: Locale; className?: string }) {
  return <a className={`brand-logo ${className}`} href={href(locale)} aria-label={locale === 'uk' ? 'Briller — головна' : 'Briller home'}>
    <img className="brand-symbol" src="/brand/briller-foreground.svg" alt="" width={48} height={48}/>
    <span className="brand-name">briller</span>
  </a>;
}
