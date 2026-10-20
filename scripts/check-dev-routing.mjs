import assert from 'node:assert/strict';

// Run against an already-running npm run dev server, never production.
const base = new URL(process.argv[2] || 'http://127.0.0.1:3001');
assert(['localhost', '127.0.0.1'].includes(base.hostname), 'Use a local dev server');
const slug = 'how-to-read-an-ai-render-before-you-build';
for (const [path, status] of [
  ['/en/blog/', 200], ['/uk/blog/', 200],
  [`/en/blog/${slug}/`, 200], [`/uk/blog/${slug}/`, 200],
  ['/uk/blog/category/renovation-planning/', 200], ['/uk/blog/tag/lighting/', 200],
  ['/en/pricing/', 200], ['/en/unknown-page/', 404]
]) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(60000) });
  assert.equal(response.status, status, path);
  assert.ok(!(await response.text()).includes('is missing param'), path + ': no export validation error');
}
for (const [path, destination] of [
  ['/blog/', '/en/blog/'],
  [`/blog/${slug}/?source=legacy`, `/en/blog/${slug}/?source=legacy`]
]) {
  const response = await fetch(new URL(path, base), { redirect: 'manual', signal: AbortSignal.timeout(30000) });
  assert([301, 308].includes(response.status), path + ': permanent redirect');
  assert.equal(new URL(response.headers.get('location'), base).href, new URL(destination, base).href);
}
console.log('PASS: real Next dev EN/UK blog, article, archives, pricing, unknown-page 404 and legacy redirects with query preservation.');
