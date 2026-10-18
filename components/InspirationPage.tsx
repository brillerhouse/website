import { ArrowUpRight, Layers, Ruler, Sparkles, Sun } from 'lucide-react';
import { href, site, type Locale } from '@/lib/content';
import { galleryHighlights, galleryRooms, galleryStyles } from '@/lib/gallery';
import { inspirationCopy, inspirationImage } from '@/lib/inspiration';
import { Gallery } from './Gallery';

export function InspirationPage({ locale }: { locale: Locale }) {
  const c = inspirationCopy(locale);
  const icons = [Sun, Layers, Ruler, Sparkles];
  const schema = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    '@id': site.origin + href(locale, 'gallery') + '#inspiration',
    url: site.origin + href(locale, 'gallery'), name: c.seo.title, description: c.seo.description,
    inLanguage: locale, isPartOf: { '@id': site.origin + '/#website' },
    primaryImageOfPage: { '@type': 'ImageObject', contentUrl: inspirationImage(locale).url, caption: inspirationImage(locale).alt },
    about: [...galleryRooms, ...galleryStyles].map(item => ({ '@type': 'Thing', name: item.label[locale] })),
    mainEntity: {
      '@type': 'ItemList', name: c.styles.title,
      itemListElement: galleryHighlights.map((item, index) => ({
        '@type': 'ListItem', position: index + 1,
        item: { '@type': 'ImageObject', name: item.title[locale], contentUrl: site.origin + (item.detailImage || item.image) }
      }))
    }
  };

  return <>
    <section className="page-heading inspiration-heading">
      <p className="eyebrow">{c.eyebrow}</p><h1>{c.title}</h1><p>{c.intro}</p>
      <div className="button-row"><a className="button" href="#design-library">{c.browse}<ArrowUpRight size={17} aria-hidden="true"/></a><a className="text-link" href="#design-details">{c.details}<ArrowUpRight size={17} aria-hidden="true"/></a></div>
    </section>
    <section className="section page-content page-gallery inspiration-collection">
      <Gallery locale={locale}>
        <section className="inspiration-styles" id="design-styles" aria-labelledby="design-styles-title">
          <div className="section-heading"><div><p className="eyebrow">{c.styles.eyebrow}</p><h2 id="design-styles-title">{c.styles.title}</h2></div><p>{c.styles.intro}</p></div>
          <div className="inspiration-style-grid">{c.styles.groups.map(group => <article key={group.title}>
            <h3>{group.title}</h3><p>{group.text}</p>
            <ul className="inspiration-style-names">{group.styles.map(id => <li key={id}>{galleryStyles.find(style => style.id === id)!.label[locale]}</li>)}</ul>
          </article>)}</div>
          <a className="text-link" href="#gallery-style-filter">{c.styles.browse}<ArrowUpRight size={17} aria-hidden="true"/></a>
        </section>
      </Gallery>
    </section>
    <section className="section inspiration-details" id="design-details" aria-labelledby="design-details-title">
      <div className="section-heading"><div><p className="eyebrow">{c.technologies.eyebrow}</p><h2 id="design-details-title">{c.technologies.title}</h2></div><p>{c.technologies.intro}</p></div>
      <div className="inspiration-detail-grid">{c.technologies.items.map((item, index) => { const Icon = icons[index]; return <article key={item.title}>
        <Icon size={25} strokeWidth={1.5} aria-hidden="true"/><h3>{item.title}</h3><p>{item.text}</p><a className="text-link" href={href(locale, item.page)}>{item.link}<ArrowUpRight size={16} aria-hidden="true"/></a>
      </article>; })}</div>
    </section>
    <section className="section inspiration-applications" aria-labelledby="inspiration-applications-title">
      <p className="eyebrow">{c.applications.eyebrow}</p><h2 id="inspiration-applications-title">{c.applications.title}</h2>
      <div className="inspiration-application-grid">{c.applications.items.map(item => <article key={item.title}>
        <h3>{item.title}</h3><p>{item.text}</p><a className="text-link" href={href(locale, item.page)}>{item.link}<ArrowUpRight size={16} aria-hidden="true"/></a>
      </article>)}</div>
    </section>
    <section className="section inspiration-how" aria-labelledby="inspiration-how-title">
      <p className="eyebrow">{c.howTo.eyebrow}</p><h2 id="inspiration-how-title">{c.howTo.title}</h2>
      <ol>{c.howTo.steps.map(([title, text], index) => <li key={title}><span aria-hidden="true">0{index + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
    </section>
    <section className="section inspiration-faq" aria-labelledby="inspiration-faq-title">
      <div><p className="eyebrow">{c.faq.eyebrow}</p><h2 id="inspiration-faq-title">{c.faq.title}</h2></div>
      <div className="faq-list">{c.faq.items.map(([question, answer], index) => <details key={question}><summary><span className="faq-number">0{index + 1}</span><span>{question}</span><span className="plus" aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
    </section>
    <section className="cta section inspiration-cta"><span className="cta-spark" aria-hidden="true">✳</span><p className="eyebrow">BRILLER</p><h2>{c.cta.title}</h2><p>{c.cta.text}</p><div className="button-row"><a className="button light" href={site.app}>{c.cta.start}<ArrowUpRight size={17} aria-hidden="true"/></a><a className="text-link" href={href(locale, 'solutions')}>{c.cta.solutions}<ArrowUpRight size={17} aria-hidden="true"/></a></div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>
  </>;
}
