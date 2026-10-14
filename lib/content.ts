import en from '@/content/en.json';
import uk from '@/content/uk.json';
import company from '@/content/company.json';
export { company };
export type Locale = 'en' | 'uk';
export type Copy = typeof en;
export const locales: Locale[] = ['en', 'uk'];
export const copy = (locale: Locale): Copy => locale === 'uk' ? uk : en;
export const pageKeys = ['features','use-cases','gallery','pricing','faq','contact','privacy','terms','refunds','cookies'] as const;
export type PageKey = typeof pageKeys[number];
export const site = {origin: 'https://briller.house', app: 'https://build.briller.house', email: 'hello@briller.house'};
export const href = (locale: Locale, page = '') => `/${locale}/${page ? page + '/' : ''}`;
export function legalText(text: string, locale: Locale) {
  const a = company.address;
  const address = `${a.streetAddress}, ${a.postalCode} ${a.addressLocality}, ${locale === 'uk' ? 'Польща' : 'Poland'}`;
  const details = `${company.legalName} (${company.shortName}), ${address}; KRS: ${company.krs}, NIP: ${company.nip}, REGON: ${company.regon}`;
  return text.replaceAll('{{operatorDetails}}', details);
}
