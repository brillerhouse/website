import { ArrowUpRight, Calculator, Ruler, Sparkles, Wrench, Youtube } from 'lucide-react';
import { copy, Locale, site } from '@/lib/content';
import mike from '@/content/mike.json';

const icons = [Ruler, Calculator, Wrench];

export function MikeAdvisor({ locale }: { locale: Locale }) {
  const c = copy(locale).home.mike;
  const statuses = ['available', mike.budgetGuidanceStatus, mike.constructionGuidanceStatus];
  return <section className="mike-section section" id="mike-briller" aria-labelledby="mike-heading">
    <div className="mike-profile">
      <figure className="mike-avatar">
        <div className="mike-portrait">
          {mike.avatarSrc
            ? <img src={mike.avatarSrc} alt={c.avatarAlt} loading="lazy" width={600} height={660}/>
            : <div className="mike-portrait-placeholder"><span aria-hidden="true">MB</span><p>{c.avatarPending}</p></div>}
          <div className="mike-nameplate"><strong>Mike Briller<span aria-hidden="true">✳</span></strong><span>{c.role}</span></div>
        </div>
        <figcaption>{c.avatarDisclosure}</figcaption>
      </figure>
      <div className="mike-example">
        <Sparkles size={16} aria-hidden="true"/>
        <blockquote>{c.quote}</blockquote>
        <p>{c.quoteNote}</p>
      </div>
    </div>
    <div className="mike-introduction">
      <p className="eyebrow">{c.eyebrow}</p>
      <h2 id="mike-heading">{c.title}</h2>
      <p className="mike-intro">{c.intro}</p>
      <ul className="mike-topics">
        {c.topics.map((topic, i) => {
          const Icon = icons[i];
          return <li key={topic.title}><Icon size={22} strokeWidth={1.5} aria-hidden="true"/><div>
            <h3>{topic.title}{statuses[i] !== 'available' && <span className="mike-planned">{c.planned}</span>}</h3>
            <p>{topic.text}</p>
            {i === 1 && <ul className="mike-budget-levels" aria-label={topic.title}>{c.budgetLevels.map(level => <li key={level}>{level}</li>)}</ul>}
          </div></li>;
        })}
      </ul>
      <a className="text-link" href={site.app}>{c.cta}<ArrowUpRight size={18}/></a>
      <div className="mike-youtube">
        {mike.youtubeUrl
          ? <a className="text-link" href={mike.youtubeUrl} target="_blank" rel="noopener noreferrer"><Youtube size={20} aria-hidden="true"/>{c.youtube}<ArrowUpRight size={17}/></a>
          : <p className="mike-youtube-pending"><Youtube size={20} aria-hidden="true"/>{c.youtubePending}</p>}
        <p>{c.youtubeText}</p>
      </div>
      <p className="mike-technical-note">{c.technicalNote}</p>
    </div>
  </section>;
}
