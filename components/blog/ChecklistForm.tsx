'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Download } from 'lucide-react';
import type { Locale } from '@/lib/content';
import { blogCopy, downloadPath as resourceDownload, checklistPreview } from '@/lib/blog/shared';
import delivery from '@/content/blog/delivery.json';

const endpoint = process.env.NEXT_PUBLIC_BLOG_LEAD_ENDPOINT || delivery.endpoint || '/api/blog-leads/';
export function ChecklistForm({ locale = 'en', postSlug, inline = false }: { locale?: Locale; postSlug: string; inline?: boolean }) {
  const t = blogCopy(locale), downloadPath = resourceDownload(locale);
  const [status, setStatus] = useState<'idle' | 'sending' | 'ready' | 'error'>('idle');
  const [emailed, setEmailed] = useState(false);
  const result = useRef<HTMLDivElement>(null), startedAt = useRef(0);
  useEffect(() => { startedAt.current = Date.now(); }, []);
  useEffect(() => { if (status === 'ready') result.current?.focus(); }, [status]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (status === 'sending') return;
    const form = event.currentTarget, fields = new FormData(form);
    setStatus('sending');
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', credentials: 'omit', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: String(fields.get('name')).trim(), email: String(fields.get('email')).trim(), consent: fields.get('consent') === 'on', website: String(fields.get('website') || ''), startedAt: startedAt.current, requestId: crypto.randomUUID(), resource: 'builder-checklist', source: postSlug, locale })
      });
      if (!response.ok) throw new Error('Request failed');
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || !('downloadUrl' in data) || data.downloadUrl !== downloadPath || !('emailSent' in data) || typeof data.emailSent !== 'boolean') throw new Error('Unexpected response');
      setEmailed(data.emailSent); setStatus('ready'); form.reset();
    } catch { setStatus('error'); }
    finally { clearTimeout(timeout); }
  }
  return <section className={'blog-download' + (inline ? ' blog-download-inline' : '')} id="download-checklist" aria-label={t.resourceLabel}>
    <div className="blog-download-intro"><p className="eyebrow">{t.downloadEyebrow}</p>{!inline && <><h2>{t.downloadHeading}</h2><p>{t.downloadIntro}</p></>}<img src={checklistPreview(locale)} width={locale === 'uk' ? 794 : 773} height={locale === 'uk' ? 1123 : 1000} alt={t.previewAlt} loading="lazy"/></div>
    <div className="blog-download-form">
      {status === 'ready' ? <div className="blog-download-ready" ref={result} tabIndex={-1} role="status"><Check size={28} aria-hidden="true"/><h3>{t.ready}</h3><p>{emailed ? t.emailed : t.emailFailed}</p><a className="button" href={downloadPath} download><Download size={18} aria-hidden="true"/>{t.download}</a><p className="small">{t.format}</p></div>
      : <form onSubmit={submit} aria-label={t.formLabel} aria-busy={status === 'sending'}>
        <h3>{t.formTitle}</h3><p>{t.formIntro}</p>
        <label htmlFor="checklist-name">{t.name}<input id="checklist-name" name="name" autoComplete="name" required minLength={2} maxLength={120}/></label>
        <label htmlFor="checklist-email">{t.email}<input id="checklist-email" name="email" type="email" autoComplete="email" required maxLength={254}/></label>
        <div className="blog-honeypot" aria-hidden="true"><label>{t.honeypot}<input name="website" type="text" tabIndex={-1} autoComplete="off"/></label></div>
        <label className="checkbox"><input name="consent" type="checkbox" required/><span>{t.consent} <a href={`/${locale}/privacy/`}>{t.privacy}</a>.</span></label>
        <p className="small">{t.dataUse}</p>
        <button className="button" type="submit" disabled={status === 'sending'}>{status === 'sending' ? t.sending : t.submit}<ArrowUpRight size={17} aria-hidden="true"/></button>
        {status === 'error' && <p className="blog-form-error" role="alert">{t.error} <a href={'mailto:hello@briller.house?subject=' + encodeURIComponent(t.mailSubject)}>{t.errorLink}</a>.</p>}
      </form>}
    </div>
  </section>;
}
