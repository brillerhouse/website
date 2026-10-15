'use client';

import { useRef, useState, type PointerEvent } from 'react';
import { ArrowLeftRight, Sparkles } from 'lucide-react';

type Props = {
  image: string;
  width: number;
  height: number;
  focusY: number;
  alt: string;
  before: string;
  after: string;
  label: string;
  descriptionId: string;
  sparks: { id: string; title: string; position: { x: number; y: number } }[];
  selectedSpark: string;
  sparkLabel: string;
  onSelectSpark: (id: string) => void;
};

export function SolutionComparison({ image, width, height, focusY, alt, before, after, label, descriptionId, sparks, selectedSpark, sparkLabel, onSelectSpark }: Props) {
  const [position, setPosition] = useState(50);
  const dragging = useRef(false);
  const slider = useRef<HTMLInputElement>(null);
  // Cover one landscape frame with each source half, using the same crop in both views.
  const scale = Math.max(1, width / (2 * height) / (16 / 9));
  const left = -(scale - 1) * 50;
  const photoStyle = { width: `${200 * scale}%`, top: `${focusY}%`, transform: `translateY(-${focusY}%)` };

  function update(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition(Math.max(0, Math.min(100, Math.round((event.clientX - rect.left) / rect.width * 100))));
  }

  return <div className="solution-example-image">
    <div className="solution-comparison-labels" aria-hidden="true"><span>{before}</span><span>{after}</span></div>
    <div className="hero-room-frame solution-comparison"
      onPointerDown={event => { if ((event.target as Element).closest('.spark-hotspot') || !event.isPrimary || event.button !== 0) return; event.preventDefault(); slider.current?.focus({ preventScroll: true }); dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); update(event); }}
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
      <input ref={slider} className="hero-room-range" type="range" min={0} max={100} value={position} aria-label={label} aria-describedby={descriptionId}
        aria-valuetext={`${before}: ${position}%. ${after}: ${100 - position}%.`}
        onChange={event => setPosition(Number(event.target.value))}/>
      <div className="solution-comparison-sparks" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
      {sparks.filter(spark => spark.position.x > position).map(spark => <button key={spark.id} type="button"
        className={'spark-hotspot solution-spark-hotspot' + (selectedSpark === spark.id ? ' selected' : '')}
        style={{ left: `clamp(22px, ${spark.position.x}%, calc(100% - 22px))`, top: `clamp(22px, ${spark.position.y}%, calc(100% - 22px))` }}
        aria-label={`${sparkLabel} ${spark.title}`} aria-pressed={selectedSpark === spark.id}
        aria-controls={`solution-advice-${spark.id}`} title={spark.title}
        onClick={() => onSelectSpark(spark.id)}>
        <span><Sparkles size={17} strokeWidth={1.7} aria-hidden="true"/></span>
      </button>)}
      </div>
    </div>
  </div>;
}
