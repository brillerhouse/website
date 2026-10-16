'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Copy, Download, X } from 'lucide-react';
import { copy, site, type Locale } from '@/lib/content';
import { galleryConcepts, galleryReferences, galleryRooms, galleryStyles, galleryPrompt, galleryTileStyle, type GalleryItem } from '@/lib/gallery';

function GalleryImage({ item, locale }: { item: GalleryItem; locale: Locale }) {
  return item.tile === undefined
    ? <img className="gallery-reference-image" src={item.image} alt={item.title[locale]} loading="lazy"/>
    : <span className="gallery-image-tile" role="img" aria-label={item.title[locale]} style={{ backgroundImage: `url("${item.image}")`, ...galleryTileStyle(item.crop!) }}/>;
}
export function Gallery({ locale, preview = false }: { locale: Locale; preview?: boolean }) {
  const c = copy(locale), g = c.gallery;
  const [room, setRoom] = useState('all');
  const [style, setStyle] = useState('all');
  const [limit, setLimit] = useState(21);
  const [active, setActive] = useState<GalleryItem | null>(null);
  const [copied, setCopied] = useState('');
  const [copyFailed, setCopyFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const prompt = useRef<HTMLTextAreaElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const matches = (item: GalleryItem) => (room === 'all' || item.room === room) && (style === 'all' || item.style === style);
  const concepts = galleryConcepts.filter(matches);
  const references = preview ? galleryReferences.slice(0, 3) : galleryReferences.filter(matches);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(''), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);
  useEffect(() => { if (active && !dialog.current?.open) dialog.current?.showModal(); }, [active]);
  function open(item: GalleryItem, button: HTMLButtonElement) {
    opener.current = button;
    setCopyFailed(false);
    setActive(item);
  }
  function close() { dialog.current?.close(); }
  function closed() {
    setActive(null);
    setCopyFailed(false);
    opener.current?.focus({ preventScroll: true });
  }
  async function copyPrompt(item: GalleryItem, button: HTMLButtonElement) {
    try {
      await navigator.clipboard.writeText(galleryPrompt(item, locale));
      setCopied(item.id);
      setCopyFailed(false);
    } catch {
      if (!active) open(item, button);
      setCopyFailed(true);
      window.requestAnimationFrame(() => { prompt.current?.focus(); prompt.current?.select(); });
    }
  }
  function cards(items: GalleryItem[]) {
    return <div className="gallery-grid inspiration-grid">{items.map(item => <article className="gallery-card inspiration-card" key={item.id} data-gallery-id={item.id}>
      <button className="gallery-image-button" type="button" onClick={event => open(item, event.currentTarget)} aria-label={`${g.open}: ${item.title[locale]}`}>
        <GalleryImage item={item} locale={locale}/><span className="image-arrow"><ArrowUpRight/></span>
      </button>
      <div className="gallery-caption"><div><p>{galleryRooms.find(room => room.id === item.room)?.label[locale]}</p><h3>{item.title[locale]}</h3></div></div>
      <button className="gallery-copy-button" type="button" onClick={event => copyPrompt(item, event.currentTarget)} aria-label={`${g.copyPrompt}: ${item.title[locale]}`}>
        {copied === item.id ? <Check size={16}/> : <Copy size={16}/>}<span>{copied === item.id ? g.copied : g.copyPrompt}</span>
      </button>
    </article>)}</div>;
  }
  return <div className={'inspiration-gallery' + (preview ? ' gallery-preview' : '')}>
    {!preview && <>
      <div className="gallery-controls inspiration-controls">
        <div className="filter-chips" role="group" aria-label={g.roomFilter}>
          {[{ id: 'all', label: { en: g.allRooms, uk: g.allRooms } }, ...galleryRooms].map(option => <button type="button" key={option.id} aria-pressed={room === option.id} className={room === option.id ? 'active' : ''} onClick={() => { setRoom(option.id); setLimit(21); }}>{option.label[locale]}</button>)}
        </div>
        <label className="style-select">{g.styleFilter}<select value={style} onChange={event => { setStyle(event.target.value); setLimit(21); }}>
          <option value="all">{g.allStyles}</option>{galleryStyles.map(option => <option key={option.id} value={option.id}>{option.label[locale]}</option>)}
        </select></label>
      </div>
      <div className="gallery-results-bar"><p role="status" aria-live="polite">{concepts.length} {g.count}</p>{(room !== 'all' || style !== 'all') && <button className="text-link" type="button" onClick={() => { setRoom('all'); setStyle('all'); setLimit(21); }}>{g.reset}</button>}</div>
      {cards(concepts.slice(0, limit))}
      {limit < concepts.length && <div className="gallery-load-more"><button className="button outline" type="button" onClick={() => setLimit(limit + 21)}>{g.more} <span>({concepts.length - limit})</span></button></div>}
    </>}
    {references.length > 0 && <section className="gallery-originals">{!preview && <div className="gallery-reference-heading"><h2>{g.references}</h2><p>{g.referenceIntro}</p></div>}{cards(references)}</section>}
    <p className="small gallery-note">{preview ? c.home.galleryNote : g.generatedNote}</p>
    <span className="sr-only" role="status" aria-live="polite">{copied ? g.copied : ''}</span>
    <dialog ref={dialog} className="inspiration-dialog" onClose={closed} onClick={event => { if (event.target === dialog.current) close(); }} aria-labelledby={`gallery-title-${preview ? 'preview' : 'full'}`}>
      {active && <div className="inspiration-lightbox">
        <button className="dialog-close" type="button" onClick={close} aria-label={g.close}><X/></button>
        <div className="inspiration-lightbox-image"><GalleryImage item={active} locale={locale}/></div>
        <div className="inspiration-lightbox-copy">
          <p className="eyebrow">{galleryRooms.find(room => room.id === active.room)?.label[locale]}</p>
          <h2 id={`gallery-title-${preview ? 'preview' : 'full'}`}>{active.title[locale]}</h2>
          <label className="gallery-prompt-label" htmlFor={`gallery-prompt-${preview ? 'preview' : 'full'}`}>{g.promptLabel}</label>
          <textarea ref={prompt} id={`gallery-prompt-${preview ? 'preview' : 'full'}`} className="gallery-prompt" readOnly value={galleryPrompt(active, locale)} rows={9}/>
          {copyFailed && <p className="gallery-copy-error" role="status">{g.copyFailed}</p>}
          <div className="button-row"><button type="button" className="button" onClick={event => copyPrompt(active, event.currentTarget)}>{copied === active.id ? <Check size={17}/> : <Copy size={17}/>} {copied === active.id ? g.copied : g.copyPrompt}</button><a className="text-link" href={site.app}>{g.studio}<ArrowUpRight size={17}/></a></div>
          <p className="small">{g.promptHelp}</p>
          {active.tile === undefined && <><a className="gallery-download text-link" href={active.image} download={`briller-reference-${active.id}.jpg`}><Download size={16}/>{g.save}</a><p className="small">{g.manual}</p></>}
          <p className="small">{active.tile === undefined ? c.home.galleryNote : g.generatedNote}</p>
        </div>
      </div>}
    </dialog>
  </div>;
}
