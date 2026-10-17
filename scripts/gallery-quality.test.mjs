import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { fingerprint, policyFingerprint, activity, analyze, validate, validateCoverage, pendingReviews } from './gallery-quality.mjs';

const policy = JSON.parse(await fs.readFile(new URL('../content/gallery-quality-policy.json', import.meta.url)));
const item = id => ({ id, room: 'living' });
const result = id => ({ id, renderSha256: 'current-' + id, flags: [], errors: [] });
const approved = id => ({ id, renderSha256: 'current-' + id, decision: 'approved', geometry: 'level', checks: Object.fromEntries(policy.requiredChecks.map(key => [key, true])), observation: 'The seating is the focal point; a clear wall and usable floor remain around it.', acknowledgedFlags: [] });
const manifest = reviews => ({ version: policy.version, policySha256: policyFingerprint(policy), reviews });

test('changed pixels OR crop invalidate approval; preparing records cannot silently approve them', () => {
  assert.notEqual(fingerprint(Buffer.from('old')), fingerprint(Buffer.from('new')));
  assert.notEqual(fingerprint(Buffer.from('same'), { x: 0 }), fingerprint(Buffer.from('same'), { x: .1 }));
  const old = approved('one'); old.renderSha256 = 'old';
  assert.match(validate([item('one')], [result('one')], manifest([old]), policy).errors.join(), /changed after visual review/);
  const pending = pendingReviews([result('one'), result('two')], manifest([old]), policy);
  assert.ok(pending.reviews.every(review => review.decision === 'pending' && Object.values(review.checks).every(v => v === false)));
  assert.match(validate([item('one'), item('two')], [result('one'), result('two')], pending, policy).errors.join(), /visual review required/);
});
test('the sloped ceiling cap includes original references, and every exception needs a reason', () => {
  const ids = ['one', 'two', 'three', 'reference:original'];
  const reviews = ids.map(id => ({ ...approved(id), geometry: 'sloped', exceptionReason: 'Retained coherent supported timber roof, with conventional wall openings.' }));
  assert.match(validate(ids.map(item), ids.map(result), manifest(reviews), policy).errors.join(), /4 sloped scenes exceeds maximum 3/);
  assert.deepEqual(validate(ids.slice(0, 3).map(item), ids.slice(0, 3).map(result), manifest(reviews.slice(0, 3)), policy).errors, []);
  delete reviews[0].exceptionReason;
  assert.match(validate(ids.map(item), ids.map(result), manifest(reviews), policy).errors.join(), /explain sloped geometry exception/);
});
test('changing the quality policy invalidates existing approvals instead of silently preserving them', () => {
  const prior = manifest([approved('one')]), changed = { ...policy, highEdgeDensity: .2 };
  assert.match(validate([item('one')], [result('one')], prior, changed).errors.join(), /policy changed/);
  assert.equal(pendingReviews([result('one')], prior, changed).reviews[0].decision, 'pending');
});
test('the build gate rejects an incomplete room/style/specification collection', () => {
  const catalogue = { rooms: [{ id: 'bedroom' }], styles: [{ id: 'japandi' }] };
  const edition = { tiers: [{ id: 'economy' }, { id: 'budget' }, { id: 'premium' }], sizes: [{ id: 'small' }, { id: 'medium' }, { id: 'large' }] };
  const concepts = edition.tiers.map((tier, i) => ({ id: String(i), room: 'bedroom', style: 'japandi', tier: tier.id, size: edition.sizes[i].id }));
  assert.deepEqual(validateCoverage(concepts, catalogue, edition), []);
  assert.match(validateCoverage(concepts.slice(1), catalogue, edition).join(), /exactly one version required/);
  concepts[0].size = 'large';
  assert.match(validateCoverage(concepts, catalogue, edition).join(), /distribute all room sizes/);
});
test('approval fails when styling check is false, review coverage is incomplete, or flags are unexamined', () => {
  const review = approved('one'), analysis = result('one');
  review.checks.restrainedStyling = false;
  analysis.flags = ['high-detail-density', 'similar:two'];
  const errors = validate([item('one'), item('two')], [analysis, result('two')], manifest([review]), policy).errors.join();
  assert.match(errors, /failed visual check restrainedStyling/);
  assert.match(errors, /two: visual review required/);
  assert.match(errors, /inspect similar:two/);
  review.checks.restrainedStyling = true;
  review.acknowledgedFlags = [...analysis.flags];
  review.triageNote = 'Reviewed alongside the other scene: the window and table layout differ; activity is confined to the exterior view.';
  assert.deepEqual(validate([item('one')], [analysis], manifest([review]), policy).errors, []);
});
test('activity triage distinguishes busy high-frequency detail from a quiet surface without assigning taste scores', () => {
  const width = 64, height = 64, quiet = Buffer.alloc(width * height * 3, 120), busy = Buffer.from(quiet);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) for (let c = 0; c < 3; c++) busy[(y * width + x) * 3 + c] = (x + y) % 2 ? 220 : 20;
  assert.ok(activity(busy, width, height).edgeDensity > policy.highEdgeDensity);
  assert.ok(activity(busy, width, height).quietFraction < policy.lowQuietFraction);
  assert.equal(activity(quiet, width, height).edgeDensity, 0);
  assert.equal(activity(quiet, width, height).quietFraction, 1);
});
test('decoded duplicates are rejected across different encodings; out-of-bounds crops also fail', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'briller-gallery-quality-'));
  try {
    await fs.mkdir(path.join(temp, 'images'));
    const source = sharp({ create: { width: 480, height: 360, channels: 3, background: '#9d8364' } });
    await source.clone().png().toFile(path.join(temp, 'images/a.png'));
    await source.clone().webp({ lossless: true }).toFile(path.join(temp, 'images/b.webp'));
    await sharp({ create: { width: 480, height: 360, channels: 3, background: '#9d8365' } }).png().toFile(path.join(temp, 'images/similar.png'));
    const items = [{ ...item('one'), image: '/images/a.png' }, { ...item('two'), image: '/images/b.webp' }, { ...item('bad-crop'), image: '/images/a.png', crop: { x: .9, y: 0, width: .5, height: 1 } }, { ...item('similar'), image: '/images/similar.png' }];
    const results = await analyze(items, policy, temp);
    assert.ok(results[0].errors.some(error => error.includes('Duplicate scene')));
    assert.ok(results[1].errors.some(error => error.includes('Duplicate scene')));
    assert.ok(results[2].errors.some(error => error.includes('Crop is outside')));
    assert.ok(results[0].flags.includes('similar:similar'));
    assert.ok(results[3].flags.includes('similar:one'));
    assert.deepEqual(results[3].errors, [], 'Similar scenes require inspection; only identical decoded scenes are rejected automatically');
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
});
