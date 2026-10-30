import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { inspectGeminiImage } from './gemini.mjs';
import { planBatch, galleryFilename, targetFor, hash } from './batch-plan.mjs';
import { inventory } from '../export-inspiration.mjs';
import { runBatch, parseBatchOptions } from '../upscale-gallery-gemini.mjs';

const key='test-key-not-a-real-credential';
const picture=(width,height)=>sharp({create:{width,height,channels:3,background:'#a1b2b3'}}).png().toBuffer();
const landscape=await picture(4096,3072), square=await picture(4096,4096);
const response=bytes=>new Response(JSON.stringify({modelVersion:'mock-only',candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:bytes.toString('base64')}}]}}],usageMetadata:{totalTokenCount:123}}),{status:200});
const preflight=()=>new Response(JSON.stringify({supportedGenerationMethods:['generateContent']}),{status:200});
async function fixture(t,{count=1,squareInput=false}={}) {
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'briller-batch-'));t.after(()=>fs.rm(temp,{recursive:true,force:true}));
  const input=path.join(temp,'input'),output=path.join(temp,'output');await fs.mkdir(input);
  for(let i=0;i<count;i++)await fs.writeFile(path.join(input,`image-${i}.png`),await picture(80,squareInput && i===count-1?80:60));
  return {...parseBatchOptions(['--input',input,'--output',output,'--delay-ms','0']),run:true};
}
const silent={apiKey:key,log:()=>{}};

test('Gallery plan contains all 258 separate scenes and descriptive filenames with every known attribute',async()=>{
 const entries=await inventory();assert.equal(entries.length,258);
 for(const item of entries){const file=galleryFilename(item);assert.ok(file.includes('__4k.jpg'));assert.ok(file.includes(item.area?item.area+'-sqm':'area-unspecified'));assert.ok(file.includes(item.budgetName?item.budgetName.toLowerCase():'budget-unspecified'));}
 const plan=await planBatch(parseBatchOptions(['--output','/tmp/briller-plan-only']));
 assert.equal(plan.entries.length,258);assert.equal(new Set(plan.entries.map(e=>e.file.toLowerCase())).size,258);
 assert.equal(plan.entries.filter(e=>e.crop).length,249);
 assert.ok(plan.entries.every(e=>Math.max(e.target.width,e.target.height)===4096));
 assert.equal(plan.entries.find(e=>e.attributes.galleryId==='studio').target.aspectRatio,null);
 assert.deepEqual(targetFor(1400,1400),{width:4096,height:4096,aspectRatio:'1:1'});
 assert.ok(plan.entries[0].input.width<600);
});

test('4K folder run preserves names/ratios; same command resumes without another API call',async t=>{
 const options=await fixture(t,{count:2,squareInput:true});const bodies=[];
 const fetcher=async(url,request)=>{if(request?.method!=='POST')return preflight();const body=JSON.parse(request.body);bodies.push(body);assert.ok(!url.includes(key));return response(body.generationConfig.imageConfig.aspectRatio==='1:1'?square:landscape);};
 const job=await runBatch(options,{...silent,fetcher});assert.equal(bodies.length,2);
 assert.ok(job.entries.every(e=>e.status==='complete'));assert.equal(bodies[0].generationConfig.imageConfig.imageSize,'4K');
 assert.equal(job.entries[0].file,'images/image-0__4k.jpg');
 for(const e of job.entries){const metadata=await sharp(path.join(options.output,e.file)).metadata();assert.equal(metadata.width,e.target.width);assert.equal(metadata.height,e.target.height);}
 await runBatch(options,{...silent,fetcher:async()=>{throw Error('Completed requests must not repeat');}});
 const text=await fs.readFile(path.join(options.output,'job.json'),'utf8');assert.ok(!text.includes(key));
 const html=await fs.readFile(path.join(options.output,'report.html'),'utf8');assert.ok(html.includes('id="search"'));assert.ok(html.includes('Native Gemini response'));
 // A completed receipt survives a crash between saving native bytes and updating job.json.
 const saved=JSON.parse(text),entry=saved.entries[0];entry.status='requesting';delete entry.result;delete entry.native;
 await fs.unlink(path.join(options.output,entry.file));await fs.writeFile(path.join(options.output,'job.json'),JSON.stringify(saved));
 const recovered=await runBatch({...options,run:false},{log:()=>{},fetcher:async()=>{throw Error('Recovery needs no API/key');},apiKey:''});
 assert.equal(recovered.entries[0].status,'complete');assert.equal(recovered.entries[0].attempts,1);
});

test('Request limits leave remaining files pending and completed files are skipped',async t=>{
 const options=await fixture(t,{count:2});let calls=0;
 const fetcher=async(url,r)=>{if(r?.method!=='POST')return preflight();calls++;return response(landscape);};
 const first=await runBatch({...options,maxRequests:1},{...silent,fetcher});assert.deepEqual(first.entries.map(e=>e.status),['complete','pending']);assert.equal(calls,1);
 const second=await runBatch(options,{...silent,fetcher});assert.ok(second.entries.every(e=>e.status==='complete'));assert.equal(calls,2);
});

test('Ambiguous network failures stop the batch and cannot automatically repeat a possibly paid request',async t=>{
 const options=await fixture(t,{count:2});let calls=0;
 const fail=async(url,r)=>{if(r?.method!=='POST')return preflight();calls++;throw Error('Timed out '+key);};
 const job=await runBatch(options,{...silent,fetcher:fail});assert.deepEqual(job.entries.map(e=>e.status),['uncertain','pending']);assert.equal(calls,1);assert.ok(!job.entries[0].error.includes(key));
 const resumed=await runBatch(options,{...silent,fetcher:async(url,r)=>{if(r?.method!=='POST')return preflight();calls++;return response(landscape);}});
 assert.deepEqual(resumed.entries.map(e=>e.status),['uncertain','complete']);assert.equal(calls,2);
 const retried=await runBatch({...options,retryFailed:true},{...silent,fetcher:async(url,r)=>r?.method==='POST'?(calls++,response(landscape)):preflight()});
 assert.equal(retried.entries[0].status,'complete');assert.equal(calls,3);assert.equal(retried.entries[0].attempts,2);
});

test('429 stops after one generation request; changing input or model is rejected before requests',async t=>{
 const options=await fixture(t,{count:2});let calls=0;
 const fetcher=async(url,r)=>r?.method==='POST'?(calls++,new Response(JSON.stringify({error:{status:'RESOURCE_EXHAUSTED',message:'Quota'}}),{status:429})):preflight();
 const job=await runBatch(options,{...silent,fetcher});assert.equal(calls,1);assert.deepEqual(job.entries.map(e=>e.status),['error','pending']);
 await assert.rejects(()=>runBatch({...options,model:'different'},{...silent,fetcher}),/Source images, filenames, prompt or model changed/);assert.equal(calls,1);
 await fs.writeFile(path.join(options.input,'image-0.png'),await picture(81,60));
 await assert.rejects(()=>runBatch(options,{...silent,fetcher}),/Source images, filenames, prompt or model changed/);
});

test('Rejected native outputs remain available; explicit relaxed validation can recover without API',async t=>{
 const options=await fixture(t);const slightlyDifferent=await picture(4096,3000);
 const job=await runBatch(options,{...silent,fetcher:async(url,r)=>r?.method==='POST'?response(slightlyDifferent):preflight()});
 assert.equal(job.entries[0].status,'needs_review');assert.ok(job.entries[0].native);assert.ok(!job.entries[0].result);
 const cached=await runBatch({...options,aspectTolerance:.03},{...silent,fetcher:async()=>{throw Error('Must use saved native');}});
 assert.equal(cached.entries[0].status,'complete');assert.ok(cached.entries[0].result.padding.bottom>0);
});

test('Below-4K responses are never ordinarily enlarged; three consecutive rejects stop spending',async t=>{
 const options=await fixture(t,{count:4});const small=await picture(2048,1536);let calls=0;
 const job=await runBatch(options,{...silent,fetcher:async(url,r)=>r?.method==='POST'?(calls++,response(small)):preflight()});
 assert.equal(calls,3);assert.deepEqual(job.entries.map(e=>e.status),['needs_review','needs_review','needs_review','pending']);
 assert.ok(job.entries.slice(0,3).every(e=>e.native&&!e.result));
});

test('Folder collisions, nested outputs, active locks and modified completed files fail safely',async t=>{
 const options=await fixture(t);await assert.rejects(()=>runBatch({...options,output:path.join(options.input,'out')},silent),/outside the input/);
 await fs.writeFile(path.join(options.input,'image-0.jpg'),await picture(80,60));
 await assert.rejects(()=>runBatch(options,silent),/filename collision/);await fs.unlink(path.join(options.input,'image-0.jpg'));
 await fs.mkdir(options.output);await fs.writeFile(path.join(options.output,'.batch.lock'),JSON.stringify({host:os.hostname(),pid:process.pid,token:'other'}));
 await assert.rejects(()=>runBatch(options,silent),/Another batch/);await fs.unlink(path.join(options.output,'.batch.lock'));
 const job=await runBatch(options,{...silent,fetcher:async(url,r)=>r?.method==='POST'?response(landscape):preflight()});
 await fs.writeFile(path.join(options.output,job.entries[0].file),'modified');
 await assert.rejects(()=>runBatch(options,silent),/Completed file was modified/);
});

test('Unsupported ratios omit the API preset; dry run needs no key and no generation',async t=>{
 const options=await fixture(t);await fs.writeFile(path.join(options.input,'image-0.png'),await picture(140,95));
 const prepared=await runBatch({...options,run:false},{apiKey:'',log:()=>{},fetcher:async()=>{throw Error('No API during preparation');}});
 assert.equal(prepared.entries[0].status,'pending');assert.equal(prepared.entries[0].target.aspectRatio,null);
 const plan=JSON.parse(await fs.readFile(path.join(options.output,'job.json'),'utf8'));
 assert.equal(plan.entries[0].sourceHash,hash(await fs.readFile(path.join(options.input,'image-0.png'))));
 assert.throws(()=>parseBatchOptions(['--max-requests','0']),/Invalid/);assert.throws(()=>parseBatchOptions(['--aspect-tolerance','0.9']),/Invalid/);
 assert.throws(()=>parseBatchOptions(['--model','https://example.com']),/model ID/);
});


test('Known eight-frame contact sheets are rejected in folder mode before spending',async t=>{
 const options=await fixture(t),items=await inventory(),sheet=items.find(e=>e.crop&&!e.detailImage);
 await fs.copyFile(path.join(process.cwd(),'public',sheet.image),path.join(options.input,'contact-sheet.webp'));
 await assert.rejects(()=>runBatch(options,{...silent,fetcher:async()=>{throw Error('No API');}}),/contact sheet/);
});

test('A near-ratio response with a long edge below 4096 cannot pass as native 4K',async()=>{
 const below=await picture(4090,3072);
 await assert.rejects(()=>inspectGeminiImage(below,{width:4096,height:3072,imageSize:'4K'}),/below the requested resolution/);
});

test('Ctrl+C-style cancellation checkpoints the active request and leaves remaining images pending',async t=>{
 const options=await fixture(t,{count:2}),abort=new AbortController();
 const job=await runBatch(options,{...silent,signal:abort.signal,fetcher:async(url,r)=>{
  if(r?.method!=='POST')return preflight();abort.abort();throw Error('Aborted');
 }});
 assert.deepEqual(job.entries.map(e=>e.status),['uncertain','pending']);
 assert.equal(job.entries[0].attempts,1);
});
