import fs from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const catalogue = read('content/gallery-catalogue.json');
const edition = read('content/gallery-variants.json');
const originals = read('content/gallery.json');
const review = read('content/gallery-quality-changes.json');
const historicalReview = read('content/gallery-geometry-review.json');
const approvals = read('content/gallery-quality-review.json');
const { outputText } = ts.transpileModule(fs.readFileSync('lib/gallery.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
const scope = { exports: {}, require: id => {
  if (id === '@/content/gallery-catalogue.json') return { default: catalogue };
  if (id === '@/content/gallery-variants.json') return { default: edition };
  if (id === '@/content/gallery.json') return { default: originals };
  throw new Error(`Unexpected dependency: ${id}`);
}};
vm.runInNewContext(outputText, scope);
const { galleryConcepts, galleryReferences, galleryPrompt, galleryVersions, galleryHighlights } = scope.exports;

test('all 84 room/style combinations have three distinct specifications, sizes and architectural settings', () => {
  assert.equal(catalogue.rooms.length, 7);
  assert.equal(catalogue.styles.length, 12);
  assert.deepEqual(catalogue.rooms.map(room => room.id), ['living','bedroom','bathroom','kitchen','office','dining','workspace']);
  assert.equal(galleryConcepts.length, 252);
  assert.equal(new Set(galleryConcepts.map(item => item.id)).size, 252);
  for (const room of catalogue.rooms) for (const style of catalogue.styles) {
    const items = galleryConcepts.filter(item => item.room === room.id && item.style === style.id);
    assert.equal(items.length, 3, `${room.id}/${style.id}`);
    assert.deepEqual(Array.from(items.map(item => item.tier)).sort(), ['budget','economy','premium']);
    assert.deepEqual(Array.from(items.map(item => item.size)).sort(), ['large','medium','small']);
    assert.equal(new Set(items.map(item => item.architecture.en)).size, 3);
    assert.equal(galleryVersions(items[0]).length, 3);
    assert.equal(new Set(items.map(item => item.detailImage || item.image + JSON.stringify(item.crop))).size, 3);
  }
  for (const tier of edition.tiers) assert.equal(new Set(galleryConcepts.filter(item => item.tier === tier.id).map(item => item.size)).size, 3, 'Budget must not dictate size');
});
test('every variant has a unique bilingual prompt matching its specification and preserving the uploaded room', () => {
  for (const locale of ['en','uk']) {
    const prompts = galleryConcepts.map(item => galleryPrompt(item, locale));
    assert.equal(new Set(prompts).size, 252);
    for (const item of galleryConcepts) {
      const prompt = galleryPrompt(item, locale);
      const tier = edition.tiers.find(tier => tier.id === item.tier);
      const size = edition.sizes.find(size => size.id === item.size);
      assert.ok(prompt.length > 900, item.id);
      assert.ok(prompt.includes(tier.label[locale]) && prompt.includes(tier.brief[locale]), item.id);
      assert.ok(prompt.toLowerCase().includes(size.label[locale].toLowerCase()), item.id);
      assert.ok(prompt.includes(locale === 'en' ? 'windows, doors' : 'вікна, двері'), item.id);
      assert.ok(prompt.includes(locale === 'en' ? 'uploaded photo' : 'завантаженому фото'), item.id);
      assert.ok(!/undefined|null|TODO|placeholder/.test(prompt), item.id);
      if (item.room === 'bathroom') assert.ok(prompt.includes(locale === 'en' ? 'slip-resistant' : 'неслизьке'), item.id);
      if (item.room === 'kitchen') assert.ok(prompt.includes(locale === 'en' ? 'appliance positions' : 'розташування мийки'), item.id);
      if (item.room === 'office') assert.ok(prompt.includes(locale === 'en' ? 'ergonomic' : 'ергономічне'), item.id);
      if (item.room === 'workspace') assert.ok(prompt.includes(locale === 'en' ? 'workbench' : 'робочою поверхнею'), item.id);
    }
  }
});
test('original and selectively corrected image sets provide 252 valid, individually framed scenes', () => {
  const assets = new Set(galleryConcepts.map(item => item.image));
  const declared = new Set([...Object.keys(review.sourceAssets).map(file => file.slice('public'.length)), ...review.batches.map(batch => `/images/gallery/${batch.id}.webp`)]);
  for (const asset of assets) assert.ok(declared.has(asset), `Undocumented image set: ${asset}`);
  for (const image of assets) {
    const data = fs.readFileSync('public' + image);
    assert.equal(data.toString('ascii', 0, 4), 'RIFF', image);
    assert.equal(data.toString('ascii', 8, 12), 'WEBP', image);
    assert.ok(data.length > 10000, image);
    const items = galleryConcepts.filter(item => item.image === image);
    assert.ok(items.length >= 1 && items.length <= 8, image);
    assert.equal(new Set(items.map(item => JSON.stringify(item.crop))).size, items.length, image);
    for (const item of items) {
      const crop = item.crop;assert.ok(crop, item.id);
      assert.ok(crop.x >= 0 && crop.y >= 0 && crop.width > 0 && crop.height > 0, item.id);
      assert.ok(crop.x + crop.width <= 1 && crop.y + crop.height <= 1, item.id);
      assert.ok(Math.abs(crop.width * 1024 / (crop.height * 1536) - 4/3) < 0.0001, item.id);
    }
  }
});
test('current quality review records changed images, preserves selected renders and binds every approval to current pixels', () => {
  const sha = data => createHash('sha256').update(data).digest('hex');
  const renderedHash = item => {
    const image = item.detailImage || item.image;
    const crop = item.detailImage || !item.crop ? null : item.crop;
    return sha(Buffer.concat([fs.readFileSync('public' + image), Buffer.from('\n' + JSON.stringify(crop))]));
  };
  assert.equal(review.reviewedCount, 258);
  assert.equal(review.replacements.length, 162);
  assert.equal(review.preserved.length, 90);
  assert.equal(approvals.reviews.length, 258);
  for (const item of [...galleryConcepts, ...galleryReferences.map(item => ({ ...item, id: `reference:${item.id}` }))]) {
    const approval = approvals.reviews.find(review => review.id === item.id);
    assert.ok(approval, `Missing visual review: ${item.id}`);
    assert.equal(approval.renderSha256, renderedHash(item), `Stale visual review: ${item.id}`);
    assert.equal(approval.decision, 'approved', item.id);
  }
  assert.equal(new Set([...review.replacements, ...review.preserved].map(item => item.id)).size, 252);
  for (const item of review.preserved) {
    const current = galleryConcepts.find(candidate => candidate.id === item.id);
    assert.ok(current, item.id);
    assert.equal(renderedHash(current), item.renderSha256, `Unreviewed change: ${item.id}`);
  }
  for (const item of review.replacements) {
    assert.ok(item.reason && item.fix, item.id);
    const digest = renderedHash(galleryConcepts.find(candidate => candidate.id === item.id));
    assert.notEqual(digest, item.previousRenderSha256, item.id);
    assert.equal(digest, item.renderSha256, item.id);
  }
  for (const [file, digest] of Object.entries({ ...historicalReview.sourceAssets, ...review.sourceAssets, ...review.referenceAssets })) assert.equal(sha(fs.readFileSync(file)), digest, file);
  for (const batch of review.batches) {
    const items = galleryConcepts.filter(item => item.image === `/images/gallery/${batch.id}.webp`);
    assert.deepEqual(Array.from(items.map(item => item.id)).sort(), [...batch.items].sort());
  }
});
test('curated opening uses real variants and original references remain available with prompts', () => {
  assert.equal(galleryHighlights.length, 3);
  assert.equal(new Set(galleryHighlights.map(item => item.id)).size, 3);
  for (const item of galleryHighlights) assert.ok(galleryConcepts.some(candidate => candidate.id === item.id));
  assert.equal(galleryConcepts.filter(item => item.detailImage).length, 3);
  for (const item of galleryHighlights) {
    assert.ok(item.detailImage, item.id);
    const image = fs.readFileSync('public' + item.detailImage);
    assert.equal(image.toString('ascii', 0, 4), 'RIFF', item.id);
    assert.equal(image.toString('ascii', 8, 12), 'WEBP', item.id);
    assert.ok(image.length > 100000, item.id);
  }
  assert.equal(galleryReferences.length, 6);
  for (const item of galleryReferences) {
    assert.ok(fs.existsSync('public' + item.image), item.id);
    for (const locale of ['en','uk']) assert.ok(galleryPrompt(item, locale).length > 450, item.id);
  }
});
test('standalone generation briefs cover every variant and preserve explicit size and style direction', () => {
  const prompts = read('content/gallery-variant-prompts.json');
  assert.equal(prompts.length, 252);
  assert.equal(new Set(prompts.map(item => item.id)).size, 252);
  for (const item of galleryConcepts) {
    const prompt = prompts.find(prompt => prompt.id === item.id)?.prompt;
    assert.ok(prompt && prompt.length > 1400, item.id);
    assert.ok(prompt.includes('standalone landscape 4:3'), item.id);
    assert.ok(prompt.includes(item.area + ' square metres'), item.id);
    assert.ok(!/CELL \d|contact sheet/.test(prompt), item.id);
  }
});
