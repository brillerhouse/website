'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Download } from 'lucide-react';

const downloadPath = '/downloads/briller-builder-checklist-letter.pdf';
const endpoint = process.env.NEXT_PUBLIC_BLOG_LEAD_ENDPOINT || '/api/blog-leads/';
export function ChecklistForm({ postSlug, inline = false }: { postSlug: string; inline?: boolean }) {
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
        body: JSON.stringify({ name: String(fields.get('name')).trim(), email: String(fields.get('email')).trim(), consent: fields.get('consent') === 'on', website: String(fields.get('website') || ''), startedAt: startedAt.current, requestId: crypto.randomUUID(), resource: 'builder-checklist', source: postSlug })
      });
      if (!response.ok) throw new Error('Request failed');
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || !('downloadUrl' in data) || data.downloadUrl !== downloadPath || !('emailSent' in data) || typeof data.emailSent !== 'boolean') throw new Error('Unexpected response');
      setEmailed(data.emailSent); setStatus('ready'); form.reset();
    } catch { setStatus('error'); }
    finally { clearTimeout(timeout); }
  }
  return <section className={'blog-download' + (inline ? ' blog-download-inline' : '')} id="download-checklist" aria-label="Free builder checklist download">
    <div className="blog-download-intro"><p className="eyebrow">FREE DOWNLOAD / ONE-PAGE PDF</p>{!inline && <><h2>Take the right questions to your builder.</h2><p>The AI render review checklist covers geometry, structure, services, ceiling height and project scope, with space to record decisions and responsibilities.</p></>}<img src="/images/blog/builder-checklist-preview.webp" width={773} height={1000} alt="Preview of the one-page builder checklist, with confirmation columns and room for notes." loading="lazy"/></div>
    <div className="blog-download-form">
      {status === 'ready' ? <div className="blog-download-ready" ref={result} tabIndex={-1} role="status"><Check size={28} aria-hidden="true"/><h3>Your checklist is ready.</h3><p>{emailed ? 'We’ve sent the link to your email. You can also download your copy here.' : 'Your request is saved, but we couldn’t send the email. You can download your copy here.'}</p><a className="button" href={downloadPath} download><Download size={18} aria-hidden="true"/>Download the free PDF</a><p className="small">US Letter · 1 page · PDF</p></div>
      : <form onSubmit={submit} aria-label="Get the free builder checklist" aria-busy={status === 'sending'}>
        <h3>Get your free checklist</h3><p>We’ll email the link and make the PDF available here after you submit.</p>
        <label htmlFor="checklist-name">Your name<input id="checklist-name" name="name" autoComplete="name" required minLength={2} maxLength={120}/></label>
        <label htmlFor="checklist-email">Email address<input id="checklist-email" name="email" type="email" autoComplete="email" required maxLength={254}/></label>
        <div className="blog-honeypot" aria-hidden="true"><label>Leave this field empty<input name="website" type="text" tabIndex={-1} autoComplete="off"/></label></div>
        <label className="checkbox"><input name="consent" type="checkbox" required/><span>Send me the checklist by email. I’ve read the <a href="/en/privacy/">Privacy Policy</a>.</span></label>
        <p className="small">We use your name and email to deliver this resource and keep a record of your request. This does not subscribe you to marketing.</p>
        <button className="button" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Preparing your checklist…' : 'Email me the free checklist'}<ArrowUpRight size={17} aria-hidden="true"/></button>
        {status === 'error' && <p className="blog-form-error" role="alert">We couldn’t complete your request. Please try again, or <a href="mailto:hello@briller.house?subject=Builder%20checklist">email us for the checklist</a>.</p>}
      </form>}
    </div>
  </section>;
}
