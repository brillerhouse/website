import catalog from '@/content/advice-references.json';
import type { Locale } from './content';

export type AdviceReference = { id: string; url: string; label: string };

export function adviceReferences(locale: Locale, ids: readonly string[]): AdviceReference[] {
  return ids.map(id => {
    if (!Object.hasOwn(catalog, id)) throw new Error(`Unknown advice reference: ${id}`);
    const reference = catalog[id as keyof typeof catalog];
    return { id, url: reference.url, label: reference[locale].label };
  });
}
