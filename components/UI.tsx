'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X, Download, Check, Sparkles, ArrowLeftRight } from 'lucide-react';
import { copy, href, site, Locale } from '@/lib/content';
import pricing from '@/content/plans.json';
import gallery from '@/content/gallery.json';
import { SolutionsMenu } from './SolutionsMenu';
import type { SolutionMenuGroup } from '@/lib/solutions';
export function Language({locale}:{locale:Locale}){useEffect(()=>{document.documentElement.lang=locale},[locale]);return null;}
export function Header({locale,page,solutionMenu}:{locale:Locale,page:string,solutionMenu:SolutionMenuGroup[]}) {
  const [open,setOpen]=useState(false);
  const toggle=useRef<HTMLButtonElement>(null);
  const c=copy(locale);
  const links=[
    {label:c.header.howItWorks,url:href(locale)+'#how-it-works',active:false},
    {label:c.header.solutions,url:href(locale,'solutions'),active:page==='solutions'||page.startsWith('solutions/')},
    {label:c.header.resources,url:href(locale,'faq'),active:page==='faq'},
    {label:c.header.plans,url:href(locale,'pricing'),active:page==='pricing'},
  ];
  useEffect(()=>{
    if(!open)return;
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);toggle.current?.focus();}};
    window.addEventListener('keydown',escape);
    return ()=>window.removeEventListener('keydown',escape);
  },[open]);
  return <header className="site-header">
    <a className="header-brand" href={href(locale)} aria-label={locale==='uk'?'Briller — головна':'Briller home'}>
      <span className="brand-name">briller<span className="brand-asterisk" aria-hidden="true">✳</span></span>
    </a>
    <nav id="primary-navigation" className={open?'nav open':'nav'} aria-label={locale==='uk'?'Головна навігація':'Main navigation'}>
      {links.map((link,i)=>i===1?<SolutionsMenu key={link.label} locale={locale} page={page} groups={solutionMenu} mobileOpen={open} onNavigate={()=>setOpen(false)}/>:<a aria-current={link.active?'page':undefined} href={link.url} key={link.label} onClick={()=>setOpen(false)}>{link.label}</a>)}
    </nav>
    <div className="header-actions">
      <a className="locale" href={href(locale==='en'?'uk':'en',page)} hrefLang={locale==='en'?'uk':'en'} aria-label={locale==='en'?'Перемкнути українською':'Switch to English'}>{locale==='en'?'UK':'EN'}</a>
      <a className="header-cta button" href={site.app}>{c.login}</a>
      <button ref={toggle} className="mobile-menu" aria-label={open?c.close:c.menu} aria-expanded={open} aria-controls="primary-navigation" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
    </div>
  </header>;
}
export function HeroComparison({locale}:{locale:Locale}) {
  const h=copy(locale).home;
  const [position,setPosition]=useState(50);
  const dragging=useRef(false);
  function update(event:React.PointerEvent<HTMLInputElement>){
    const rect=event.currentTarget.getBoundingClientRect();
    setPosition(Math.max(0,Math.min(100,Math.round((event.clientX-rect.left)/rect.width*100))));
  }
  return <figure className="hero-room-comparison">
    <div className="hero-room-frame">
      <span className="sr-only">{h.imageLabel}</span>
      <div className="hero-room-photo hero-room-before" aria-hidden="true"/>
      <div className="hero-room-photo hero-room-after" style={{clipPath:`inset(0 0 0 ${position}%)`}} aria-hidden="true"/>
      <span className="hero-room-label hero-room-label-before">{h.beforeLabel}</span>
      <span className="hero-room-label hero-room-label-after">{h.afterLabel}</span>
      <div className="hero-room-divider" style={{left:`${position}%`}} aria-hidden="true"><span><ArrowLeftRight size={21} strokeWidth={1.8}/></span></div>
      <input className="hero-room-range" type="range" min={0} max={100} value={position} aria-label={h.compareLabel} aria-describedby="hero-comparison-caption"
        aria-valuetext={`${h.beforeLabel}: ${position}%. ${h.afterLabel}: ${100-position}%.`}
        onChange={event=>setPosition(Number(event.target.value))}
        onPointerDown={event=>{event.preventDefault();event.currentTarget.focus({preventScroll:true});dragging.current=true;event.currentTarget.setPointerCapture(event.pointerId);update(event);}}
        onPointerMove={event=>{if(dragging.current){event.preventDefault();update(event);}}}
        onPointerUp={()=>{dragging.current=false;}}
        onPointerCancel={()=>{dragging.current=false;}}
        onLostPointerCapture={()=>{dragging.current=false;}}/>
    </div>
    <figcaption id="hero-comparison-caption">{h.imageNote}</figcaption>
  </figure>;
}
export function Compare({locale}:{locale:Locale}){const c=copy(locale).comparison;const [position,setPosition]=useState(50);return <section className="comparison section"><div><p className="eyebrow">{c.label}</p><h2>{c.title}</h2><p className="body-copy">{c.text}</p></div><div className="compare-image"><img src="/images/detail.jpg" alt={c.before} loading="lazy"/><div className="warm-layer" style={{clipPath:`inset(0 0 0 ${position}%)`}}><img src="/images/detail.jpg" alt="" loading="lazy"/></div><span className="compare-label before">{c.before}</span><span className="compare-label after">{c.after}</span><div className="compare-line" style={{left:`${position}%`}}><span><ArrowLeftRight size={19}/></span></div><input aria-label={c.control} type="range" min="0" max="100" value={position} onChange={e=>setPosition(Number(e.target.value))}/></div></section>;}
export function Pricing({locale,full=false}:{locale:Locale,full?:boolean}){const c=copy(locale);const p=c.pricing;const [annual,setAnnual]=useState(false);return <><div className="billing-toggle"><button aria-pressed={!annual} className={!annual?'selected':''} onClick={()=>setAnnual(false)}>{p.monthly}</button><button aria-pressed={annual} className={annual?'selected':''} onClick={()=>setAnnual(true)}>{p.annual}<span>{locale==='uk'?'до −20%':'up to −20%'}</span></button></div><p className="billing-hint">{annual?p.annualNote:p.creditNote}</p><div className="pricing-grid">{pricing.plans.map((plan,i)=><article className={'price-card '+(i===2?'featured':'')} key={plan.name}>{i===2&&<span className="popular">{p.popular}</span>}<p className="plan-index">0{i+1}</p><h3>{plan.name}</h3><p>{c.planDescriptions[i]}</p><div className="price">${(annual?plan.annualMonthly:plan.monthly).toFixed(plan.monthly===0?0:2)}<small>{p.perMonth}</small></div><p className="annual-total">{annual&&plan.monthly>0?`${p.billed}: $${(plan.annualMonthly*12).toFixed(2)}`:'\u00a0'}</p><a className={'button '+(i===2?'':'outline')} href={site.app}>{i===0?c.start:p.choose}<ArrowUpRight size={15}/></a><ul><li><Check size={15}/>{plan.credits} {i===0?(locale==='uk'?'ітерацій / міс.':'iterations / month'):(locale==='uk'?'кредитів / міс.':'credits / month')}</li><li><Check size={15}/>{plan.projects===null?p.unlimited:plan.projects} {locale==='uk'?'проєктів':'projects'}</li><li><Check size={15}/>{plan.watermark?(locale==='uk'?'З водяним знаком':'Watermarked renders'):(locale==='uk'?'Без водяного знаку':'No watermark')}</li><li><Check size={15}/>{plan.insights==='full'?p.full:p.basic} Briller</li>{plan.resolution&&<li><Check size={15}/>HD / 4K</li>}{plan.seats===3&&<li><Check size={15}/>3 {p.seats}</li>}{plan.pdf&&<li><Check size={15}/>{p.pdf}</li>}{plan.commercial&&<li><Check size={15}/>{p.commercial}</li>}{plan.fastQueue&&<li><Check size={15}/>{p.fastQueue}</li>}{plan.sharedProjects&&<li><Check size={15}/>{p.sharedProjects}</li>}</ul></article>)}</div><p className="small pricing-note">{p.billingNote}</p>{full&&<><h2 className="table-title">{p.compare}</h2><div className="table-wrap" role="region" aria-label={p.compare} tabIndex={0}><table><thead><tr><th>{locale==='uk'?'Можливість':'Feature'}</th>{pricing.plans.map(plan=><th key={plan.name} scope="col">{plan.name}</th>)}</tr></thead><tbody>{(['credits','projects','watermark','insights','resolution','seats','pdf','commercial','fastQueue','sharedProjects'] as const).map(key=><tr key={key}><th scope="row">{p[key]}</th>{pricing.plans.map(plan=>{const value=plan[key];return <td key={plan.name}>{value===null?p.unlimited:typeof value==='boolean'?(value?p.yes:p.no):value==='basic'?p.basic:value==='full'?p.full:value}</td>})}</tr>)}</tbody></table></div><div className="topup-heading"><h2>{p.topups}</h2><p>{p.topupIntro}</p></div><div className="topups">{pricing.topups.map(([name,price,credits])=><a href={site.app} className="topup" key={name}><span>{name}</span><strong>${Number(price).toFixed(2)}</strong><small>{credits} {p.pack}</small><ArrowUpRight size={17}/></a>)}</div><p className="small pricing-note">{p.manage}</p></>}</>;}
export function Faq({locale,compact=false}:{locale:Locale,compact?:boolean}){const c=copy(locale);const entries=compact?c.faqs.slice(0,5):c.faqs;return <div className="faq-list">{entries.map(([question,answer],i)=><details key={question}><summary><span className="faq-number">{String(i+1).padStart(2,'0')}</span><span>{question}</span><span className="plus">+</span></summary><p>{answer}</p></details>)}</div>;}
export function Gallery({locale,preview=false}:{locale:Locale,preview?:boolean}){const c=copy(locale);const g=c.gallery;const [room,setRoom]=useState('all');const [style,setStyle]=useState('all');const [active,setActive]=useState<typeof gallery[number]|null>(null);const dialog=useRef<HTMLDialogElement>(null);const opener=useRef<HTMLButtonElement|null>(null);const items=preview?gallery.slice(0,3):gallery.filter(item=>(room==='all'||item.room===room)&&(style==='all'||item.style===style));const open=(item:typeof gallery[number],button:HTMLButtonElement)=>{opener.current=button;setActive(item);dialog.current?.showModal()};const close=()=>{dialog.current?.close();setActive(null);opener.current?.focus()};return <>{!preview&&<div className="gallery-controls"><div className="filter-chips" role="group" aria-label={g.roomFilter}>{(['all','living','kitchen','bedroom'] as const).map(key=><button aria-pressed={room===key} className={room===key?'active':''} onClick={()=>setRoom(key)} key={key}>{g[key]}</button>)}</div><label className="style-select">{g.styleFilter}<select value={style} onChange={e=>setStyle(e.target.value)}>{(['all','minimalism','japandi','natural'] as const).map(key=><option key={key} value={key}>{key==='all'?g.allStyles:g[key]}</option>)}</select></label></div>}<div className="gallery-grid">{items.map((item,i)=><article className="gallery-card" key={item.id}><button onClick={e=>open(item,e.currentTarget)} aria-label={`${g.open}: ${item.title[locale]}`}><img src={item.image} alt={item.title[locale]} loading="lazy"/><span className="image-arrow"><ArrowUpRight/></span></button><div className="gallery-caption"><div><p>{g[item.room as 'living']}</p><h3>{item.title[locale]}</h3></div><span>{g[item.style as 'minimalism']}</span></div></article>)}</div>{items.length===0&&<div className="empty"><p>{g.empty}</p><button className="button outline" onClick={()=>{setRoom('all');setStyle('all')}}>{g.reset}</button></div>}<p className="small gallery-note">{c.home.galleryNote}</p><dialog ref={dialog} onCancel={()=>{setActive(null);opener.current?.focus()}} onClick={e=>{if(e.target===dialog.current)close()}}><div className="lightbox"><button className="dialog-close" onClick={close} aria-label={c.close}><X/></button>{active&&<><img src={active.image} alt={active.title[locale]}/><div><p className="eyebrow">{g[active.room as 'living']} / {g[active.style as 'minimalism']}</p><h2>{active.title[locale]}</h2><p>{g.manual}</p><div className="button-row"><a className="button" href={active.image} download={`briller-reference-${active.id}.jpg`}><Download size={17}/>{g.save}</a><a className="text-link" href={site.app}>{g.studio} ↗</a></div><p className="small">{c.home.galleryNote}</p></div></>}</div></dialog></>;}
export function Contact({locale}:{locale:Locale}){const c=copy(locale);const t=c.contact;const [draft,setDraft]=useState('');const [copied,setCopied]=useState(false);function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const d=new FormData(e.currentTarget);const topic=String(d.get('topic'));const text=`${topic}\n\n${d.get('message')}\n\n${d.get('name')}\n${d.get('email')}`;setDraft(text);setCopied(false);window.location.href=`mailto:${site.email}?subject=${encodeURIComponent('Briller — '+topic)}&body=${encodeURIComponent(text)}`;}return <div className="contact-layout"><aside><span className="brill-small"><Sparkles size={28}/></span><h2>{t.teamTitle}</h2><p>{t.teamText}</p><p>{t.direct}</p><a className="email" href={'mailto:'+site.email}>{site.email} ↗</a></aside><form onSubmit={submit}><div className="form-row"><label>{t.name}<input name="name" autoComplete="name" required maxLength={100}/></label><label>{t.email}<input name="email" type="email" autoComplete="email" required maxLength={200}/></label></div><label>{t.topic}<select name="topic">{t.topics.map(topic=><option key={topic}>{topic}</option>)}</select></label><label>{t.message}<textarea name="message" required minLength={10} maxLength={3000} rows={6}/></label><p className="small">{t.safe}</p><label className="checkbox"><input type="checkbox" required/><span>{t.consent} <a href={href(locale,'privacy')}>{c.legalNames.privacy} ↗</a></span></label><button className="button" type="submit">{t.submit}<ArrowUpRight size={17}/></button><p className="small">{t.note}</p>{draft&&<div className="mail-fallback" role="status"><p>{t.ready}</p><textarea readOnly aria-label={t.copy} value={draft} rows={6}/><button className="button outline" type="button" onClick={async()=>{try{await navigator.clipboard.writeText(draft);setCopied(true)}catch{setCopied(false)}}}>{copied?t.copied:t.copy}</button></div>}</form></div>;}
