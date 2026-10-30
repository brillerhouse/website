import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { inventory, extractionBox } from './export-inspiration.mjs';
import { createRealEsrgan } from './upscale/real-esrgan.mjs';
import { checkGemini, upscaleGemini, inspectGeminiImage, safeError, DEFAULT_GEMINI_MODEL, geminiPrompt } from './upscale/gemini.mjs';
import { resolutionProfile, profileForHeight } from './upscale/resolution.mjs';
import { neuralUpscaleToTarget } from './upscale/neural-target.mjs';
import { normalizeImage } from './upscale/normalize.mjs';
import { comparisonHtml } from './upscale/report.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const SAMPLE_IDS=['living-minimalism-economy','kitchen-industrial-budget','bedroom-scandinavian-premium'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fileHash=async file=>hash(await fs.readFile(file));
export function parseOptions(args=process.argv.slice(2)) {
 const {values}=parseArgs({args,options:{run:{type:'boolean',default:false},resume:{type:'boolean',default:false},output:{type:'string'},methods:{type:'string',default:'both'},model:{type:'string',default:process.env.GEMINI_IMAGE_MODEL||DEFAULT_GEMINI_MODEL},ids:{type:'string'},threads:{type:'string',default:'4'},resolution:{type:'string',default:'1080p'},help:{type:'boolean',default:false}},strict:true});
 if(!['both','realesrgan','gemini'].includes(values.methods))throw new Error('--methods must be both, realesrgan or gemini');
 const resolution=resolutionProfile(values.resolution);
 const ids=values.ids?values.ids.split(','):SAMPLE_IDS;
 if(ids.length!==3||new Set(ids).size!==3)throw new Error('Select exactly three different gallery IDs');
 const threads=Number(values.threads);if(!Number.isInteger(threads)||threads<1||threads>16)throw new Error('--threads must be an integer from 1 to 16');
 if(values.resume&&!values.output)throw new Error('--resume requires --output with a previous comparison folder');
 return {...values,resolution:resolution.id,ids,threads,output:path.resolve(values.output||path.join(os.homedir(),'Downloads','briller-upscale-comparison-'+(resolution.id==='4k'?'4k-':'')+new Date().toISOString().replace(/[:.]/g,'-'))),methods:values.methods==='both'?['realesrgan','gemini']:[values.methods]};
}
async function saveReport(output,report) {
 await fs.writeFile(path.join(output,'comparison.json.tmp'),JSON.stringify(report,null,2)+'\n');
 await fs.rename(path.join(output,'comparison.json.tmp'),path.join(output,'comparison.json'));
 await fs.writeFile(path.join(output,'comparison.html'),comparisonHtml(report));
}
async function writeResult(output,sample,method,bytes,native={}) {
 const profile=profileForHeight(sample.target.height),file=sample.id+'/'+method+'-'+profile.suffix+'.jpg',target=path.join(output,file);
 const normalized=await normalizeImage(bytes,sample.target,{allowEnlarge:method==='baseline'});
 await fs.writeFile(target,normalized.data);
 const {data,...dimensions}=normalized;
 sample.results[method]={status:'complete',file,...dimensions,sha256:await fileHash(target),...native};
}
export async function runComparison(options,{apiKey=(process.env.GEMINI_API_KEY||'').trim(),fetcher=fetch,createLocal=createRealEsrgan,log=console.log}={}) {
 const profile=resolutionProfile(options.resolution);
 const all=await inventory(),items=options.ids.map(id=>all.find(item=>item.id===id));
 if(items.some(item=>!item)||new Set(items.map(item=>item.room)).size!==3)throw new Error('Select three existing gallery items from different room categories');
 const config={model:options.model,height:profile.height,ids:options.ids,promptSha256:hash(geminiPrompt(profile)),realEsrganModelSha256:JSON.parse(await fs.readFile(path.join(root,'tools/upscale/models/realesrgan-general-x4v3-dni030.json'),'utf8')).sha256};
 let report;
 if(options.resume){
  report=JSON.parse(await fs.readFile(path.join(options.output,'comparison.json'),'utf8'));
  if(report.version!==1||JSON.stringify(report.config)!==JSON.stringify(config))throw new Error('Resume settings/model changed. Use a new output folder.');
  for(const sample of report.samples){for(const result of Object.values(sample.results)){if(result.status==='complete'&&await fileHash(path.join(options.output,result.file))!==result.sha256)throw new Error('An existing result was changed; use a new output folder');}}
 }else{
  await fs.mkdir(path.dirname(options.output),{recursive:true});await fs.mkdir(options.output);
  report={version:1,createdAt:new Date().toISOString(),config,samples:[]};
 }
 let local;
 try {
  for(const item of items){
   const input=await fs.readFile(path.join(root,'public',item.detailImage||item.image)),metadata=await sharp(input).metadata(),box=extractionBox(item,metadata);
   let image=sharp(input);if(box)image=image.extract(box);
   const native=await image.removeAlpha().toColourspace('srgb').png().toBuffer(),nativeMetadata=await sharp(native).metadata(),inputHash=hash(native);
   let sample=report.samples.find(s=>s.id===item.id);
   if(sample){if(sample.input.sha256!==inputHash)throw new Error('Gallery source changed; use a new output folder');}
   else {
    const ratio=box?(item.crop.width*metadata.width)/(item.crop.height*metadata.height):metadata.width/metadata.height;
    if(Math.abs(ratio-4/3)>0.001)throw new Error('This comparison expects 4:3 gallery scenes');
    sample={id:item.id,title:item.title.uk,room:item.roomName,style:item.styleName,budget:item.budgetName,input:{width:nativeMetadata.width,height:nativeMetadata.height,sha256:inputHash,source:item.detailImage||item.image,crop:box},target:{width:Math.round(profile.height*ratio),height:profile.height},results:{}};
    await fs.mkdir(path.join(options.output,item.id));
    const file=item.id+'/source.png';await fs.writeFile(path.join(options.output,file),native);
    sample.results.source={status:'complete',file,width:nativeMetadata.width,height:nativeMetadata.height,sha256:inputHash};
    await writeResult(options.output,sample,'baseline',native);
    report.samples.push(sample);
   }
  }
  await fs.writeFile(path.join(options.output,'README.txt'),`Briller — three-image upscale comparison\n\nOpen comparison.html in a browser. Source: original isolated tile, not the old JPEG export. Baseline: ordinary Lanczos resize. Real-ESRGAN: official general x4v3 model, conservative 0.3 denoise, local CPU inference. Target: ${profile.width}×${profile.height}. For 4K small tiles, Real-ESRGAN runs two neural passes with an intermediate reduction; the final result is not a simple enlargement of its first pass. Gemini: one remote image request per scene, ${profile.imageSize} requested; undersized responses or aspect deviations above 1% are rejected. Near-matching frames are fitted without stretching/cropping, with declared neutral padding.\n\nAI outputs can alter small details. Inspect geometry, hardware, textiles and edges before choosing a batch method. File dimensions are not a fidelity guarantee.\n\nCompleted outputs are skipped with --resume. Failed or interrupted Gemini calls are never retried automatically; a manual retry can incur another charge. No API keys are written into these files. Gallery source files are never modified.\n`);
  // Recover usable saved Gemini responses before any API preflight. This also
  // works with --resume WITHOUT --run: no network or paid generation is needed.
  if(options.resume){
   for(const sample of report.samples){
    const old=sample.results.gemini;
    if(old?.status==='complete'||!old?.nativeFile)continue;
    const candidate=path.resolve(options.output,old.nativeFile);
    if(!candidate.startsWith(path.resolve(options.output)+path.sep))throw new Error('Invalid cached native file path');
    try{
     const checked=await inspectGeminiImage(await fs.readFile(candidate),{width:sample.target.width,height:sample.target.height,imageSize:profile.imageSize});
     await writeResult(options.output,sample,'gemini',checked.buffer,{nativeWidth:checked.width,nativeHeight:checked.height,nativeFile:old.nativeFile,aspectDifferencePercent:checked.aspectDifferencePercent,recoveredFromNative:true});
     log(`${sample.id}: reused saved Gemini native image; no API call`);
    }catch(error){sample.results.gemini={...old,status:'error',error:safeError(error,apiKey)};}
   }
  }
  await saveReport(options.output,report);
  if(!options.run){log('Prepared three native crops, Lanczos controls and comparison.html. No AI inference/API calls performed. Add --run to execute the selected methods.');return report;}
  const missing=method=>report.samples.some(s=>s.results[method]?.status!=='complete');
  if(options.methods.includes('gemini')&&missing('gemini'))await checkGemini({apiKey,model:options.model,fetcher});
  if(options.methods.includes('realesrgan')&&missing('realesrgan'))local=await createLocal({threads:options.threads});
  for(const sample of report.samples){
   const png=await fs.readFile(path.join(options.output,sample.results.source.file));
   for(const method of options.methods){
    if(sample.results[method]?.status==='complete'){log(`${sample.id}: ${method} already complete; skipped`);continue;}
    // Persist in-flight status so an interrupted request is never presented as success.
    sample.results[method]={status:'running'};await saveReport(options.output,report);
    const started=Date.now();log(`${sample.id}: ${method}`);
    try {
     let bytes,native={};
     if(method==='realesrgan'){
      const r=await neuralUpscaleToTarget(png,sample.target,local,(pass,done,total)=>{if(done===1||done===total||done%4===0)log(`  Real-ESRGAN pass ${pass}, tiles ${done}/${total}`);});
      bytes=r.buffer;native={nativeWidth:r.width,nativeHeight:r.height,passes:r.passes};
     }else{
      const r=await upscaleGemini(png,{apiKey,model:options.model,width:sample.target.width,height:sample.target.height,imageSize:profile.imageSize,fetcher});bytes=r.buffer;native={nativeWidth:r.width,nativeHeight:r.height,modelVersion:r.modelVersion,usage:r.usage,aspectDifferencePercent:r.aspectDifferencePercent};
     }
     const file=sample.id+'/'+method+'-native.png';await sharp(bytes).png().toFile(path.join(options.output,file));
     await writeResult(options.output,sample,method,bytes,{...native,seconds:Math.round((Date.now()-started)/100)/10,nativeFile:file});
    }catch(error){
     sample.results[method]={status:'error',error:safeError(error,apiKey)};
     if(method==='gemini'&&error.rejectedImage){
      const rejected=error.rejectedImage,file=sample.id+'/gemini-rejected-native.png';
      await sharp(rejected.buffer).png().toFile(path.join(options.output,file));
      Object.assign(sample.results[method],{nativeFile:file,nativeWidth:rejected.width,nativeHeight:rejected.height});
     }
     log(`  ${method}: ${safeError(error,apiKey)}`);
    }
    await saveReport(options.output,report);
   }
  }
  report.finishedAt=new Date().toISOString();await saveReport(options.output,report);
  return report;
 }finally{await local?.close();log('Comparison: '+path.join(options.output,'comparison.html'));}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const options=parseOptions();
  if(options.help)console.log('npm run gallery:compare -- [--run] [--resolution 1080p|4k] [--methods both|realesrgan|gemini] [--output NEW_FOLDER] [--resume] [--model IMAGE_MODEL_ID] [--threads 1–16] [--ids id1,id2,id3]');
  else {const report=await runComparison(options);if(options.run&&report.samples.some(s=>options.methods.some(m=>s.results[m]?.status!=='complete')))process.exitCode=1;}
 }catch(error){console.error(safeError(error,(process.env.GEMINI_API_KEY||'').trim()));process.exitCode=1;}
}
