import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const slug = value => String(value).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const csv = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';

export async function inventory() {
  const catalogue = await read('content/gallery-catalogue.json');
  const edition = await read('content/gallery-variants.json');
  const references = await read('content/gallery.json');
  const label = (items, id, locale = 'en') => items.find(item => item.id === id)?.label[locale] || id || '';
  return [...edition.variants.map(item => ({ ...item, collection: 'designs' })), ...references.map(item => ({ ...item, collection: 'original-references' }))].map(item => {
    const room = label(catalogue.rooms, item.room), style = label(catalogue.styles, item.style);
    const budget = label(edition.tiers, item.tier), size = label(edition.sizes, item.size);
    const title = item.title || { en: `${style} · ${room}`, uk: `${label(catalogue.styles, item.style, 'uk')} · ${label(catalogue.rooms, item.room, 'uk')}` };
    const name = item.collection === 'designs'
      ? [room, style, budget, size, item.area ? item.area + '-sqm' : '', item.id].filter(Boolean).map(slug).join('__')
      : [room, title.en, 'reference-' + item.id].map(slug).join('__');
    return { ...item, title, roomName: room, styleName: style, budgetName: budget, sizeName: size, file: path.posix.join(item.collection, ...(item.collection === 'designs' ? [slug(room)] : []), name + '.jpg') };
  });
}

export function extractionBox(item, metadata) {
  if (item.detailImage || !item.crop) return null;
  const crop = item.crop;
  if (![crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) || crop.x < 0 || crop.y < 0 || crop.width <= 0 || crop.height <= 0 || crop.x + crop.width > 1.000001 || crop.y + crop.height > 1.000001) throw new Error('Invalid gallery crop: ' + item.id);
  const left = Math.round(crop.x * metadata.width), top = Math.round(crop.y * metadata.height);
  return { left, top, width: Math.min(Math.round(crop.width * metadata.width), metadata.width - left), height: Math.min(Math.round(crop.height * metadata.height), metadata.height - top) };
}

async function exportGallery({ output, render, archive }) {
  const items = await inventory();
  if (!items.length || new Set(items.map(item => item.id)).size !== items.length || new Set(items.map(item => item.file)).size !== items.length) throw new Error('Incomplete gallery or duplicate filenames');
  const records = [];
  for (const item of items) {
    const source = path.join(root, 'public', item.detailImage || item.image);
    const metadata = await sharp(source).metadata(), box = extractionBox(item, metadata);
    const crop = box ? item.crop : null;
    const ratio = crop ? (crop.width * metadata.width) / (crop.height * metadata.height) : metadata.width / metadata.height;
    const width = Math.round(1080 * ratio), height = 1080;
    records.push({ file: item.file, id: item.id, title_en: item.title.en, title_uk: item.title.uk, room: item.roomName, style: item.styleName, budget: item.budgetName, space_size: item.sizeName, area_sqm: item.area || '', width, height, source: item.detailImage || item.image, crop: box, source_width: metadata.width, source_height: metadata.height, extracted_width: box?.width || metadata.width, extracted_height: box?.height || metadata.height });
  }
  if (!render) {
    console.log(`Gallery inventory ready: ${items.length} individual images (${items.filter(item => item.collection === 'designs').length} designs + ${items.filter(item => item.collection === 'original-references').length} original references).`);
    console.log('Dry run: no images resized and no files written. Add --render to export existing pixels with Lanczos3 resampling, without AI regeneration.');
    console.log('Example: ' + records[0].file + ` (${records[0].width} × 1080)`);
    return;
  }
  // Require a fresh destination: never overwrite or delete an existing export/user folder.
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.mkdir(output);
  sharp.cache({ memory: 64, files: 10, items: 20 });
  for (let index = 0; index < items.length; index++) {
    const item = items[index], record = records[index], destination = path.join(output, item.file);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    let picture = sharp(path.join(root, 'public', record.source));
    if (record.crop) picture = picture.extract(record.crop);
    await picture.resize(record.width, record.height, { fit: 'fill', kernel: 'lanczos3' }).jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true }).toFile(destination);
    const result = await sharp(destination).metadata();
    if (result.width !== record.width || result.height !== 1080) throw new Error('Wrong output dimensions: ' + item.id);
    if ((index + 1) % 24 === 0 || index === items.length - 1) console.log(`Exported ${index + 1}/${items.length}`);
  }
  const headers = ['file','id','title_en','title_uk','room','style','budget','space_size','area_sqm','width','height','source_width','source_height','extracted_width','extracted_height','source'];
  await fs.writeFile(path.join(output, 'gallery-index.csv'), '\uFEFF' + [headers.map(csv).join(','), ...records.map(record => headers.map(key => csv(record[key])).join(','))].join('\r\n') + '\r\n');
  await fs.writeFile(path.join(output, 'gallery-index.json'), JSON.stringify({ exportedAt: new Date().toISOString(), source: 'Briller Inspiration gallery', method: 'Existing gallery pixels extracted and resized with Lanczos3; no AI enhancement or regeneration.', imageCount: items.length, height: 1080, items: records }, null, 2) + '\n');
  await fs.writeFile(path.join(output, 'README.txt'), `Briller Inspiration — individual image export\n\n252 design variants and 6 original references, each as a separate named JPEG.\nAll files are 1080 pixels high; widths preserve the source framing (usually 1440 pixels).\nOriginal references may have different proportions, including square.\n\nThe gallery's current crops and three higher-resolution featured images are used.\nInterpolation increases pixel dimensions; it cannot recover missing source detail. No AI regeneration, new objects, text overlays, letterboxing or additional framing crop was applied.\nEnglish filenames contain room, style, budget, space size, area and original ID.\ngallery-index.csv and gallery-index.json include English/Ukrainian titles and source/output sizes.\n\nThis export leaves the website and all source images unchanged.\n`);
  console.log('Images and index: ' + output);
  if (archive) {
    const archivePath = output + '.zip';
    try { await fs.access(archivePath); throw new Error('Archive already exists: ' + archivePath); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    await new Promise((resolve, reject) => {
      const child = spawn('zip', ['-q', '-r', path.basename(archivePath), path.basename(output)], { cwd: path.dirname(output), stdio: 'inherit' });
      child.on('error', reject);child.on('close', code => code === 0 ? resolve() : reject(new Error('zip failed; separate images remain in ' + output)));
    });
    console.log('ZIP archive: ' + archivePath);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);let output, render = false, archive = true;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) output = path.resolve(args[++i]);
    else if (args[i] === '--render') render = true;
    else if (args[i] === '--no-zip') archive = false;
    else throw new Error('Usage: node scripts/export-inspiration.mjs [--render] [--output NEW_FOLDER] [--no-zip]');
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  output ||= path.join(os.homedir(), 'Downloads', 'briller-inspiration-1080p-' + stamp);
  exportGallery({ output, render, archive }).catch(error => { console.error(error.message);process.exitCode = 1; });
}
