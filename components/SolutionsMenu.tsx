'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronRight } from 'lucide-react';
import { copy, href, Locale } from '@/lib/content';
import type { SolutionMenuGroup } from '@/lib/solutions';

export function SolutionsMenu({ locale, page, groups, mobileOpen, onNavigate }: { locale: Locale; page: string; groups: SolutionMenuGroup[]; mobileOpen: boolean; onNavigate: () => void }) {
  const c = copy(locale).header;
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(() => groups.find(group => group.kind === 'project' && group.links.some(link => page === 'solutions/' + link.slug))?.id ?? groups[0].id);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | null>(null);
  const openedByHover = useRef(false);
  const active = page === 'solutions' || page.startsWith('solutions/');

  function cancelClose() { if (closeTimer.current !== null) { window.clearTimeout(closeTimer.current); closeTimer.current = null; } }
  function close(restoreFocus = false) { cancelClose(); openedByHover.current = false; setExpanded(false); if (restoreFocus) trigger.current?.focus(); }
  function navigate() { close(); onNavigate(); }
  function focusCategory(index: number) {
    const target = groups[(index + groups.length) % groups.length];
    setSelected(target.id);
    document.getElementById('solutions-category-' + target.id)?.focus();
  }
  function focusLinks(id: string) {
    window.requestAnimationFrame(() => document.getElementById('solutions-links-' + id)?.querySelector<HTMLAnchorElement>('a')?.focus());
  }
  useEffect(() => {
    if (!expanded) return;
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target)) close(); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [expanded]);
  useEffect(() => {
    if (!mobileOpen && window.matchMedia('(max-width:1100px)').matches) setExpanded(false);
  }, [mobileOpen]);
  useEffect(() => () => cancelClose(), []);
  return <div className="solutions-dropdown" ref={root}
    onPointerEnter={event => { if (event.pointerType === 'mouse' && window.matchMedia('(min-width:1101px) and (hover:hover)').matches) { cancelClose(); if (!expanded) openedByHover.current = true; setExpanded(true); } }}
    onPointerLeave={event => {
      if (event.pointerType !== 'mouse') return;
      cancelClose();
      closeTimer.current = window.setTimeout(() => { if (!root.current?.contains(document.activeElement)) setExpanded(false); }, 200);
    }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close(); }}
    onKeyDown={event => { if (event.key === 'Escape' && expanded) { event.preventDefault(); event.stopPropagation(); close(true); } }}>
    <button ref={trigger} type="button" className="solutions-trigger" aria-current={active ? 'true' : undefined} aria-expanded={expanded} aria-controls="solutions-navigation"
      onClick={() => { cancelClose(); if (openedByHover.current) { openedByHover.current = false; setExpanded(true); } else setExpanded(value => !value); }}
      onKeyDown={event => {
        if (event.key === 'ArrowDown') { event.preventDefault(); const id = selected || groups[0].id; setSelected(id); setExpanded(true); window.requestAnimationFrame(() => document.getElementById('solutions-category-' + id)?.focus()); }
      }}>{c.solutions}<ChevronDown size={15} aria-hidden="true"/></button>
    <div className="solution-menu-panel" id="solutions-navigation" hidden={!expanded}>
      <div className="solution-menu-body">
        {(['audience','project'] as const).map(kind => <div className="solution-menu-kind" key={kind}>
          <p className="solution-menu-label">{kind === 'audience' ? c.byAudience : c.byProject}</p>
          {groups.filter(group => group.kind === kind).map(group => <div className="solution-menu-group" key={group.id}>
            <button id={'solutions-category-' + group.id} type="button" className="solution-menu-category" aria-expanded={selected === group.id} aria-controls={'solutions-links-' + group.id}
              onPointerEnter={event => { if (event.pointerType === 'mouse' && window.matchMedia('(min-width:1101px) and (hover:hover)').matches) setSelected(group.id); }}
              onFocus={() => { if (window.matchMedia('(min-width:1101px)').matches) setSelected(group.id); }}
              onClick={() => setSelected(value => window.matchMedia('(max-width:1100px)').matches && value === group.id ? '' : group.id)}
              onKeyDown={event => {
                const index = groups.findIndex(item => item.id === group.id);
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); focusCategory(index + (event.key === 'ArrowDown' ? 1 : -1)); }
                if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); focusCategory(event.key === 'Home' ? 0 : groups.length - 1); }
                if (event.key === 'ArrowRight') { event.preventDefault(); focusLinks(group.id); }
              }}><span>{group.label}</span><ChevronRight size={16} aria-hidden="true"/></button>
            <div className="solution-menu-links" id={'solutions-links-' + group.id} hidden={selected !== group.id} aria-labelledby={'solutions-category-' + group.id}
              onKeyDown={event => { if (event.key === 'ArrowLeft') { event.preventDefault(); document.getElementById('solutions-category-' + group.id)?.focus(); } }}>
              <div className="solution-menu-group-heading"><strong>{group.label}</strong><a href={group.href} onClick={navigate}>{c.viewCategory}<ArrowUpRight size={15} aria-hidden="true"/></a></div>
              <ul>{group.links.map(link => <li key={link.slug}><a href={link.href} aria-current={page === 'solutions/' + link.slug ? 'page' : undefined} onClick={navigate}>{link.label}<ArrowUpRight size={15} aria-hidden="true"/></a></li>)}</ul>
            </div>
          </div>)}
        </div>)}
      </div>
      <a className="solution-menu-all" href={href(locale,'solutions')} onClick={navigate}>{c.allSolutions}<ArrowUpRight size={18} aria-hidden="true"/></a>
    </div>
  </div>;
}
