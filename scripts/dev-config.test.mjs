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
