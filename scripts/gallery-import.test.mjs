import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {inspectImport,importGallery4K} from './import-gallery-4k.mjs';
import {galleryWebImages,applyGalleryWebImage,verifyGalleryWebImages} from './gallery-image-records.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const silent={log:()=>{}};
async function fixture(t) {
 const siteRoot=await fs.mkdtemp(path.join(os.tmpdir(),'briller-gallery-import-'));t.after(()=>fs.rm(siteRoot,{recursive:true,force:true}));
 const input=path.join(siteRoot,'batch');await fs.mkdir(input);await fs.mkdir(path.join(siteRoot,'content'));await fs.mkdir(path.join(siteRoot,'public/images'),{recursive:true});
 const write=async(name,value)=>fs.writeFile(path.join(siteRoot,'content',name),JSON.stringify(value));
 const variant={id:'living-minimalism-economy',room:'living',style:'minimalism',tier:'economy',size:'small',area:13,tile:0,image:'/images/sheet.png',crop:{x:0,y:0,width:1,height:.5}};
 const reference={id:'reference',room:'living',style:'minimalism',title:{en:'Quiet room',uk:'Спокійна кімната'},image:'/images/reference.png'};
 const sources=[await sharp({create:{width:80,height:120,channels:3,background:'#123456'}}).png().toBuffer(),await sharp({create:{width:80,height:60,channels:3,background:'#345678'}}).png().toBuffer()];
 await fs.writeFile(path.join(siteRoot,'public/images/sheet.png'),sources[0]);await fs.writeFile(path.join(siteRoot,'public/images/reference.png'),sources[1]);
 await write('gallery-variants.json',{variants:[variant],tiers:[{id:'economy',label:{en:'Economy'}}],sizes:[{id:'small',label:{en:'Small'}}]});await write('gallery.json',[reference]);
 await write('gallery-catalogue.json',{rooms:[{id:'living',label:{en:'Living room'}}],styles:[{id:'minimalism',label:{en:'Minimalism'}}]});await write('gallery-web-images.json',{version:1,images:[]});
 await write('gallery-quality-review.json',{reviews:[{id:variant.id,decision:'approved',renderSha256:'original-approved-bytes'}]});
 const job={kind:'briller-gemini-4k',version:1,input:'gallery-catalogue',model:'mock-only',entries:[]};
 for(let i=0;i<2;i++) {
  const file='result-'+i+'.jpg',bytes=await sharp({create:{width:4096,height:3072,channels:3,background:i?'#345678':'#123456'}}).jpeg().toBuffer();await fs.writeFile(path.join(input,file),bytes);
  job.entries.push({attributes:{collection:i?'original-references':'designs',galleryId:i?reference.id:variant.id},status:'complete',file,sourceHash:hash(sources[i]),crop:i?null:{left:0,top:0,width:80,height:60},result:{sha256:hash(bytes)}});
 }
 const save=()=>fs.writeFile(path.join(input,'job.json'),JSON.stringify(job));await save();
 return {siteRoot,input,job,variant,reference,save};
}

test('Import validates a complete 4K catalogue, preserves every characteristic, and dry run writes nothing',async t=>{
 const options=await fixture(t),before=await fs.readFile(path.join(options.siteRoot,'content/gallery-web-images.json'),'utf8');
 const planned=await inspectImport(options);assert.equal(planned.plan.length,2);const name=planned.plan[0].name;
 for(const part of ['minimalism','living-room','economy','small','13-sqm','living-minimalism-economy','4096x3072','4k'])assert.ok(name.includes(part),part);
 const result=await importGallery4K(options,silent);assert.equal(result.applied,false);
 assert.equal(await fs.readFile(path.join(options.siteRoot,'content/gallery-web-images.json'),'utf8'),before);
 await assert.rejects(()=>fs.access(path.join(options.siteRoot,'public/images/gallery/individual')));
});

test('Applying creates responsive standalone images; rendering, export and quality use the same manifest without approving pixels',async t=>{
 const options=await fixture(t),approval=await fs.readFile(path.join(options.siteRoot,'content/gallery-quality-review.json'),'utf8'),edition=await fs.readFile(path.join(options.siteRoot,'content/gallery-variants.json'),'utf8');
 const result=await importGallery4K({...options,apply:true},silent);assert.equal(result.applied,true);
 const images=await galleryWebImages(options.siteRoot);assert.equal(images.size,2);
 const merged=applyGalleryWebImage(options.variant,'designs',images);assert.equal(merged.id,options.variant.id);assert.equal(merged.tier,'economy');assert.equal(merged.area,13);assert.ok(merged.detailImage.includes('/individual/'));
 assert.deepEqual(merged.webImage.sources.map(source=>source.width),[640,1280,2048,4096]);
 for(const image of images.values())for(const source of image.sources) {
  const bytes=await fs.readFile(path.join(options.siteRoot,'public',source.src)),metadata=await sharp(bytes).metadata();assert.equal(metadata.format,'webp');assert.equal(metadata.width,source.width);assert.equal(metadata.height,source.height);assert.equal(hash(bytes),source.sha256);
 }
 assert.equal(await fs.readFile(path.join(options.siteRoot,'content/gallery-quality-review.json'),'utf8'),approval);
 assert.equal(await fs.readFile(path.join(options.siteRoot,'content/gallery-variants.json'),'utf8'),edition);
 assert.deepEqual(applyGalleryWebImage({id:'absent',image:'old'},'designs',images),{id:'absent',image:'old'});
 // An idempotent repeated import checks the immutable bundle instead of overwriting assets.
 const again=await importGallery4K({...options,apply:true},silent);assert.equal(again.manifest.bundle,result.manifest.bundle);
 await verifyGalleryWebImages(options.siteRoot,images);
 const derivative=images.values().next().value.sources[0];
 await fs.writeFile(path.join(options.siteRoot,'public',derivative.src),'corrupt thumbnail');
 await assert.rejects(()=>verifyGalleryWebImages(options.siteRoot,images),/Responsive image checksum mismatch/);
});

test('Missing, pending, duplicate IDs, corrupt or undersized results cannot activate a manifest',async t=>{
 const options=await fixture(t),check=async pattern=>{await options.save();await assert.rejects(()=>importGallery4K({...options,apply:true},silent),pattern);};
 const original=structuredClone(options.job.entries);
 options.job.entries[0].status='needs_review';await check(/not complete/);options.job.entries=structuredClone(original);
 options.job.entries.pop();await check(/Expected 2/);options.job.entries=structuredClone(original);
 options.job.entries[1].attributes={...options.job.entries[0].attributes};await check(/Duplicate gallery ID/);options.job.entries=structuredClone(original);
 options.job.entries[0].result.sha256='corrupt';await check(/checksum mismatch/);options.job.entries=structuredClone(original);
 const small=await sharp({create:{width:2048,height:1536,channels:3,background:'white'}}).jpeg().toBuffer();await fs.writeFile(path.join(options.input,original[0].file),small);options.job.entries[0].result.sha256=hash(small);await check(/Wrong 4K dimensions/);
 assert.deepEqual(await galleryWebImages(options.siteRoot),new Map());
});

test('Changed source/crop and paths outside the batch folder are rejected before activation',async t=>{
 const options=await fixture(t),entry=options.job.entries[0],original=structuredClone(entry);
 entry.sourceHash='stale';await options.save();await assert.rejects(()=>inspectImport(options),/source changed/);Object.assign(entry,original);
 entry.crop={...original.crop,left:1};await options.save();await assert.rejects(()=>inspectImport(options),/framing changed/);Object.assign(entry,original);
 entry.file='../outside.jpg';await options.save();await assert.rejects(()=>inspectImport(options),/Unsafe image path/);Object.assign(entry,original);
 await fs.symlink(path.join(options.siteRoot,'public/images/reference.png'),path.join(options.input,'escape.png'));entry.file='escape.png';await options.save();await assert.rejects(()=>inspectImport(options),/escapes input folder/);
});

test('Known metadata and all source assets remain unchanged when a web manifest is absent or empty',async t=>{
 const options=await fixture(t),map=await galleryWebImages(options.siteRoot);
 assert.strictEqual(applyGalleryWebImage(options.variant,'designs',map),options.variant);
 assert.strictEqual(applyGalleryWebImage(options.reference,'original-references',map),options.reference);
 options.job.input='/some/arbitrary/folder';await options.save();await assert.rejects(()=>inspectImport(options),/catalogue batch/);
});

test('Gallery renderer uses responsive individual photos instead of cluster SVGs, while untouched items keep their framing',async()=>{
 const ts=(await import('typescript')).default,vm=await import('node:vm');
 const {createRequire}=await import('node:module'),require=createRequire(import.meta.url);
 const {renderToStaticMarkup}=require('react-dom/server'),React=require('react');
 const source=await fs.readFile(new URL('../components/Gallery.tsx',import.meta.url),'utf8');
 const {outputText}=ts.transpileModule(source+'\nexport { GalleryImage as TestGalleryImage };',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}});
 const scope={exports:{},require:id=>id==='react'||id==='react/jsx-runtime'?require(id):{}};vm.runInNewContext(outputText,scope);
 const item={id:'test',image:'/images/cluster.webp',tile:0,title:{en:'Living room',uk:'Вітальня'},crop:{x:0,y:0,width:.5,height:.25},webImage:{src:'/images/gallery/individual/test/photo__4k.webp',width:4096,height:3072,sources:[{src:'/images/gallery/individual/test/photo--640w.webp',width:640,height:480},{src:'/images/gallery/individual/test/photo__4k.webp',width:4096,height:3072}]}};
 const render=props=>renderToStaticMarkup(React.createElement(scope.exports.TestGalleryImage,props));
 const html=render({item,locale:'en'});assert.ok(html.includes('<img'));assert.ok(html.includes('srcSet=')&&html.includes('640w')&&html.includes('4096w'));assert.ok(html.includes('loading="lazy"')&&html.includes('width="4096"'));assert.ok(!html.includes('<svg')&&!html.includes('cluster.webp'));
 const large=render({item,locale:'uk',large:true});assert.ok(large.includes('70vw'));assert.ok(large.includes('Вітальня'));
 const {webImage,...fallback}=item;const old=render({item:fallback,locale:'en'});assert.ok(old.includes('<svg')&&old.includes('cluster.webp'));
});

test('Explicit keep-originals preserves failed scenes at native resolution as separate lossless images',async t=>{
 const options=await fixture(t);options.job.entries[0].status='uncertain';delete options.job.entries[0].result;await options.save();
 const plan=await inspectImport({...options,keepOriginals:true});
 assert.equal(plan.plan[0].resolution,'original');assert.equal(plan.plan[0].width,80);assert.equal(plan.plan[0].height,60);assert.ok(plan.plan[0].name.endsWith('__original'));
 const result=await importGallery4K({...options,apply:true,keepOriginals:true},silent);
 assert.deepEqual(result.manifest.retainedOriginals,[{id:'designs:living-minimalism-economy',status:'uncertain',width:80,height:60}]);
 const first=result.manifest.images[0];assert.equal(first.width,80);assert.equal(first.height,60);assert.equal(first.sources.length,1);assert.equal(first.resolution,'original');assert.ok(!first.src.includes('__4k'));
 const original=await sharp(path.join(options.siteRoot,'public/images/sheet.png')).extract({left:0,top:0,width:80,height:60}).raw().toBuffer();
 const preserved=await sharp(path.join(options.siteRoot,'public',first.src)).raw().toBuffer();assert.deepEqual(preserved,original);
 await verifyGalleryWebImages(options.siteRoot,await galleryWebImages(options.siteRoot));
 // The explicit option cannot hide a corrupt result marked complete.
 options.job.entries[1].result.sha256='wrong';await options.save();await assert.rejects(()=>inspectImport({...options,keepOriginals:true}),/checksum mismatch/);
});
