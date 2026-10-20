import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';

const base = new URL(process.argv[2] || 'http://127.0.0.1:18080');

function request(path, host = 'briller.house') {
  const url = new URL(path, base);
  const transport = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = transport.get(url, { headers: { host, 'x-forwarded-proto': 'https' } }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, location: response.headers.location, body }));
      response.on('error', reject);
    });
    req.setTimeout(3000, () => req.destroy(new Error('Redirect check timed out')));
    req.on('error', reject);
  });
}

let ready = false;
for (let attempt = 0; attempt < 20; attempt++) {
  try { if ((await request('/en/')).status === 200) { ready = true; break; } } catch {}
  await new Promise(resolve => setTimeout(resolve, 250));
}
assert(ready, 'Nginx must serve the exported English homepage');

for (const host of ['briller.house', 'briller-preview.run.app']) {
  for (const [path, status, location] of [['/', 302, '/en/'], ['/en', 301, '/en/'], ['/uk', 301, '/uk/']]) {
    const result = await request(path, host);
    assert.equal(result.status, status, `${host}${path}: status`);
    assert.equal(result.location, location, `${host}${path}: redirect must stay relative behind the HTTPS proxy`);
    const publicUrl = new URL(result.location, `https://${host}`);
    assert.equal(publicUrl.protocol, 'https:');
    assert.equal(publicUrl.host, host, 'Do not expose an internal port or change the public host');
  }
}

for (const path of ['/en/solutions', '/uk/pricing', '/en/privacy']) {
  const result = await request(path);
  assert([200, 301, 302].includes(result.status), `${path}: exported directory must resolve`);
  if (result.location) assert.equal(result.location, path + '/', 'Directory normalization must not expose the backend origin');
  else assert(result.body.includes('<html'), `${path}: expected the exported page`);
}

for (const [path, target] of [
  ['/blog', '/en/blog/'], ['/blog/', '/en/blog/'],
  ['/blog/?q=lighting', '/en/blog/?q=lighting'],
  ['/blog/how-to-read-an-ai-render-before-you-build/?source=legacy', '/en/blog/how-to-read-an-ai-render-before-you-build/?source=legacy'],
  ['/blog/category/renovation-planning/', '/en/blog/category/renovation-planning/'],
  ['/blog/tag/lighting/', '/en/blog/tag/lighting/']
]) {
  const result = await request(path);
  assert.equal(result.status, 301, path + ': permanent blog migration');
  assert.equal(result.location, target, path + ': preserve path/query on HTTPS');
}
for (const path of ['/en/blog/', '/uk/blog/', '/uk/blog/how-to-read-an-ai-render-before-you-build/']) {
  const result = await request(path); assert.equal(result.status, 200, path);
}
const www = await request('/uk/pricing/?source=redirect-check', 'www.briller.house');
assert.equal(www.status, 301);
assert.equal(www.location, 'https://briller.house/uk/pricing/?source=redirect-check');
const missing = await request('/not-a-briller-page');
assert.equal(missing.status, 404);
assert.equal(missing.location, undefined);
console.log('PASS: root, EN/UK, localized blogs, legacy blog 301s, preview host, directory normalization, www/query preservation and 404; no backend scheme/port leak.');
