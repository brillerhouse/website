import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const sha = data => createHash('sha256').update(data).digest('hex');
export const fingerprint = (bytes, crop = null) => sha(Buffer.concat([bytes, Buffer.from('\n' + JSON.stringify(crop))]));
export const policyFingerprint = policy => sha(JSON.stringify(policy));
export const hamming = (a, b) => {
  let bits = BigInt('0x' + a) ^ BigInt('0x' + b), count = 0;
  while (bits) { bits &= bits - 1n; count++; }
  return count;
};
export async function entries() {
  const [edition, references] = await Promise.all([read('content/gallery-variants.json'), read('content/gallery.json')]);
  return [...edition.variants, ...references.map(item => ({ ...item, id: `reference:${item.id}`, reference: true }))];
}
export function validateCoverage(items, catalogue, edition) {
  const errors = [], concepts = items.filter(item => !item.reference);
  if (new Set(items.map(item => item.id)).size !== items.length) errors.push('Duplicate gallery IDs');
  if (concepts.length !== catalogue.rooms.length * catalogue.styles.length * edition.tiers.length) errors.push('Incomplete room/style/specification coverage');
  for (const room of catalogue.rooms) for (const style of catalogue.styles) {
    const pair = concepts.filter(item => item.room === room.id && item.style === style.id);
    for (const tier of edition.tiers) if (pair.filter(item => item.tier === tier.id).length !== 1) errors.push(`${room.id}/${style.id}/${tier.id}: exactly one version required`);
    if (new Set(pair.map(item => item.size)).size !== edition.sizes.length || pair.some(item => !edition.sizes.some(size => size.id === item.size))) errors.push(`${room.id}/${style.id}: distribute all room sizes across the versions`);
  }
  return errors;
}
// This measures visual activity, not taste. Window views, tile joints and textiles can
// trigger it legitimately; the flags require inspection instead of automatic rejection.
export function activity(rgb, width, height) {
  const gray = new Float32Array(width * height);
  const mean = [0, 0, 0];
  for (let i = 0; i < gray.length; i++) {
    gray[i] = rgb[i * 3] * .2126 + rgb[i * 3 + 1] * .7152 + rgb[i * 3 + 2] * .0722;
    for (let c = 0; c < 3; c++) mean[c] += rgb[i * 3 + c] / gray.length;
  }
  let edges = 0, sum = 0, quiet = 0, blocks = 0;
  const gradients = new Float32Array(gray.length);
  for (let y = 1; y < height; y++) for (let x = 1; x < width; x++) {
    const i = y * width + x;
    const g = Math.abs(gray[i] - gray[i - 1]) + Math.abs(gray[i] - gray[i - width]);
    gradients[i] = g; if (g > 44) edges++; sum += gray[i];
  }
  for (let y = 1; y + 15 < height; y += 16) for (let x = 1; x + 15 < width; x += 16) {
    let g = 0;
    for (let dy = 0; dy < 16; dy++) for (let dx = 0; dx < 16; dx++) g += gradients[(y + dy) * width + x + dx];
    blocks++; if (g / 256 < 5.5) quiet++;
  }
  return { edgeDensity: edges / ((width - 1) * (height - 1)), quietFraction: quiet / blocks, luminance: sum / ((width - 1) * (height - 1)), meanRGB: mean };
}
export async function analyze(items, policy, publicRoot = path.join(root, 'public')) {
  const cache = new Map();
  const results = [];
  for (const item of items) {
    const source = item.detailImage || item.image;
    if (!source?.startsWith('/images/') || source.includes('..')) throw new Error(`Invalid image path: ${item.id}`);
    if (!cache.has(source)) cache.set(source, await fs.readFile(path.join(publicRoot, source)));
    const bytes = cache.get(source), crop = item.detailImage || item.reference ? null : item.crop;
    const renderSha256 = fingerprint(bytes, crop);
    try {
      const meta = await sharp(bytes).metadata();
      let box = { left: 0, top: 0, width: meta.width, height: meta.height };
      if (crop) {
        if (![crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) || crop.x < 0 || crop.y < 0 || crop.width <= 0 || crop.height <= 0 || crop.x + crop.width > 1.000001 || crop.y + crop.height > 1.000001) throw new Error('Crop is outside source image');
        box = { left: Math.round(crop.x * meta.width), top: Math.round(crop.y * meta.height), width: Math.round(crop.width * meta.width), height: Math.round(crop.height * meta.height) };
      }
      const scene = sharp(bytes).extract(box);
      const pixels = await scene.clone().resize(360, 270, { fit: 'cover' }).removeAlpha().toColourspace('srgb').raw().toBuffer();
      const tiny = await scene.clone().resize(9, 8, { fit: 'cover' }).greyscale().raw().toBuffer();
      let bits = 0n;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits = (bits << 1n) | BigInt(tiny[y * 9 + x] > tiny[y * 9 + x + 1]);
      const metrics = activity(pixels, 360, 270);
      const errors = [], flags = [];
      if (box.width < policy.minSceneWidth || box.height < policy.minSceneHeight) errors.push('Insufficient native scene resolution');
      if (!item.reference && Math.abs(box.width / box.height - 4 / 3) > .005) errors.push('Scene must be 4:3');
      if (metrics.edgeDensity > policy.highEdgeDensity) flags.push('high-detail-density');
      if (metrics.quietFraction < policy.lowQuietFraction) flags.push('little-quiet-space');
      if (metrics.luminance < 38 || metrics.luminance > 230) flags.push('unusual-exposure');
      if (metrics.edgeDensity < .01) flags.push('low-detail-or-blur');
      results.push({ id: item.id, room: item.room, renderSha256, width: box.width, height: box.height, pixelSha256: sha(await scene.clone().removeAlpha().raw().toBuffer()), perceptualHash: bits.toString(16).padStart(16, '0'), metrics, flags, errors });
    } catch (error) { results.push({ id: item.id, renderSha256, flags: [], errors: [error.message] }); }
  }
  for (let i = 0; i < results.length; i++) for (let j = i + 1; j < results.length; j++) {
    const a = results[i], b = results[j];
    if (!a.pixelSha256 || !b.pixelSha256) continue;
    if (a.pixelSha256 === b.pixelSha256) {
      a.errors.push(`Duplicate scene: ${b.id}`); b.errors.push(`Duplicate scene: ${a.id}`);
    } else if (a.room === b.room && hamming(a.perceptualHash, b.perceptualHash) <= policy.similarityDistance && a.metrics.meanRGB.reduce((sum, n, c) => sum + Math.abs(n - b.metrics.meanRGB[c]), 0) < 65) {
      a.flags.push(`similar:${b.id}`); b.flags.push(`similar:${a.id}`);
    }
  }
  return results;
}
export function validate(items, results, manifest, policy) {
  const errors = [], reviews = new Map();
  if (manifest.version !== policy.version) errors.push('Review schema/policy version mismatch');
  if (manifest.policySha256 !== policyFingerprint(policy)) errors.push('Quality policy changed after visual review');
  for (const review of manifest.reviews || []) {
    if (reviews.has(review.id)) errors.push(`Duplicate review: ${review.id}`);
    reviews.set(review.id, review);
  }
  let slopes = 0;
  for (const item of items) {
    const result = results.find(r => r.id === item.id), review = reviews.get(item.id);
    if (!result) { errors.push(`${item.id}: missing analysis`); continue; }
    for (const error of result.errors) errors.push(`${item.id}: ${error}`);
    if (!review || review.decision !== 'approved') { errors.push(`${item.id}: visual review required`); continue; }
    if (review.renderSha256 !== result.renderSha256) errors.push(`${item.id}: image/crop changed after visual review`);
    if (!['level', 'sloped'].includes(review.geometry)) errors.push(`${item.id}: geometry classification required`);
    if (review.geometry === 'sloped') { slopes++; if ((review.exceptionReason || '').length < 30) errors.push(`${item.id}: explain sloped geometry exception`); }
    for (const check of policy.requiredChecks) if (review.checks?.[check] !== true) errors.push(`${item.id}: failed visual check ${check}`);
    if ((review.observation || '').length < 40) errors.push(`${item.id}: concrete visual observation required`);
    const acknowledged = new Set(review.acknowledgedFlags || []);
    for (const flag of result.flags) if (!acknowledged.has(flag)) errors.push(`${item.id}: inspect ${flag}`);
    if (result.flags.length && (review.triageNote || '').length < 40) errors.push(`${item.id}: explain why flagged detail/similarity is acceptable`);
  }
  const ids = new Set(items.map(item => item.id));
  for (const id of reviews.keys()) if (!ids.has(id)) errors.push(`Review for absent scene: ${id}`);
  if (slopes > policy.maxSlopedScenes) errors.push(`${slopes} sloped scenes exceeds maximum ${policy.maxSlopedScenes}`);
  return { errors, reviewed: reviews.size, scenes: items.length, slopes, flagged: results.filter(r => r.flags.length).length };
}
export function pendingReviews(results, previous = { reviews: [] }, policy) {
  const policySha256 = policyFingerprint(policy);
  return { version: policy.version, policySha256, reviews: results.map(result => {
    const old = previous.reviews.find(review => review.id === result.id);
    if (previous.policySha256 === policySha256 && old?.renderSha256 === result.renderSha256) return old;
    return { id: result.id, renderSha256: result.renderSha256, decision: 'pending', geometry: null, checks: Object.fromEntries(policy.requiredChecks.map(key => [key, false])), observation: '', acknowledgedFlags: [], triageNote: '' };
  }) };
}
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
async function report(items, results, manifest, policy) {
  const destination = path.join(root, '.gallery-review'); await fs.mkdir(destination, { recursive: true });
  const cards = items.map(item => {
    const result = results.find(r => r.id === item.id), review = manifest.reviews?.find(r => r.id === item.id);
    const url = '../public' + (item.detailImage || item.image), c = item.crop;
    const picture = item.detailImage || !c ? `<img loading="lazy" src="${escape(url)}" alt="${escape(item.id)}">` : `<svg role="img" aria-label="${escape(item.id)}" viewBox="${c.x * 1024} ${c.y * 1536} ${c.width * 1024} ${c.height * 1536}"><image href="${escape(url)}" width="1024" height="1536"/></svg>`;
    const pending = review?.decision !== 'approved' || review?.renderSha256 !== result.renderSha256;
    return `<article data-review="${pending ? 'pending' : 'reviewed'}" data-flags="${result.flags.length ? 'flagged' : 'clear'}"><h2>${escape(item.id)}</h2>${picture}<p>${escape([item.size, item.tier, review?.geometry].filter(Boolean).join(' · '))}</p><p>${pending ? 'REVIEW REQUIRED' : 'Reviewed'} · detail ${((result.metrics?.edgeDensity || 0) * 100).toFixed(1)}% · quiet ${((result.metrics?.quietFraction || 0) * 100).toFixed(1)}%</p><p class="flags">${escape([...result.errors, ...result.flags].join(' / '))}</p><p>${escape(review?.observation || '')}</p><details><summary>Image fingerprint and review</summary><pre>${escape(JSON.stringify({ analysis: result, review }, null, 2))}</pre></details></article>`;
  }).join('');
  await fs.writeFile(path.join(destination, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Gallery quality review</title><style>body{font:15px system-ui;background:#f4f2ed;color:#272b25;margin:24px}header{max-width:1000px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:20px}article{border:1px solid #ccc;border-radius:8px;padding:12px;min-width:0}h2{font-size:14px}img,svg{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px}.flags{color:#8f391e}label{display:inline-block;margin:10px 20px 20px 0}</style><header><h1>Gallery quality review · ${items.length} scenes</h1><p>Measurements flag potential problems; visual inspection decides quality. Check every scene at full size. Preparing a manifest never approves images.</p><ul>${policy.reviewCriteria.map(c => `<li>${escape(c)}</li>`).join('')}</ul><label><input id="pending" type="checkbox"> Only pending</label><label><input id="flagged" type="checkbox"> Only flagged</label></header><main>${cards}</main><script>document.querySelectorAll('input').forEach(i=>i.onchange=()=>document.querySelectorAll('article').forEach(a=>a.hidden=(document.querySelector('#pending').checked&&a.dataset.review!=='pending')||(document.querySelector('#flagged').checked&&a.dataset.flags!=='flagged')));</script>`);
  await fs.writeFile(path.join(destination, 'analysis.json'), JSON.stringify(results, null, 2) + '\n');
  await fs.writeFile(path.join(destination, 'pending-reviews.json'), JSON.stringify(pendingReviews(results, manifest, policy), null, 2) + '\n');
  console.log('Review board: .gallery-review/index.html (serve the repository root over local HTTP). Pending records: .gallery-review/pending-reviews.json');
}
async function main() {
  const policy = await read('content/gallery-quality-policy.json'), items = await entries();
  let manifest; try { manifest = await read('content/gallery-quality-review.json'); } catch (error) { if (error.code !== 'ENOENT') throw error; manifest = { version: policy.version, reviews: [] }; }
  const results = await analyze(items, policy);
  if (process.argv[2] === 'report' || process.argv[2] === 'prepare') { await report(items, results, manifest, policy); return; }
  const verdict = validate(items, results, manifest, policy);
  verdict.errors.push(...validateCoverage(items, await read('content/gallery-catalogue.json'), await read('content/gallery-variants.json')));
  if (verdict.errors.length) { console.error(verdict.errors.join('\n')); process.exitCode = 1; }
  else console.log(`Gallery quality: ${verdict.scenes} current images approved; ${verdict.slopes}/${policy.maxSlopedScenes} sloped exceptions; ${verdict.flagged} triage flags inspected.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
