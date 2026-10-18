'use client';

import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { ArrowLeftRight, ArrowUpRight, Sparkles, X } from 'lucide-react';

type Props = {
  image: string;
  width: number;
  height: number;
  focusY: number;
  alt: string;
  before: string;
  after: string;
  label: string;
  sparks: { id: string; title: string; specification: string; position: { x: number; y: number } }[];
  budgetLabel: string;
  selectedSpark: string;
  sparkLabel: string;
  onSelectSpark: (id: string) => void;
  readAdvice: string;
  closeSpark: string;
  onReadAdvice: (id: string) => void;
};

export function SolutionComparison({ image, width, height, focusY, alt, before, after, label, sparks, budgetLabel, selectedSpark, sparkLabel, onSelectSpark, readAdvice, closeSpark, onReadAdvice }: Props) {
  const [position, setPosition] = useState(50);
  const [openSpark, setOpenSpark] = useState<string | null>(null);
  const [bubblePosition, setBubblePosition] = useState({ left: 8, top: 8 });
  const frame = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const detail = sparks.find(spark => spark.id === openSpark && spark.id === selectedSpark && spark.position.x > position);
  const dragging = useRef(false);
  const slider = useRef<HTMLInputElement>(null);
  // Cover one landscape frame with each source half, using the same crop in both views.
  const scale = Math.max(1, width / (2 * height) / (16 / 9));
  const left = -(scale - 1) * 50;
  const photoStyle = { width: `${200 * scale}%`, top: `${focusY}%`, transform: `translateY(-${focusY}%)` };

  useLayoutEffect(() => {
    if (!detail || !frame.current || !bubble.current) return;
    const container = frame.current;
    const panel = bubble.current;
    function placeBubble() {
      const w = container.clientWidth, h = container.clientHeight;
      const x = Math.max(22, Math.min(w - 22, w * detail!.position.x / 100));
      const y = Math.max(22, Math.min(h - 22, h * detail!.position.y / 100));
      const pw = panel.offsetWidth, ph = panel.offsetHeight;
      const left = x + 26 + pw <= w - 8 ? x + 26 : x - 26 - pw;
      const top = y + 18 + ph <= h - 8 ? y + 18 : y - ph - 18;
      setBubblePosition({ left: Math.max(8, Math.min(w - pw - 8, left)), top: Math.max(8, Math.min(h - ph - 8, top)) });
    }
    placeBubble();
    const observer = new ResizeObserver(placeBubble);
    observer.observe(container);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [detail]);

  function closeBubble() {
    setOpenSpark(null);
    frame.current?.querySelector<HTMLButtonElement>(`.solution-spark-hotspot[aria-controls="solution-advice-${openSpark}"]`)?.focus({ preventScroll: true });
  }

  function update(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition(Math.max(0, Math.min(100, Math.round((event.clientX - rect.left) / rect.width * 100))));
  }

  return <div className="solution-example-image">
    <div className="solution-comparison-labels" aria-hidden="true"><span>{before}</span><span>{after}</span></div>
    <div ref={frame} className="hero-room-frame solution-comparison"
      onKeyDown={event => { if (event.key === 'Escape' && detail) { event.preventDefault(); closeBubble(); } }}
      onPointerDown={event => { if ((event.target as Element).closest('.spark-hotspot, .solution-spark-popover') || !event.isPrimary || event.button !== 0) return; setOpenSpark(null); event.preventDefault(); slider.current?.focus({ preventScroll: true }); dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); update(event); }}
      onPointerMove={event => { if (dragging.current && event.isPrimary) { event.preventDefault(); update(event); } }}
      onPointerUp={event => { if (dragging.current && event.isPrimary) update(event); dragging.current = false; }}
      onPointerCancel={() => { dragging.current = false; }}
      onLostPointerCapture={() => { dragging.current = false; }}>
      <img className="solution-comparison-photo solution-comparison-before" style={{ ...photoStyle, left: `${left}%` }} src={image} alt={alt} width={width} height={height} loading="lazy" decoding="async" draggable={false}/>
      <div className="solution-comparison-after" style={{ clipPath: `inset(0 0 0 ${position}%)` }} aria-hidden="true">
        <img className="solution-comparison-photo" style={{ ...photoStyle, left: `${left - 100 * scale}%` }} src={image} alt="" width={width} height={height} loading="lazy" decoding="async" draggable={false}/>
      </div>
      <span className="hero-room-label hero-room-label-before" aria-hidden="true">{before}</span>
      <span className="hero-room-label hero-room-label-after" aria-hidden="true">{after}</span>
      <div className="hero-room-divider" style={{ left: `${position}%` }} aria-hidden="true"><span><ArrowLeftRight size={21} strokeWidth={1.8}/></span></div>
      <input ref={slider} className="hero-room-range" type="range" min={0} max={100} value={position} aria-label={label}
        aria-valuetext={`${before}: ${position}%. ${after}: ${100 - position}%.`}
        onChange={event => { setOpenSpark(null); setPosition(Number(event.target.value)); }}/>
      <div className="solution-comparison-sparks" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
      {sparks.filter(spark => spark.position.x > position).map(spark => <button key={spark.id} type="button"
        className={'spark-hotspot solution-spark-hotspot' + (selectedSpark === spark.id ? ' selected' : '')}
        style={{ left: `clamp(22px, ${spark.position.x}%, calc(100% - 22px))`, top: `clamp(22px, ${spark.position.y}%, calc(100% - 22px))` }}
        aria-label={`${sparkLabel} ${spark.title}`} aria-pressed={selectedSpark === spark.id}
        aria-expanded={detail?.id === spark.id}
        aria-controls={`solution-advice-${spark.id}`} title={spark.title}
        onClick={() => { setOpenSpark(detail?.id === spark.id ? null : spark.id); onSelectSpark(spark.id); }}>
        <span><Sparkles size={17} strokeWidth={1.7} aria-hidden="true"/></span>
      </button>)}
      </div>
      {detail && <div ref={bubble} className="solution-spark-popover" style={bubblePosition} role="group" aria-labelledby="solution-spark-title">
        <button type="button" className="solution-spark-close" aria-label={closeSpark} onClick={closeBubble}><X size={16} aria-hidden="true"/></button>
        <p id="solution-spark-title">{detail.title}</p>
        <div className="solution-spark-specification" aria-live="polite" aria-atomic="true"><span>{budgetLabel}</span><p>{detail.specification}</p></div>
        <a className="text-link" href={`#solution-advice-${detail.id}`} onClick={() => { onReadAdvice(detail.id); setOpenSpark(null); }}>{readAdvice}<ArrowUpRight size={15} aria-hidden="true"/></a>
      </div>}
    </div>
  </div>;
}
