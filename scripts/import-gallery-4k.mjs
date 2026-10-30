import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { extractionBox } from './export-inspiration.mjs';
import { galleryFilename } from './upscale/batch-plan.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=async file=>JSON.parse(await fs.readFile(file,'utf8'));
async function inside(folder,relative) {
  if(typeof relative!=='string'||path.isAbsolute(relative)||relative.split(/[\\/]/).includes('..'))throw new Error('Unsafe image path');
  const full=await fs.realpath(path.join(folder,relative)),base=await fs.realpath(folder),part=path.relative(base,full);
  if(!part||part==='..'||part.startsWith('..'+path.sep)||path.isAbsolute(part))throw new Error('Image escapes input folder');
  return full;
}
export async function inspectImport({input,siteRoot=root}) {
  const job=await json(path.join(input,'job.json'));
  if(job.version!==1||job.kind!=='briller-gemini-4k'||job.input!=='gallery-catalogue'||!Array.isArray(job.entries))throw new Error('Expected a Gemini 4K catalogue batch containing job.json (not a comparison or ordinary 1080p export)');
  const [edition,references,catalogue]=await Promise.all(['gallery-variants.json','gallery.json','gallery-catalogue.json'].map(file=>json(path.join(siteRoot,'content',file))));
  const expected=[...edition.variants.map(item=>({...item,collection:'designs'})),...references.map(item=>({...item,collection:'original-references'}))];
  if(job.entries.length!==expected.length)throw new Error(`Expected ${expected.length} gallery images; received ${job.entries.length}`);
  const byId=new Map();
  for(const entry of job.entries) {
    const id=entry.attributes?.collection+':'+entry.attributes?.galleryId;
    if(byId.has(id))throw new Error('Duplicate gallery ID: '+id);
    byId.set(id,entry);
  }
  const pending=expected.filter(item=>byId.get(item.collection+':'+item.id)?.status!=='complete');
  if(pending.length)throw new Error(`${pending.length} images are missing or not complete. Finish/review the Gemini batch first. Examples: ${pending.slice(0,4).map(item=>item.id).join(', ')}`);
  const label=(items,id)=>items.find(item=>item.id===id)?.label.en||id||'';
  const plan=[],seen=new Set();
  for(const item of expected) {
    const id=item.collection+':'+item.id,entry=byId.get(id);
    const source=await inside(path.join(siteRoot,'public'),(item.detailImage||item.image).replace(/^\//,''));
    const original=await fs.readFile(source),sourceMeta=await sharp(original).metadata();
    if(entry.sourceHash!==digest(original))throw new Error('Gallery source changed since upscaling: '+id);
    const crop=extractionBox(item,sourceMeta);
    if(JSON.stringify(crop)!==JSON.stringify(entry.crop))throw new Error('Gallery framing changed since upscaling: '+id);
    const file=await inside(input,entry.file),bytes=await fs.readFile(file),metadata=await sharp(bytes).metadata();
    if(!entry.result || digest(bytes)!==entry.result.sha256)throw new Error('4K checksum mismatch: '+id);
    const w=crop?.width||sourceMeta.width,h=crop?.height||sourceMeta.height;
    const scale=4096/Math.max(w,h),width=Math.round(w*scale),height=Math.round(h*scale);
    if(!['jpeg','png','webp'].includes(metadata.format)||metadata.width!==width||metadata.height!==height)throw new Error('Wrong 4K dimensions/framing: '+id);
    if(seen.has(entry.result.sha256))throw new Error('Duplicate 4K image: '+id);seen.add(entry.result.sha256);
    const roomName=label(catalogue.rooms,item.room),styleName=label(catalogue.styles,item.style);
    const name=path.posix.basename(galleryFilename({...item,roomName,styleName,budgetName:label(edition.tiers,item.tier),sizeName:label(edition.sizes,item.size),title:item.title||{en:`${styleName} · ${roomName}`}}, {width,height}),'.jpg');
    plan.push({id,input:file,inputSha256:entry.result.sha256,name,width,height});
  }
  const bundle=digest(JSON.stringify({profile:1,images:plan.map(({id,inputSha256,name})=>({id,inputSha256,name}))})).slice(0,16);
  return {bundle,model:job.model,plan};
}
export async function importGallery4K({input,apply=false,siteRoot=root},{log=console.log}={}) {
  const {bundle,model,plan}=await inspectImport({input,siteRoot});
  log(`Validated ${plan.length} separate 4K images. Bundle: ${bundle}`);
  if(!apply){log('Validation only. Add --apply to create responsive WebP files and activate the manifest.');return {applied:false,count:plan.length};}
  const parent=path.join(siteRoot,'public/images/gallery'),stage=path.join(parent,'.import-'+randomUUID());
  const destination=path.join(parent,'individual',bundle),publicBase='/images/gallery/individual/'+bundle;
  const images=[];
  await fs.mkdir(stage,{recursive:true});
  try {
    for(const [index,item] of plan.entries()) {
      const sources=[];
      // Recheck bytes after preflight; never silently import files changed while encoding.
      const bytes=await fs.readFile(item.input);
      if(digest(bytes)!==item.inputSha256)throw new Error('4K input changed during import: '+item.id);
      for(const width of [...new Set([640,1280,2048,item.width].filter(w=>w<=item.width))].sort((a,b)=>a-b)) {
        const filename=item.name+(width===item.width?'':`--${width}w`)+'.webp';
        if(Buffer.byteLength(filename)>250)throw new Error('Filename exceeds filesystem limit: '+filename);
        const output=await sharp(bytes).resize({width,withoutEnlargement:true}).webp({quality:width===item.width?92:85,effort:4}).toBuffer({resolveWithObject:true});
        await fs.writeFile(path.join(stage,filename),output.data);
        sources.push({src:publicBase+'/'+filename,width:output.info.width,height:output.info.height,sha256:digest(output.data)});
      }
      const full=sources.at(-1);
      images.push({id:item.id,src:full.src,width:full.width,height:full.height,sources,inputSha256:item.inputSha256});
      if((index+1)%12===0||index===plan.length-1)log(`Encoded ${index+1}/${plan.length}`);
    }
    await fs.mkdir(path.dirname(destination),{recursive:true});
    let existing=false;
    try {await fs.access(destination);existing=true;}catch(error){if(error.code!=='ENOENT')throw error;}
    if(existing) {
      // A repeated import is allowed only if the existing immutable asset bundle is intact.
      for(const image of images)for(const source of image.sources) {
        const bytes=await fs.readFile(path.join(destination,path.posix.basename(source.src)));
        if(digest(bytes)!==source.sha256)throw new Error('Existing asset bundle differs; preserve it and inspect before replacing: '+source.src);
      }
    } else await fs.rename(stage,destination);
    const manifest={version:1,importedAt:new Date().toISOString(),model,bundle,images};
    const target=path.join(siteRoot,'content/gallery-web-images.json'),temp=target+'.tmp-'+randomUUID();
    await fs.writeFile(temp,JSON.stringify(manifest,null,2)+'\n');
    await fs.rename(temp,target); // Only activate after every image is encoded successfully.
    log('Imported. Original clusters and metadata are preserved for provenance; the gallery now uses individual responsive images.');
    log('Visual approvals are unchanged. Run npm run gallery:review to inspect the new pixels before a build/deployment.');
    return {applied:true,count:images.length,manifest};
  } finally {await fs.rm(stage,{recursive:true,force:true});}
}
export function parseImportOptions(args) {
  const options={input:path.join(os.homedir(),'Downloads','briller-inspiration-gemini-4k'),apply:false};
  for(let i=0;i<args.length;i++) {
    if(args[i]==='--apply')options.apply=true;
    else if(args[i]==='--input'&&args[i+1]&&!args[i+1].startsWith('--'))options.input=path.resolve(args[++i]);
    else throw new Error('Usage: npm run gallery:import:4k -- [--input GEMINI_BATCH_FOLDER] [--apply]');
  }
  return options;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  importGallery4K(parseImportOptions(process.argv.slice(2))).catch(error=>{console.error(error.message);process.exitCode=1;});
}
