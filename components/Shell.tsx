import { copy, href, site, company, Locale } from '@/lib/content';
import { Header, Language } from './UI';
import { buildSolutionMenu } from '@/lib/solutions';
import { FooterLanguages, LocaleRouting } from './LanguagePreferences';
import { CookieConsent } from './CookieConsent';
import { BrandLogo } from './BrandLogo';

type Breadcrumb = { name: string; href: string };
export function Shell({ locale, page = '', children, breadcrumbs, blogPage = false }: { locale: Locale; page?: string; children: React.ReactNode; breadcrumbs?: Breadcrumb[]; blogPage?: boolean }) {
  const c = copy(locale);
  const legal = Object.entries(c.legalNames);
  const path = breadcrumbs ?? [{ name: c.nav[page as keyof typeof c.nav] || c.legalNames[page as keyof typeof c.legalNames], href: href(locale, page) }];
  const json = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': site.origin + '/#organization', name: 'Briller', legalName: company.legalName, address: { '@type': 'PostalAddress', ...company.address }, taxID: company.nip, identifier: [
        { '@type': 'PropertyValue', propertyID: 'KRS', value: company.krs },
        { '@type': 'PropertyValue', propertyID: 'REGON', value: company.regon }
      ], url: site.origin, email: site.email, logo: site.origin + '/brand/briller-icon.svg' },
      { '@type': 'WebSite', '@id': site.origin + '/#website', url: site.origin, name: 'Briller', inLanguage: ['en', 'uk'], publisher: { '@id': site.origin + '/#organization' } },
      ...(page ? [{ '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Briller', item: site.origin + href(locale) },
        ...path.map((item, i) => ({ '@type': 'ListItem', position: i + 2, name: item.name, item: site.origin + item.href }))
      ] }] : [])
    ]
  };
  return <><Language locale={locale}/>{!blogPage&&<LocaleRouting/>}<a className="skip" href="#main">{locale === 'uk' ? 'До основного вмісту' : 'Skip to content'}</a><Header locale={locale} page={page} solutionMenu={buildSolutionMenu(locale)}/><main id="main" lang={locale}>{children}</main>
    <footer><div className="footer-top"><div><BrandLogo locale={locale} className="wordmark"/><p>{c.footerLine}</p><a className="email" href={'mailto:' + site.email}>{site.email} ↗</a></div>
      <div><h3>{c.product}</h3>{Object.entries(c.nav).filter(([key]) => key !== 'use-cases').map(([key,label]) => <a key={key} href={href(locale,key)}>{label}</a>)}</div>
      <div><h3>{c.legal}</h3>{legal.map(([key,label]) => <a key={key} href={href(locale,key)}>{label}</a>)}<CookieConsent locale={locale}/></div>
      <div><p className="eyebrow">{c.brandLine}</p><a className="button" href={site.app}>{c.start} ↗</a><div className="footer-site-language"><p className="small">Briller.house</p><FooterLanguages locale={locale} page={page} {...(blogPage ? { languages: ['en'] as Locale[], paths: { en: '/' + page + '/' } } : {})}/></div></div>
    </div><div className="footer-bottom"><span>© {new Date().getFullYear()} {c.copyright}</span><span>{c.brandLine}</span></div></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json).replace(/</g, '\\u003c') }}/>
  </>;
}
