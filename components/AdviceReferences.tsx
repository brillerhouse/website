import { ArrowUpRight } from 'lucide-react';
import type { AdviceReference } from '@/lib/advice';
import type { Locale } from '@/lib/content';

export function AdviceReferences({ locale, check, references }: { locale: Locale; check: string; references: AdviceReference[] }) {
  return <div className="advice-evidence">
    <p className="brill-specification-label">{locale === 'uk' ? 'Що перевірити до замовлення' : 'Check before ordering'}</p>
    <p>{check}</p>
    <p className="brill-specification-label">{locale === 'uk' ? 'Довідкові джерела' : 'Reference sources'}</p>
    <ul className="advice-references">
      {references.map(reference => <li key={reference.id}><a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.label}<ArrowUpRight size={14} aria-hidden="true"/></a></li>)}
    </ul>
  </div>;
}
