import assert from 'node:assert/strict';
import { test } from 'node:test';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { createHandler, resourcePath, ukrainianResourcePath } from './server.mjs';
import { renderNginx } from '../../scripts/render-nginx.mjs';

const config = { apiKey: 'unit-test-provider-key', senderEmail: 'checklist@example.test', listId: 17, allowedOrigins: ['http://localhost:3001'] };
const valid = () => ({ name: 'Test Reader', email: 'reader@example.test', consent: true, website: '', startedAt: Date.now() - 2000, requestId: randomUUID(), resource: 'builder-checklist', source: 'how-to-read-an-ai-render-before-you-build' });
async function service(t, options = {}) {
  const calls = [];
  const handler = createHandler(options.config || config, { fetcher: async (url, request) => { calls.push({ url, body: JSON.parse(request.body) }); return { ok: !options.fail?.(url) }; } });
  const server = http.createServer((req, res) => handler(req, res));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const url = `http://127.0.0.1:${server.address().port}`;
  const send = (data = valid(), extras = {}) => fetch(url + '/checklist', { method: 'POST', headers: { Origin: 'http://localhost:3001', 'Content-Type': 'application/json', ...extras.headers }, body: JSON.stringify(data) });
  return { send, calls, url };
}
test('Stores the requested contact then sends the resource email and returns its exact download URL', async t => {
  const { send, calls } = await service(t);const r = await send();assert.equal(r.status, 200);assert.deepEqual(await r.json(), { downloadUrl: resourcePath, emailSent: true });
  assert.equal(calls.length, 2);assert.ok(calls[0].url.endsWith('/contacts'));assert.deepEqual(calls[0].body.listIds, [17]);assert.equal(calls[0].body.attributes.BRILLER_RESOURCE, 'builder-checklist');assert.equal(calls[0].body.emailBlacklisted, undefined);
  assert.ok(calls[1].url.endsWith('/smtp/email'));assert.match(calls[1].body.textContent, /https:\/\/briller.house\/downloads\/briller-builder-checklist-letter.pdf/);assert.match(calls[1].body.textContent, /not been subscribed to marketing/);
});
test('Rejects missing consent, invalid input, unknown resources and honeypot submissions without contacting Brevo', async t => {
  for (const change of [{ consent: false }, { email: 'bad-address' }, { name: 'A' }, { website: 'spam' }, { resource: 'other-file' }, { startedAt: Date.now() }, { source: '../../secrets' }, { locale: 'fr' }, { locale: '../uk' }]) {
    const { send, calls } = await service(t);assert.equal((await send({ ...valid(), ...change })).status, 400);assert.equal(calls.length, 0);
  }
});
test('Does not unlock the resource when contact storage fails', async t => {
  const { send, calls } = await service(t, { fail: url => url.endsWith('/contacts') });const r = await send();assert.equal(r.status, 503);assert.equal((await r.json()).downloadUrl, undefined);assert.equal(calls.length, 1);
});
test('Still supplies download after storage when email delivery fails, without claiming an email was sent', async t => {
  const { send } = await service(t, { fail: url => url.endsWith('/smtp/email') });const r = await send();assert.equal(r.status, 200);assert.deepEqual(await r.json(), { downloadUrl: resourcePath, emailSent: false });
});
test('Idempotent retries of a successful request do not send a second email', async t => {
  const { send, calls } = await service(t);const data = valid();assert.equal((await send(data)).status, 200);assert.equal((await send(data)).status, 200);assert.equal(calls.length, 2);
});
test('Repeated new requests for the same address are limited', async t => {
  const { send, calls } = await service(t);await send();await send();assert.equal((await send()).status, 429);assert.equal(calls.length, 4);
});
test('Ignores unapproved origins and fails closed when configuration is missing', async t => {
  const { send, calls } = await service(t);assert.equal((await send(valid(), { headers: { Origin: 'https://unrelated.example' } })).status, 403);assert.equal(calls.length, 0);
  const other = await service(t, { config: { allowedOrigins: config.allowedOrigins } });assert.equal((await other.send()).status, 503);assert.equal(other.calls.length, 0);
});
test('Escapes user-provided names in the email HTML', async t => {
  const { send, calls } = await service(t);assert.equal((await send({ ...valid(), name: '<img src=x>' })).status, 200);assert.ok(!calls[1].body.htmlContent.includes('<img src=x>'));assert.match(calls[1].body.htmlContent, /&lt;img src=x&gt;/);
});
test('Answers CORS preflight narrowly and does not expose secrets in health status', async t => {
  const { url } = await service(t);const preflight = await fetch(url + '/checklist', { method: 'OPTIONS', headers: { Origin: 'http://localhost:3001' } });assert.equal(preflight.status, 204);assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:3001');
  const health = await fetch(url + '/health');assert.deepEqual(await health.json(), { ok: true, deliveryConfigured: true });
});
test('Enforces JSON and request body size', async t => {
  const { send, url, calls } = await service(t);assert.equal((await send(valid(), { headers: { 'Content-Type': 'text/plain' } })).status, 415);
  const r = await fetch(url + '/checklist', { method: 'POST', headers: { Origin: 'http://localhost:3001', 'Content-Type': 'application/json' }, body: JSON.stringify({ ...valid(), oversized: 'x'.repeat(7000) }) });assert.equal(r.status, 413);assert.equal(calls.length, 0);
});
test('Adds only the configured HTTPS delivery origin to the existing CSP', () => {
  const original = "connect-src 'self' https://api.country.is; form-action 'self'";
  assert.equal(renderNginx(original), original);assert.equal(renderNginx(original, 'https://example.run.app/checklist'), "connect-src 'self' https://example.run.app https://api.country.is; form-action 'self'");
  for (const invalid of ['http://example.run.app/checklist','https://user:secret@example.run.app/checklist','https://example.run.app/;bad'])assert.throws(() => renderNginx(original, invalid));
});

test('Ukrainian requests receive a Ukrainian email, privacy link and exact Ukrainian PDF', async t => {
  const { send, calls } = await service(t);
  const r = await send({ ...valid(), locale: 'uk', name: 'Олена Тест' });
  assert.equal(r.status, 200); assert.deepEqual(await r.json(), { downloadUrl: ukrainianResourcePath, emailSent: true });
  const email = calls[1].body;
  assert.match(email.subject, /Ваш безкоштовний чекліст/);
  assert.match(email.textContent, /briller-builder-checklist-uk\.pdf/);
  assert.match(email.htmlContent, /lang="uk"/); assert.match(email.htmlContent, /\/uk\/privacy\//);
  assert.ok(!email.htmlContent.includes('builder-checklist-letter.pdf'));
});
test('A language switch cannot reuse a previous-language response for the same request ID', async t => {
  const { send, calls } = await service(t); const data = valid();
  assert.equal((await (await send(data)).json()).downloadUrl, resourcePath);
  assert.equal((await (await send({ ...data, locale: 'uk' })).json()).downloadUrl, ukrainianResourcePath);
  assert.equal(calls.length, 4);
});
test('Ukrainian download remains available after storage when email delivery fails', async t => {
  const { send } = await service(t, { fail: url => url.endsWith('/smtp/email') });
  const r = await send({ ...valid(), locale: 'uk' });
  assert.equal(r.status, 200); assert.deepEqual(await r.json(), { downloadUrl: ukrainianResourcePath, emailSent: false });
});
