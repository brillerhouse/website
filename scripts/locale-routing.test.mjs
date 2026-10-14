import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

// Test the actual TypeScript rules without adding a runtime or browser dependency.
const source = fs.readFileSync('lib/locale-routing.ts', 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
const scope = { exports: {}, URL, AbortController, setTimeout, clearTimeout, fetch };
vm.runInNewContext(outputText, scope);
const { redirectAddress, redirectPath, preferredLocale, cachedCountry, COUNTRY_TTL, LOOKUP_FAILURE_TTL, lookupCountry } = scope.exports;

test('Ukraine visitors reach the matching Ukrainian page, including query and fragment', () => {
  assert.equal(redirectAddress('https://briller.house/en/solutions/open-concept-wall-removal/?utm_source=demo#insights', null, 'UA'), 'https://briller.house/uk/solutions/open-concept-wall-removal/?utm_source=demo#insights');
  assert.equal(redirectAddress('http://localhost:3000/?source=local#projects', null, 'UA'), 'http://localhost:3000/uk/?source=local#projects');
  assert.equal(redirectPath('/en', null, 'UA'), '/uk/');
});
test('manual choice wins over IP country and no redirect loops occur', () => {
  assert.equal(redirectPath('/en/solutions/', 'en', 'UA'), null);
  assert.equal(redirectPath('/uk/pricing/', 'en', 'UA'), '/en/pricing/');
  assert.equal(redirectPath('/en/gallery/', 'uk', 'US'), '/uk/gallery/');
  assert.equal(redirectPath('/uk/solutions/', null, 'UA'), null);
  assert.equal(redirectPath('/uk/solutions/', null, 'US'), null);
  assert.equal(redirectPath('/en/solutions/', null, 'US'), null);
  assert.equal(redirectPath('/en/solutions/', null, null), null);
});
test('stored preference is validated and first-party cookie is a fallback', () => {
  assert.equal(preferredLocale('en', 'briller_language=uk'), 'en');
  assert.equal(preferredLocale(null, 'other=value; briller_language=uk; theme=light'), 'uk');
  assert.equal(preferredLocale('invalid', 'briller_language=en'), 'en');
  assert.equal(preferredLocale(null, 'other_briller_language=uk'), null);
  assert.equal(preferredLocale(null, 'briller_language=invalid'), null);
});
test('country cache expires and rejects malformed or future-dated entries', () => {
  const now = 200000000;
  assert.equal(cachedCountry(JSON.stringify({ country: 'UA', checkedAt: now - 100 }), now)?.country, 'UA');
  assert.equal(cachedCountry(JSON.stringify({ country: 'UA', checkedAt: now - COUNTRY_TTL }), now), null);
  assert.equal(cachedCountry(JSON.stringify({ country: null, checkedAt: now - 100 }), now)?.country, null);
  assert.equal(cachedCountry(JSON.stringify({ country: null, checkedAt: now - LOOKUP_FAILURE_TTL }), now), null);
  for (const value of ['invalid', 'null', '{"country":5,"checkedAt":1}', JSON.stringify({country:'UA',checkedAt:now+1})]) assert.equal(cachedCountry(value,now),null);
});
test('IP lookup reads only a country code and sends no credentials or referrer', async () => {
  let request;
  const result = await lookupCountry(async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ ip: '203.0.113.1', country: 'UA' }) };
  });
  assert.equal(result, 'UA');
  assert.equal(request.url, 'https://api.country.is/');
  assert.equal(request.options.credentials, 'omit');
  assert.equal(request.options.referrerPolicy, 'no-referrer');
});
test('lookup failures, rate limiting and invalid responses keep the current language', async () => {
  assert.equal(await lookupCountry(async () => { throw Error('offline'); }), null);
  assert.equal(await lookupCountry(async () => ({ ok: false })), null);
  assert.equal(await lookupCountry(async () => ({ ok: true, json: async () => ({country:'invalid'}) })), null);
  assert.equal(await lookupCountry(async () => ({ ok: true, json: async () => {throw Error('invalid JSON');} })), null);
});
test('a slow country provider is aborted', async () => {
  let aborted = false;
  const result = await lookupCountry((url, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => { aborted = true; reject(Error('aborted')); })), 15);
  assert.equal(result, null);
  assert.equal(aborted, true);
});
