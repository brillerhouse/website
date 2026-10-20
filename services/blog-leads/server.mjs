import http from 'node:http';
import { pathToFileURL } from 'node:url';

export const resourcePath = '/downloads/briller-builder-checklist-letter.pdf';
const emailPattern = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const escapeHtml = text => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function createHandler(config, { fetcher = fetch, now = Date.now } = {}) {
  const attempts = new Map(), delivered = new Map(), pending = new Map();
  const allowedOrigins = new Set(config.allowedOrigins || ['https://briller.house']);
  const configured = Boolean(config.apiKey && emailPattern.test(config.senderEmail || '') && Number.isSafeInteger(config.listId) && config.listId > 0);
  function response(res, status, body, origin) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin', ...(allowedOrigins.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}) });
    res.end(JSON.stringify(body));
  }
  function rateLimit(key, limit, windowMs) {
    const clock = now(), entry = attempts.get(key);
    if (!entry || clock - entry.start >= windowMs) { attempts.set(key, { start: clock, count: 1 }); return false; }
    entry.count++; return entry.count > limit;
  }
  async function provider(path, body) {
    const result = await fetcher('https://api.brevo.com/v3/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'api-key': config.apiKey }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
    if (!result.ok) throw new Error('Delivery provider request failed');
  }
  async function deliver(data) {
    await provider('contacts', { email: data.email, updateEnabled: true, listIds: [config.listId], attributes: { FIRSTNAME: data.name, BRILLER_RESOURCE: 'builder-checklist', BRILLER_CHECKLIST_AT: new Date(now()).toISOString() } });
    let emailSent = true;
    try {
      await provider('smtp/email', {
        sender: { name: 'Briller', email: config.senderEmail }, to: [{ email: data.email, name: data.name }],
        subject: 'Your free Briller builder checklist',
        htmlContent: `<p>Hi ${escapeHtml(data.name)},</p><p>Here is the one-page checklist you requested. Take it to your builder to review geometry, structure, services, finished heights and project scope.</p><p><a href="https://briller.house${resourcePath}">Download your free PDF checklist</a></p><p>This email delivers your requested resource. You have not been subscribed to marketing.</p><p>Briller · <a href="https://briller.house/en/privacy/">Privacy Policy</a> · hello@briller.house</p>`,
        textContent: `Hi ${data.name},\n\nHere is your free builder checklist:\nhttps://briller.house${resourcePath}\n\nThis email delivers your requested resource. You have not been subscribed to marketing.\n\nBriller | hello@briller.house | https://briller.house/en/privacy/`
      });
    } catch { emailSent = false; }
    return { downloadUrl: resourcePath, emailSent };
  }
  return async (req, res) => {
    const origin = req.headers.origin || '';
    if ((req.url === '/health' || req.url === '/healthz') && req.method === 'GET') return response(res, 200, { ok: true, deliveryConfigured: configured }, origin);
    if (req.url !== '/checklist' && req.url !== '/api/blog-leads/') return response(res, 404, { error: 'Not found' }, origin);
    if (!allowedOrigins.has(origin)) return response(res, 403, { error: 'Origin not allowed' }, origin);
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600', Vary: 'Origin' }); res.end(); return;
    }
    if (req.method !== 'POST') return response(res, 405, { error: 'Use POST' }, origin);
    if (!configured) return response(res, 503, { error: 'Resource delivery is unavailable' }, origin);
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return response(res, 415, { error: 'Use JSON' }, origin);
    // A single instance is required for this bounded, in-memory abuse protection.
    const clock = now();
    for (const [key, entry] of attempts) if (clock - entry.start > 600000) attempts.delete(key);
    for (const [key, entry] of delivered) if (clock - entry.at > 600000) delivered.delete(key);
    if (attempts.size > 10000) return response(res, 429, { error: 'Please try later' }, origin);
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',').at(-1).trim();
    if (rateLimit('ip:' + ip, 10, 60000)) return response(res, 429, { error: 'Please try later' }, origin);
    let body = ''; req.setEncoding('utf8');
    try { for await (const chunk of req) { body += chunk.toString(); if (Buffer.byteLength(body) > 6000) return response(res, 413, { error: 'Request too large' }, origin); } }
    catch { return response(res, 400, { error: 'Invalid request' }, origin); }
    let data;
    try { data = JSON.parse(body); } catch { return response(res, 400, { error: 'Invalid JSON' }, origin); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return response(res, 400, { error: 'Invalid request' }, origin);
    if (data.website) return response(res, 400, { error: 'Invalid request' }, origin);
    if (typeof data.name !== 'string' || data.name.trim().length < 2 || data.name.length > 120 || /[\x00-\x1f\x7f]/.test(data.name) || typeof data.email !== 'string' || data.email.length > 254 || !emailPattern.test(data.email.trim()) || data.consent !== true || data.resource !== 'builder-checklist' || typeof data.source !== 'string' || !/^[a-z0-9-]{1,120}$/.test(data.source) || typeof data.requestId !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.requestId) || typeof data.startedAt !== 'number' || clock - data.startedAt < 1000 || clock - data.startedAt > 86400000) return response(res, 400, { error: 'Check the form details' }, origin);
    data = { ...data, name: data.name.trim(), email: data.email.trim().toLowerCase() };
    // Keep email addresses out of runtime logs and map keys.
    const { createHash } = await import('node:crypto');
    const emailKey = createHash('sha256').update(data.email).digest('hex');
    const requestKey = emailKey + ':' + data.requestId;
    if (delivered.has(requestKey)) return response(res, 200, delivered.get(requestKey).result, origin);
    if (pending.has(requestKey)) { try { return response(res, 200, await pending.get(requestKey), origin); } catch { return response(res, 503, { error: 'Please try later' }, origin); } }
    if (rateLimit('email:' + emailKey, 2, 300000)) return response(res, 429, { error: 'Please try later' }, origin);
    const request = deliver(data); pending.set(requestKey, request);
    try { const result = await request; delivered.set(requestKey, { at: clock, result }); return response(res, 200, result, origin); }
    catch { return response(res, 503, { error: 'Please try again later' }, origin); }
    finally { pending.delete(requestKey); }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const handler = createHandler({ apiKey: process.env.BREVO_API_KEY, senderEmail: process.env.BLOG_SENDER_EMAIL, listId: Number(process.env.BREVO_CHECKLIST_LIST_ID), allowedOrigins: (process.env.BLOG_ALLOWED_ORIGINS || 'https://briller.house').split(',').map(origin => origin.trim()) });
  const server = http.createServer((req, res) => { handler(req, res).catch(() => { if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Request failed' })); }); });
  server.requestTimeout = 15000;
  server.listen(Number(process.env.PORT || 8782), '0.0.0.0', () => console.log('Blog resource delivery listening'));
}
