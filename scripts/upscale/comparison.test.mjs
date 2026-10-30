import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { runtimeDirectory } from '../../tools/upscale/runtime.mjs';
import { checkGemini, upscaleGemini } from './gemini.mjs';
import { runComparison, parseOptions, SAMPLE_IDS } from '../compare-gallery-upscale.mjs';

const key='fake-private-test-key';
const input=await sharp({create:{width:499,height:374,channels:3,background:'#728b8f'}}).png().toBuffer();
const large=await sharp({create:{width:2048,height:1536,channels:3,background:'#728b8f'}}).png().toBuffer();
const response=(image=large)=>new Response(JSON.stringify({modelVersion:'test-image-model',candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:image.toString('base64')}}]}}],usageMetadata:{totalTokenCount:123}}),{status:200,headers:{'Content-Type':'application/json'}});

test('Gemini sends only the native crop, requests 2K and keeps the key out of the URL/body',async()=>{
 let call;
 const output=await upscaleGemini(input,{apiKey:key,model:'test-image-model',fetcher:async(url,options)=>{call={url,options};return response();}});
 assert.equal(output.width,2048);assert.equal(output.height,1536);
 assert.ok(!call.url.includes(key));assert.equal(call.options.headers['x-goog-api-key'],key);
 const data=JSON.parse(call.options.body);assert.equal(data.generationConfig.imageConfig.imageSize,'2K');
 assert.equal(data.generationConfig.imageConfig.aspectRatio,'4:3');
 assert.equal(data.contents[0].parts[1].inlineData.data,input.toString('base64'));
 assert.ok(!call.options.body.includes(key));assert.equal(call.options.redirect,'error');
});
test('Low-resolution and changed-framing Gemini responses are rejected rather than silently resized',async()=>{
 const small=await sharp({create:{width:1024,height:768,channels:3,background:'white'}}).png().toBuffer();
 const wide=await sharp({create:{width:1920,height:1080,channels:3,background:'white'}}).png().toBuffer();
 await assert.rejects(()=>upscaleGemini(input,{apiKey:key,model:'test',fetcher:async()=>response(small)}),/below the requested resolution/);
 await assert.rejects(()=>upscaleGemini(input,{apiKey:key,model:'test',fetcher:async()=>response(wide)}),/changed the aspect ratio/);
});
test('Blocked/text-only results and provider errors never look like completed images or expose the key',async()=>{
 await assert.rejects(()=>upscaleGemini(input,{apiKey:key,model:'test',fetcher:async()=>new Response(JSON.stringify({promptFeedback:{blockReason:'SAFETY'}}),{status:200})}),/0 images/);
 try{
  await checkGemini({apiKey:key,model:'test',fetcher:async()=>new Response(JSON.stringify({error:{status:'PERMISSION_DENIED',message:'Denied '+key}}),{status:403})});assert.fail('Should reject');
 }catch(error){assert.ok(!error.message.includes(key));assert.match(error.message,/PERMISSION_DENIED/);}
 let requested=false;
 await assert.rejects(()=>upscaleGemini(input,{apiKey:key,model:'https://unrelated.example/image',fetcher:async()=>{requested=true;return response();}}),/model ID/);
 assert.equal(requested,false);
});
test('Three-scene prepare/run/resume preserves native inputs and never repeats completed paid requests',async t=>{
 const parent=await fs.mkdtemp(path.join(os.tmpdir(),'briller-upscale-test-'));t.after(()=>fs.rm(parent,{recursive:true,force:true}));
 const output=path.join(parent,'comparison');let requests=0;
 const options={...parseOptions(['--output',output,'--methods','gemini']),run:false};
 const fetcher=async(url,options)=>{
  if(options?.method==='POST'){requests++;return response();}
  return new Response(JSON.stringify({supportedGenerationMethods:['generateContent']}),{status:200});
 };
 const prepared=await runComparison(options,{apiKey:key,fetcher,log:()=>{}});
 assert.equal(prepared.samples.length,3);assert.equal(new Set(prepared.samples.map(s=>s.room)).size,3);assert.equal(requests,0);
 assert.ok(prepared.samples.every(s=>s.input.width<600&&s.input.height<450));
 const completed=await runComparison({...options,run:true,resume:true},{apiKey:key,fetcher,log:()=>{}});
 assert.equal(requests,3);
 for(const sample of completed.samples){assert.equal(sample.results.gemini.status,'complete');assert.equal(sample.results.gemini.nativeHeight,1536);assert.equal(sample.results.gemini.height,1080);}
 await runComparison({...options,run:true,resume:true},{apiKey:key,fetcher:async()=>{throw new Error('No completed calls should repeat');},log:()=>{}});
 assert.equal(requests,3);
 const html=await fs.readFile(path.join(output,'comparison.html'),'utf8'),json=await fs.readFile(path.join(output,'comparison.json'),'utf8');
 assert.ok(!html.includes(key)&&!json.includes(key));assert.ok(html.includes('data-divider')&&html.includes('data-zoom'));
 await assert.rejects(()=>runComparison({...options,run:true,resume:true,model:'different-model'},{apiKey:key,fetcher,log:()=>{}}),/settings\/model changed/);
});
test('Failed Gemini calls remain errors; an explicit resume is required to retry them',async t=>{
 const parent=await fs.mkdtemp(path.join(os.tmpdir(),'briller-upscale-failure-'));t.after(()=>fs.rm(parent,{recursive:true,force:true}));
 const options={...parseOptions(['--output',path.join(parent,'comparison'),'--methods','gemini']),run:true};let calls=0;
 const report=await runComparison(options,{apiKey:key,fetcher:async(url,request)=>{
  if(request?.method==='POST'){calls++;return new Response(JSON.stringify({error:{status:'RESOURCE_EXHAUSTED',message:key+' quota'}}),{status:429});}
  return new Response(JSON.stringify({supportedGenerationMethods:['generateContent']}),{status:200});
 },log:()=>{}});
 assert.equal(calls,3);assert.ok(report.samples.every(s=>s.results.gemini.status==='error'&&!s.results.gemini.error.includes(key)));
 assert.ok(report.samples.every(s=>!s.results.gemini.file));
});
test('CLI enforces three distinct samples and explicit resume folders',()=>{
 assert.deepEqual(parseOptions([]).ids,SAMPLE_IDS);
 assert.throws(()=>parseOptions(['--resume']),/requires --output/);
 assert.throws(()=>parseOptions(['--ids','one,one,one']),/three different/);
 assert.throws(()=>parseOptions(['--threads','0']),/threads/);
});

test('The installer chooses a compatible native runtime on Intel/older macOS',()=>{
 assert.ok(runtimeDirectory('darwin','21.6.0').endsWith('legacy'));
 assert.ok(runtimeDirectory('darwin','22.4.0').endsWith('legacy'));
 assert.ok(!runtimeDirectory('darwin','22.5.0').endsWith('legacy'));
 assert.ok(!runtimeDirectory('linux','6.1.0').endsWith('legacy'));
 assert.throws(()=>runtimeDirectory('darwin','19.6.0'),/macOS 11/);
});

test('A paid but undersized Gemini image is retained for inspection and never labeled 1080p success',async t=>{
 const parent=await fs.mkdtemp(path.join(os.tmpdir(),'briller-upscale-native-'));t.after(()=>fs.rm(parent,{recursive:true,force:true}));
 const small=await sharp({create:{width:1024,height:768,channels:3,background:'white'}}).png().toBuffer();
 const options={...parseOptions(['--output',path.join(parent,'comparison'),'--methods','gemini']),run:true};
 const report=await runComparison(options,{apiKey:key,fetcher:async(url,request)=>request?.method==='POST'?response(small):new Response(JSON.stringify({supportedGenerationMethods:['generateContent']}),{status:200}),log:()=>{}});
 for(const sample of report.samples){
  const result=sample.results.gemini;assert.equal(result.status,'error');assert.equal(result.nativeHeight,768);assert.ok(!result.file);
  const m=await sharp(path.join(options.output,result.nativeFile)).metadata();assert.equal(m.height,768);
 }
 assert.ok((await fs.readFile(path.join(options.output,'comparison.html'),'utf8')).includes('Переглянути нативну відповідь'));
});
