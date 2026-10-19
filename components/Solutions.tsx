import { ArrowUpRight, Building2, House, Layers, Palette, Ruler, Sparkles, Sun, Wrench } from 'lucide-react';
import { Locale, href, site } from '@/lib/content';
import { Solution, solutionCopy, solutionHref, solutionNavigation } from '@/lib/solutions';
import { SolutionBriefs, SolutionDirectory } from './SolutionControls';
import { SolutionExample } from './SolutionExample';

const groupIcons = { house: House, ruler: Ruler, building: Building2 };
const adviceIcons = [Layers, Sun, Wrench];
function SolutionsCta({ locale }: { locale: Locale }) {
  const h = solutionCopy(locale).hub;
  return <section className="cta section"><span className="cta-spark" aria-hidden="true">✳</span><p className="eyebrow">BRILLER</p><h2>{h.ctaTitle}</h2><p>{h.ctaText}</p><a className="button light" href={site.app}>{h.start}<ArrowUpRight size={18} aria-hidden="true"/></a></section>;
}
export function SolutionBreadcrumbs({ locale, page }: { locale: Locale; page?: Solution }) {
  const h = solutionCopy(locale).hub;
  const category = page && solutionNavigation.categories.find(item => item.id === page.category);
  return <nav className="solution-breadcrumbs" aria-label={locale === 'uk' ? 'Навігаційний шлях' : 'Breadcrumb'}><ol>
    <li><a href={href(locale)}>{h.home}</a></li>
    <li>{page ? <a href={solutionHref(locale)}>{h.allSolutions}</a> : <span aria-current="page">{h.allSolutions}</span>}</li>
    {page && <><li><a href={solutionHref(locale) + '#category-' + page.category}>{category?.title[locale]}</a></li><li><span aria-current="page">{page.label}</span></li></>}
  </ol></nav>;
}
export function SolutionsHub({ locale }: { locale: Locale }) {
  const c = solutionCopy(locale);
  const h = c.hub;
  const json = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: h.title.replaceAll('\n', ' '), description: h.intro, url: site.origin + solutionHref(locale), inLanguage: locale, mainEntity: { '@type': 'ItemList', numberOfItems: c.pages.length, itemListElement: c.pages.map((page, i) => ({ '@type': 'ListItem', position: i + 1, name: page.label, url: site.origin + solutionHref(locale, page.slug) })) } };
  return <><SolutionBreadcrumbs locale={locale}/><section className="page-heading solutions-heading"><p className="eyebrow">{h.eyebrow}</p><h1>{h.title}</h1><p>{h.intro}</p><div className="button-row"><a className="button" href="#audiences">{h.browseAudience}<ArrowUpRight size={18} aria-hidden="true"/></a><a className="button outline" href="#projects">{h.browseProjects}</a></div></section>
    <section className="section solutions-audiences" id="audiences" aria-labelledby="audience-heading"><div className="section-heading"><h2 id="audience-heading">{h.audienceTitle}</h2><p>{h.audienceIntro}</p></div>
      <div className="solution-audience-grid">{solutionNavigation.groups.map(group => {
        const Icon = groupIcons[group.icon as keyof typeof groupIcons];
        return <article id={group.id} key={group.id}><div className="solution-group-top"><Icon size={28} strokeWidth={1.4} aria-hidden="true"/></div><h3>{group.title[locale]}</h3><p>{group.intro[locale]}</p><ul aria-label={h.groupLinks}>{group.pages.map(slug => {
          const page = c.pages.find(item => item.slug === slug)!;
          return <li key={slug}><a href={solutionHref(locale, slug)}>{page.label}<ArrowUpRight size={17} aria-hidden="true"/></a></li>;
        })}</ul></article>;
      })}</div>
    </section>
    <section className="section solutions-projects" id="projects" aria-labelledby="project-heading"><div className="section-heading"><h2 id="project-heading">{h.projectTitle}</h2><p>{h.projectIntro}</p></div><SolutionDirectory locale={locale} labels={h} pages={c.pages.map(({ slug, label, title, intro, category, audiences, briefs }) => ({ slug, label, title, intro, category, audiences, briefs }))}/></section>
    <SolutionsCta locale={locale}/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json).replace(/</g, '\\u003c') }}/>
  </>;
}
export function SolutionPage({ locale, page }: { locale: Locale; page: Solution }) {
  const c = solutionCopy(locale);
  const h = c.hub;
  const category = solutionNavigation.categories.find(item => item.id === page.category)!;
  const sections = [['overview',h.overview],['before-after',locale === 'uk' ? 'До та після' : 'Before & after'],['workflow',h.workflow],['insights',h.advice],['briefs',h.briefs],['questions',h.faq]];
  const related = page.related.map(slug => c.pages.find(item => item.slug === slug)).filter((item): item is Solution => Boolean(item));
  const json = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', name: page.title, description: page.intro, url: site.origin + solutionHref(locale, page.slug), inLanguage: locale, isPartOf: { '@id': site.origin + '/#website' } },
    { '@type': 'FAQPage', mainEntity: page.faqs.map(([q,a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  ] };
  return <><SolutionBreadcrumbs locale={locale} page={page}/><section className="section solution-hero"><div><p className="eyebrow">{category.title[locale]}</p><h1>{page.title}</h1><p className="solution-lead">{page.intro}</p><div className="button-row"><a className="button" href={site.app}>{h.start}<ArrowUpRight size={18} aria-hidden="true"/></a><a className="text-link" href={href(locale, 'pricing')}>{h.pricing}<ArrowUpRight size={18} aria-hidden="true"/></a></div></div>
      <aside className="solution-starter"><Sparkles size={30} strokeWidth={1.3} aria-hidden="true"/><p className="eyebrow">{h.nextStep}</p><blockquote>{page.briefs[0]}</blockquote><p>{h.briefIntro}</p><a className="text-link" href="#briefs">{h.briefs}<ArrowUpRight size={18} aria-hidden="true"/></a></aside>
    </section>
    <nav className="solution-section-nav" aria-label={h.sectionNav}>{sections.map(([id,label]) => <a key={id} href={'#'+id}>{label}</a>)}</nav>
    <section className="section solution-overview" id="overview"><div><p className="eyebrow">{h.overview}</p><h2>{page.problemTitle}</h2><p className="body-copy">{page.problem}</p></div><ul className="solution-pains">{page.pains.map(pain => <li key={pain}><p>{pain}</p></li>)}</ul></section>
    <SolutionExample locale={locale} slug={page.slug}/>
    <section className="section solution-benefits"><p className="eyebrow">BRILLER</p><h2>{h.benefits}</h2><div className="solution-benefit-grid">{page.benefits.map(([title,text]) => <article key={title}><Palette className="solution-benefit-icon" size={22} strokeWidth={1.4} aria-hidden="true"/><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="section solution-workflow" id="workflow"><p className="eyebrow">{h.workflow}</p><h2>{locale === 'uk' ? 'Від фото до наступного кроку.' : 'From your photo to your next step.'}</h2><ol>{page.steps.map(([title,text],i) => <li key={title}><span>{String(i+1).padStart(2,'0')}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol></section>
    <section className="section solution-insights" id="insights"><div className="section-heading"><div><p className="eyebrow">{h.sampleLabel}</p><h2>{h.advice}</h2></div><p>{h.sampleNote}</p></div><div className="solution-advice-grid">{page.advice.map(([title,text],i) => { const Icon = adviceIcons[i]; return <article key={title}><Icon size={25} strokeWidth={1.4} aria-hidden="true"/><h3>{title}</h3><p>{text}</p></article>; })}</div><div className="solution-practical-note"><Wrench size={22} aria-hidden="true"/><div><h3>{h.notes}</h3><p>{page.note}</p></div></div></section>
    <section className="section solution-directions" id="related-solutions" aria-labelledby="related-solutions-heading"><div className="section-heading"><h2 id="related-solutions-heading">{h.related}</h2><a className="text-link" href={solutionHref(locale)}>{h.allSolutions}<ArrowUpRight size={18} aria-hidden="true"/></a></div><div className="solution-card-grid">{related.map(item => <a className="solution-card" key={item.slug} href={solutionHref(locale,item.slug)}><h3>{item.label}</h3><p>{item.intro}</p><span className="solution-card-link">{h.open}<ArrowUpRight size={18} aria-hidden="true"/></span></a>)}</div></section>
    <section className="section solution-brief-section" id="briefs"><div className="section-heading"><h2>{h.briefs}</h2><p>{h.briefIntro}</p></div><SolutionBriefs labels={h} briefs={page.briefs}/></section>
    <section className="section faq-section solution-faq" id="questions"><div><p className="eyebrow">FAQ</p><h2>{h.faq}</h2><p className="body-copy">{h.faqIntro}</p></div><div className="faq-list">{page.faqs.map(([q,a]) => <details key={q}><summary><span>{q}</span><span className="plus" aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>

    <SolutionsCta locale={locale}/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json).replace(/</g, '\\u003c') }}/>
  </>;
}
