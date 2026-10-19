'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, Check, Copy, Download, X } from 'lucide-react';
import { GalleryCategoryIcon } from './GalleryCategoryIcon';
import { copy, site, type Locale } from '@/lib/content';
import { galleryConcepts, galleryReferences, galleryRooms, galleryStyles, galleryTiers, gallerySizes, galleryHighlights, galleryVersions, galleryPrompt, type GalleryItem } from '@/lib/gallery';

function GalleryImage({ item, locale }: { item: GalleryItem; locale: Locale }) {
  if (item.detailImage || item.tile === undefined) return <img className="gallery-reference-image" src={item.detailImage || item.image} alt={item.title[locale]} loading="lazy"/>;
  const crop = item.crop;
  if (!crop) return null;
  return <svg className="gallery-image-tile" role="img" aria-label={item.title[locale]} viewBox={`${crop.x * 1024} ${crop.y * 1536} ${crop.width * 1024} ${crop.height * 1536}`} preserveAspectRatio="xMidYMid slice"><image href={item.image} width="1024" height="1536"/></svg>;
}
export function Gallery({ locale, preview = false, children }: { locale: Locale; preview?: boolean; children?: ReactNode }) {
  const c = copy(locale), g = c.gallery;
  const [room, setRoom] = useState('all');
  const [style, setStyle] = useState('all');
  const [tier, setTier] = useState('all');
  const [size, setSize] = useState('all');
  const [limit, setLimit] = useState(24);
  const [active, setActive] = useState<GalleryItem | null>(null);
  const [copied, setCopied] = useState('');
  const [copyFailed, setCopyFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const prompt = useRef<HTMLTextAreaElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const unfiltered = room === 'all' && style === 'all' && tier === 'all' && size === 'all';
  const matches = (item: GalleryItem) => (room === 'all' || item.room === room) && (style === 'all' || item.style === style) && (tier === 'all' || item.tier === tier) && (size === 'all' || item.size === size);
  const concepts = galleryConcepts.filter(matches);
  const highlights = !preview && unfiltered ? galleryHighlights : [];
  const gridItems = concepts.filter(item => !highlights.some(highlight => highlight.id === item.id));
  const references = preview ? galleryReferences.slice(0, 3) : galleryReferences.filter(matches);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(''), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);
  useEffect(() => { if (active && !dialog.current?.open) dialog.current?.showModal(); }, [active]);
  function open(item: GalleryItem, button: HTMLButtonElement) { opener.current = button; setCopyFailed(false); setActive(item); }
  function close() { dialog.current?.close(); }
  function closed() { setActive(null); setCopyFailed(false); opener.current?.focus({ preventScroll: true }); }
  function reset() { setRoom('all'); setStyle('all'); setTier('all'); setSize('all'); setLimit(24); }
  async function copyPrompt(item: GalleryItem, button: HTMLButtonElement) {
    try { await navigator.clipboard.writeText(galleryPrompt(item, locale)); setCopied(item.id); setCopyFailed(false); }
    catch { if (!active) open(item, button); setCopyFailed(true); window.requestAnimationFrame(() => { prompt.current?.focus(); prompt.current?.select(); }); }
  }
  const meta = (item: GalleryItem) => [galleryTiers.find(t => t.id === item.tier)?.label[locale], gallerySizes.find(s => s.id === item.size)?.label[locale]].filter(Boolean).join(' · ');
  function cards(items: GalleryItem[], featured = false) {
    return <div className={featured ? 'gallery-curation-grid' : 'gallery-grid inspiration-grid'}>{items.map(item => <article className={'gallery-card inspiration-card' + (featured ? ' gallery-featured-card' : '')} key={item.id} data-gallery-id={item.id}>
      <button className="gallery-image-button" type="button" onClick={event => open(item, event.currentTarget)} aria-label={`${g.open}: ${item.title[locale]}${item.tier ? ' · ' + meta(item) : ''}`}>
        <GalleryImage item={item} locale={locale}/><span className="image-arrow"><ArrowUpRight/></span>
        {featured && <span className="gallery-featured-caption"><span>{meta(item)}</span><strong>{item.title[locale]}</strong></span>}
      </button>
      {!featured && <><div className="gallery-caption"><div><p>{item.tier ? meta(item) : galleryRooms.find(room => room.id === item.room)?.label[locale]}</p><h3><GalleryCategoryIcon category="rooms" id={item.room} size={24}/><span>{item.title[locale]}</span></h3></div></div>
      <button className="gallery-copy-button" type="button" onClick={event => copyPrompt(item, event.currentTarget)} aria-label={`${g.copyPrompt}: ${item.title[locale]}${item.tier ? ' · ' + meta(item) : ''}`}>{copied === item.id ? <Check size={16}/> : <Copy size={16}/>}<span>{copied === item.id ? g.copied : g.copyPrompt}</span><ArrowUpRight size={15}/></button></>}
    </article>)}</div>;
  }
  return <div className={'inspiration-gallery' + (preview ? ' gallery-preview' : ' gallery-library')}>
    {highlights.length > 0 && <section className="gallery-curation" aria-label={g.featured}><div className="gallery-curation-heading"><p className="eyebrow">{g.featured}</p><p>{g.featuredIntro}</p></div>{cards(highlights, true)}</section>}
    {!preview && children}
    {!preview && <>
      <div className="gallery-library-heading" id="design-library"><div><p className="eyebrow">{g.collectionLabel}</p><h2>{g.collectionTitle}</h2></div><p>{g.variantIntro}</p></div>
      <div className="gallery-controls inspiration-controls gallery-library-controls">
        <div className="filter-chips" role="group" aria-label={g.roomFilter}>{[{ id: 'all', label: { en: g.allRooms, uk: g.allRooms } }, ...galleryRooms].map(option => <button type="button" key={option.id} aria-pressed={room === option.id} className={room === option.id ? 'active' : ''} onClick={() => { setRoom(option.id); setLimit(24); }}>{option.id !== 'all' && <GalleryCategoryIcon category="rooms" id={option.id} size={22}/>}<span>{option.label[locale]}</span></button>)}</div>
        <div className="gallery-selects"><label><span className="gallery-filter-label"><GalleryCategoryIcon category="styles" id={style === 'all' ? 'contemporary' : style} size={22}/>{g.styleFilter}</span><select id="gallery-style-filter" name="gallery-style" value={style} onChange={event => { setStyle(event.target.value); setLimit(24); }}><option value="all">{g.allStyles}</option>{galleryStyles.map(option => <option key={option.id} value={option.id}>{option.label[locale]}</option>)}</select></label>
          <label><span className="gallery-filter-label"><GalleryCategoryIcon category="budgets" id={tier === 'all' ? 'budget' : tier} size={22}/>{g.budgetFilter}</span><select name="gallery-budget" value={tier} onChange={event => { setTier(event.target.value); setLimit(24); }}><option value="all">{g.allBudgets}</option>{galleryTiers.map(option => <option key={option.id} value={option.id}>{option.label[locale]}</option>)}</select></label>
          <label><span className="gallery-filter-label"><GalleryCategoryIcon category="sizes" id={size === 'all' ? 'medium' : size} size={22}/>{g.sizeFilter}</span><select name="gallery-size" value={size} onChange={event => { setSize(event.target.value); setLimit(24); }}><option value="all">{g.allSizes}</option>{gallerySizes.map(option => <option key={option.id} value={option.id}>{option.label[locale]}</option>)}</select></label></div>
      </div>
      <div className="gallery-results-bar"><p role="status" aria-live="polite">{unfiltered ? g.browseAll : `${concepts.length} ${g.count}`}</p>{!unfiltered && <button className="text-link" type="button" onClick={reset}>{g.reset}</button>}</div>
      {cards(gridItems.slice(0, limit))}
      {concepts.length === 0 && <div className="empty"><p>{g.variantEmpty}</p><button className="button outline" type="button" onClick={reset}>{g.reset}</button></div>}
      {limit < gridItems.length && <div className="gallery-load-more"><button className="button outline" type="button" onClick={() => setLimit(limit + 24)}>{g.more} <span>({gridItems.length - limit})</span></button></div>}
    </>}
    {references.length > 0 && <section className="gallery-originals">{!preview && <div className="gallery-reference-heading"><h2>{g.references}</h2><p>{g.referenceIntro}</p></div>}{cards(references)}</section>}
    <p className="small gallery-note">{preview ? c.home.galleryNote : g.generatedNote}</p><span className="sr-only" role="status" aria-live="polite">{copied ? g.copied : ''}</span>
    <dialog ref={dialog} className="inspiration-dialog" onClose={closed} onClick={event => { if (event.target === dialog.current) close(); }} aria-labelledby={`gallery-title-${preview ? 'preview' : 'full'}`}>
      {active && <div className="inspiration-lightbox"><button className="dialog-close" type="button" onClick={close} aria-label={g.close}><X/></button><div className="inspiration-lightbox-image"><GalleryImage item={active} locale={locale}/></div>
        <div className="inspiration-lightbox-copy"><p className="eyebrow">{active.tier ? meta(active) : galleryRooms.find(room => room.id === active.room)?.label[locale]}</p><h2 id={`gallery-title-${preview ? 'preview' : 'full'}`}>{active.title[locale]}</h2>
          {active.tier && <fieldset className="gallery-version-selector"><legend>{g.compareVersions}</legend>{galleryVersions(active).map(version => <button key={version.id} type="button" aria-pressed={active.id === version.id} className={active.id === version.id ? 'selected' : ''} onClick={() => { setActive(version); setCopyFailed(false); }}><strong><GalleryCategoryIcon category="budgets" id={version.tier!} size={22}/>{galleryTiers.find(t => t.id === version.tier)?.label[locale]}</strong><span>{gallerySizes.find(s => s.id === version.size)?.label[locale]}</span></button>)}</fieldset>}
          <label className="gallery-prompt-label" htmlFor={`gallery-prompt-${preview ? 'preview' : 'full'}`}>{g.promptLabel}</label><textarea ref={prompt} id={`gallery-prompt-${preview ? 'preview' : 'full'}`} className="gallery-prompt" readOnly value={galleryPrompt(active, locale)} rows={8}/>
          {copyFailed && <p className="gallery-copy-error" role="status">{g.copyFailed}</p>}<div className="button-row"><button type="button" className="button" onClick={event => copyPrompt(active, event.currentTarget)}>{copied === active.id ? <Check size={17}/> : <Copy size={17}/>} {copied === active.id ? g.copied : g.copyPrompt}</button><a className="text-link" href={site.app}>{g.studio}<ArrowUpRight size={17}/></a></div><p className="small">{g.promptHelp}</p>
          {active.tile === undefined && <><a className="gallery-download text-link" href={active.image} download={`briller-reference-${active.id}.jpg`}><Download size={16}/>{g.save}</a><p className="small">{g.manual}</p></>}<p className="small">{active.tile === undefined ? c.home.galleryNote : g.generatedNote}</p>
        </div></div>}
    </dialog>
  </div>;
}
