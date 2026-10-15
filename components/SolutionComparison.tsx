'use client';

import { useRef, useState, type PointerEvent } from 'react';
import { ArrowLeftRight } from 'lucide-react';

type Props = {
  image: string;
  width: number;
  height: number;
  alt: string;
  before: string;
  after: string;
  label: string;
  descriptionId: string;
};

export function SolutionComparison({ image, width, height, alt, before, after, label, descriptionId }: Props) {
  const [position, setPosition] = useState(50);
  const dragging = useRef(false);
  const slider = useRef<HTMLInputElement>(null);

  function update(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition(Math.max(0, Math.min(100, Math.round((event.clientX - rect.left) / rect.width * 100))));
  }

  return <div className="solution-example-image">
    <div className="hero-room-frame solution-comparison" style={{ aspectRatio: `${width / 2} / ${height}`, maxWidth: Math.min(960, width / 2 / height * 560) }}
      onPointerDown={event => { if (!event.isPrimary || event.button !== 0) return; event.preventDefault(); slider.current?.focus({ preventScroll: true }); dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); update(event); }}
      onPointerMove={event => { if (dragging.current && event.isPrimary) { event.preventDefault(); update(event); } }}
      onPointerUp={event => { if (dragging.current && event.isPrimary) update(event); dragging.current = false; }}
      onPointerCancel={() => { dragging.current = false; }}
      onLostPointerCapture={() => { dragging.current = false; }}>
      <img className="solution-comparison-photo solution-comparison-before" src={image} alt={alt} width={width} height={height} loading="lazy" decoding="async" draggable={false}/>
      <div className="solution-comparison-after" style={{ clipPath: `inset(0 0 0 ${position}%)` }} aria-hidden="true">
        <img className="solution-comparison-photo" src={image} alt="" width={width} height={height} loading="lazy" decoding="async" draggable={false}/>
      </div>
      <span className="hero-room-label hero-room-label-before" aria-hidden="true">{before}</span>
      <span className="hero-room-label hero-room-label-after" aria-hidden="true">{after}</span>
      <div className="hero-room-divider" style={{ left: `${position}%` }} aria-hidden="true"><span><ArrowLeftRight size={21} strokeWidth={1.8}/></span></div>
      <input ref={slider} className="hero-room-range" type="range" min={0} max={100} value={position} aria-label={label} aria-describedby={descriptionId}
        aria-valuetext={`${before}: ${position}%. ${after}: ${100 - position}%.`}
        onChange={event => setPosition(Number(event.target.value))}/>
    </div>
  </div>;
}
