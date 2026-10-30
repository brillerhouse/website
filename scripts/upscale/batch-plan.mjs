import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { inventory, extractionBox } from '../export-inspiration.mjs';
import { geminiPrompt } from './gemini.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const slug = value => String(value).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function targetFor(width, height) {
  const scale = 4096 / Math.max(width, height);
  const target = { width: Math.round(width * scale), height: Math.round(height * scale) };
  const presets = ['4:3','3:2','1:1','2:3','3:4','16:9','9:16','4:5','5:4','21:9'];
  const ranked = presets.map(ratio => { const [w,h] = ratio.split(':').map(Number); return { ratio, difference: Math.abs((w/h)/(width/height)-1) }; }).sort((a,b) => a.difference-b.difference);
  return { ...target, aspectRatio: ranked[0].difference <= .01 ? ranked[0].ratio : null };
}
export function galleryFilename(item, target) {
  const parts = [item.styleName || 'style-unspecified', item.roomName || 'room-unspecified', item.budgetName || 'budget-unspecified', item.sizeName || 'size-unspecified', item.area ? `${item.area}-sqm` : 'area-unspecified', item.title.en.slice(0,60), item.id];
  return path.posix.join(item.collection, slug(item.roomName || 'other'), parts.map(slug).join('__') + (target ? `__${target.width}x${target.height}` : '') + '__4k.jpg');
}
async function walk(folder, base = folder) {
  const files = [];
  for (const entry of (await fs.readdir(folder,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
    if (entry.isSymbolicLink()) continue;
    const full = path.join(folder,entry.name);
    if (entry.isDirectory()) files.push(...await walk(full,base));
    else if (entry.isFile() && /\.(png|jpe?g|webp)$/i.test(entry.name)) files.push({ source:full, relative:path.relative(base,full).split(path.sep).join('/') });
  }
  return files;
}
export async function sourceImage(entry) {
  const bytes = await fs.readFile(entry.source);
  if (hash(bytes) !== entry.sourceHash) throw new Error('Source changed: ' + entry.id);
  let pipeline = sharp(bytes).rotate();
  if (entry.crop) pipeline = pipeline.extract(entry.crop);
  return pipeline.png().toBuffer();
}
export async function planBatch({input,output,model}) {
  if (input) {
    input = await fs.realpath(input);
    // Resolve existing output parents as well, so a symlink cannot hide a nested output.
    async function canonical(file) {
      try { return await fs.realpath(file); }
      catch (error) { if (error.code !== 'ENOENT') throw error; return path.join(await canonical(path.dirname(file)),path.basename(file)); }
    }
    const dest = await canonical(output), relative = path.relative(input,dest);
    if (!relative || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))) throw new Error('Output must be outside the input folder');
  }
  const sources = input ? await walk(input) : (await inventory()).map(item => ({ source:path.join(root,'public',item.detailImage || item.image), relative:item.file, item }));
  if (!sources.length) throw new Error('No separate JPG, PNG or WebP images found');
  const entries = [];
  const sheetHashes = new Set();
  if (input) {
    const sheets = new Set((await inventory()).filter(item => item.crop && !item.detailImage).map(item => item.image));
    for (const sheet of sheets) sheetHashes.add(hash(await fs.readFile(path.join(root,'public',sheet))));
  }
  for (const source of sources) {
    const bytes = await fs.readFile(source.source), metadata = await sharp(bytes).metadata();
    if (sheetHashes.has(hash(bytes))) throw new Error('Input contains an original gallery contact sheet. Use catalogue mode without --input to extract separate scenes first: '+source.relative);
    const crop = source.item ? extractionBox(source.item,metadata) : null;
    const rotated = [5,6,7,8].includes(metadata.orientation);
    const width = crop?.width || (rotated ? metadata.height : metadata.width), height = crop?.height || (rotated ? metadata.width : metadata.height);
    if (!width || !height) throw new Error('Invalid image: '+source.relative);
    const target = targetFor(width,height), item = source.item;
    const id = hash(source.relative).slice(0,16);
    const file = 'images/' + (item ? galleryFilename(item,target) : source.relative.replace(/\.[^.]+$/, '') + '__4k.jpg');
    if (Buffer.byteLength(path.basename(file)) > 250) throw new Error('Filename too long: '+file);
    const attributes = item ? { title:item.title,room:item.roomName,style:item.styleName,budget:item.budgetName,spaceSize:item.sizeName,areaSqm:item.area || null,architecture:item.architecture || null,collection:item.collection,galleryId:item.id } : { title:{en:path.basename(source.relative)},collection:'folder' };
    const entry = {id,file,source:source.source,sourceRelative:source.relative,sourceHash:hash(bytes),crop,input:{width,height},target,attributes};
    entry.requestHash = hash(JSON.stringify({sourceHash:entry.sourceHash,crop,model,target,prompt:geminiPrompt({...target,imageSize:'4K'})}));
    entries.push(entry);
  }
  if (new Set(entries.map(e=>e.file.toLowerCase())).size !== entries.length) throw new Error('Output filename collision; rename duplicate input stems before running');
  return { version:1,kind:'briller-gemini-4k',model,input:input || 'gallery-catalogue',fingerprint:hash(JSON.stringify(entries)),entries };
}
