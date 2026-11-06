import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from 'next/constants.js';
import config from '../next.config.mjs';

test('Local dev skips export-only route validation', () => {
  const dev = config(PHASE_DEVELOPMENT_SERVER);
  assert.equal(dev.output, undefined);
});
test('Production keeps static export, trailing slashes and nginx-owned redirects', () => {
  const production = config(PHASE_PRODUCTION_BUILD);
  assert.equal(production.output, 'export');
  assert.equal(production.trailingSlash, true);
  assert.equal(production.redirects, undefined);
});
test('Local development uses the canonical compare URLs for direct and legacy links', async () => {
  const redirects = await config(PHASE_DEVELOPMENT_SERVER).redirects();
  for (const source of ['/compare/:path*', '/comparison2/:path*']) assert.ok(redirects.some(rule => rule.source === source && rule.destination === '/en/compare/:path*/' && rule.permanent));
  assert.ok(redirects.some(rule => rule.source === '/:locale(en|uk)/comparison2/:path*' && rule.destination === '/:locale/compare/:path*/' && rule.permanent));
});
