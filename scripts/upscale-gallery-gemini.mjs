import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { DEFAULT_GEMINI_MODEL, checkGemini, upscaleGemini, inspectGeminiImage, safeError } from './upscale/gemini.mjs';
import { planBatch, sourceImage, hash } from './upscale/batch-plan.mjs';
import { normalizeImage } from './upscale/normalize.mjs';
import { writeBatchReports } from './upscale/batch-report.mjs';

async function exists(file) {try {await fs.access(file);return true;}catch(error){if(error.code==='ENOENT')return false;throw error;}}
async function atomicJson(file,value) {
  const temp=file+'.tmp-'+randomUUID();
  await fs.writeFile(temp,JSON.stringify(value,null,2)+'\n');
  await fs.rename(temp,file);
}
async function lockOutput(output) {
  const file=path.join(output,'.batch.lock'), token=randomUUID();
  for(let attempt=0;attempt<2;attempt++) {
    try {await fs.writeFile(file,JSON.stringify({pid:process.pid,host:os.hostname(),token}),{flag:'wx'});return async()=>{const lock=JSON.parse(await fs.readFile(file,'utf8'));if(lock.token===token)await fs.unlink(file);};}
    catch(error) {
      if(error.code!=='EEXIST')throw error;
      const lock=JSON.parse(await fs.readFile(file,'utf8'));
      if(lock.host!==os.hostname() || !Number.isSafeInteger(lock.pid) || lock.pid<=0)throw new Error('Output is locked by another host/process. Check .batch.lock before removing it manually.');
      try {process.kill(lock.pid,0);throw new Error('Another batch is using this output (PID '+lock.pid+')');}
      catch(error){if(error.code!=='ESRCH')throw error;await fs.unlink(file);}
    }
  }
  throw new Error('Could not lock output');
}
function nativeDirectory(entry) {return path.posix.join('native',entry.id,'attempt-'+String(entry.attempts).padStart(3,'0'));}
async function saveNative(output,entry,response) {
  const directory=nativeDirectory(entry), destination=path.join(output,directory), temp=destination+'.tmp-'+randomUUID();
  await fs.mkdir(temp,{recursive:true});
  const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[response.mime] || 'png';
  const file='image.'+ext;
  await fs.writeFile(path.join(temp,file),response.buffer);
  await fs.writeFile(path.join(temp,'receipt.json'),JSON.stringify({requestHash:entry.requestHash,sha256:hash(response.buffer),file,width:response.width,height:response.height,modelVersion:response.modelVersion,usage:response.usage,receivedAt:new Date().toISOString()},null,2));
  await fs.rename(temp,destination);
}
async function recoverNative(output,entry,tolerance) {
  if(!entry.attempts)return false;
  const directory=nativeDirectory(entry), receiptFile=path.join(output,directory,'receipt.json');
  if(!await exists(receiptFile))return false;
  const receipt=JSON.parse(await fs.readFile(receiptFile,'utf8'));
  if(receipt.requestHash!==entry.requestHash || !/^image\.(png|jpg|webp)$/.test(receipt.file))throw new Error('Native receipt mismatch: '+entry.id);
  const native=path.posix.join(directory,receipt.file), bytes=await fs.readFile(path.join(output,native));
  if(hash(bytes)!==receipt.sha256)throw new Error('Native response checksum mismatch: '+entry.id);
  entry.native=native;entry.nativeMetadata=receipt;
  let checked;
  try {checked=await inspectGeminiImage(bytes,{...entry.target,imageSize:'4K',aspectTolerance:tolerance});}
  catch(error){entry.status='needs_review';entry.error=safeError(error);delete entry.result;return true;}
  const normalized=await normalizeImage(bytes,entry.target), destination=path.join(output,entry.file);
  await fs.mkdir(path.dirname(destination),{recursive:true});
  const temp=destination+'.tmp-'+randomUUID();await fs.writeFile(temp,normalized.data);await fs.rename(temp,destination);
  const {data,...dimensions}=normalized;
  entry.result={...dimensions,sha256:hash(data),aspectDifferencePercent:checked.aspectDifferencePercent};
  entry.status='complete';delete entry.error;return true;
}
export function parseBatchOptions(args) {
  const options={output:path.join(os.homedir(),'Downloads','briller-inspiration-gemini-4k'),model:process.env.GEMINI_IMAGE_MODEL || DEFAULT_GEMINI_MODEL,run:false,retryFailed:false,maxRequests:Infinity,delayMs:2000,aspectTolerance:.01};
  const values={'--input':'input','--output':'output','--model':'model','--max-requests':'maxRequests','--delay-ms':'delayMs','--aspect-tolerance':'aspectTolerance'};
  for(let i=0;i<args.length;i++) {
    const arg=args[i];
    if(arg==='--run')options.run=true;
    else if(arg==='--retry-failed')options.retryFailed=true;
    else if(arg==='--resume')continue; // Same-output runs always resume safely.
    else if(values[arg] && args[i+1] && !args[i+1].startsWith('--'))options[values[arg]]=args[++i];
    else throw new Error('Usage: npm run gallery:upscale:gemini -- [--run] [--input FOLDER] [--output FOLDER] [--model ID] [--max-requests N] [--delay-ms N] [--retry-failed] [--aspect-tolerance 0.01]');
  }
  for(const key of ['maxRequests','delayMs','aspectTolerance'])options[key]=Number(options[key]);
  if((options.maxRequests!==Infinity && (!Number.isInteger(options.maxRequests)||options.maxRequests<1)) || !Number.isInteger(options.delayMs)||options.delayMs<0||options.delayMs>60000||!Number.isFinite(options.aspectTolerance)||options.aspectTolerance<0||options.aspectTolerance>.05)throw new Error('Invalid request limit, delay (0–60000 ms), or aspect tolerance (0–0.05)');
  if(!/^[a-zA-Z0-9._-]+$/.test(options.model))throw new Error('Use a Gemini model ID, not a URL');
  options.output=path.resolve(options.output);if(options.input)options.input=path.resolve(options.input);
  return options;
}
export async function runBatch(options,{apiKey=process.env.GEMINI_API_KEY,fetcher=fetch,log=console.log,signal}={}) {
  const plan=await planBatch(options);
  await fs.mkdir(options.output,{recursive:true});
  const unlock=await lockOutput(options.output), jobFile=path.join(options.output,'job.json');
  let job;
  try {
    if(await exists(jobFile)) {
      job=JSON.parse(await fs.readFile(jobFile,'utf8'));
      if(job.kind!==plan.kind || job.fingerprint!==plan.fingerprint)throw new Error('Source images, filenames, prompt or model changed. Use a new --output folder; existing work is preserved.');
    } else {
      const files=(await fs.readdir(options.output)).filter(f=>f!=='.batch.lock');
      if(files.length)throw new Error('Output is not an empty batch folder; choose a new --output');
      job={...plan,createdAt:new Date().toISOString(),entries:plan.entries.map(e=>({...e,status:'pending',attempts:0}))};
    }
    const checkpoint=async()=>{job.updatedAt=new Date().toISOString();await atomicJson(jobFile,job);};
    const report=async()=>{await checkpoint();await writeBatchReports(options.output,job);};
    // Recover saved responses first. This does not need a key or a paid request.
    for(const entry of job.entries) {
      if(entry.status==='complete' && await exists(path.join(options.output,entry.file))) {
        if(hash(await fs.readFile(path.join(options.output,entry.file)))!==entry.result.sha256)throw new Error('Completed file was modified: '+entry.file+'. Move it aside to recover the saved native response.');
        continue;
      }
      if(await recoverNative(options.output,entry,options.aspectTolerance))continue;
      if(['requesting','received','complete'].includes(entry.status)) {entry.status='uncertain';entry.error='No durable native response was found. A previous request may have been charged. Retry only with --retry-failed.';}
    }
    await report();
    const eligible=job.entries.filter(e=>e.status==='pending' || (options.retryFailed && ['error','uncertain','needs_review'].includes(e.status)));
    log(`Planned ${job.entries.length} images; ${job.entries.filter(e=>e.status==='complete').length} complete; ${eligible.length} eligible. Output: ${options.output}`);
    if(!options.run || !eligible.length || signal?.aborted) {log('No generation requests made. Add --run to process eligible images.');return job;}
    await checkGemini({apiKey,model:options.model,fetcher});
    let requests=0,consecutiveReview=0;
    for(const entry of eligible) {
      if(requests>=options.maxRequests || signal?.aborted)break;
      if(requests && options.delayMs) {try {await delay(options.delayMs,undefined,{signal});}catch(error){if(signal?.aborted)break;throw error;}}
      const png=await sourceImage(entry);
      entry.inputFile=path.posix.join('inputs',entry.id+'.png');
      await fs.mkdir(path.join(options.output,'inputs'),{recursive:true});await fs.writeFile(path.join(options.output,entry.inputFile),png);
      entry.attempts++;entry.status='requesting';delete entry.error;delete entry.result;delete entry.native;delete entry.nativeMetadata;
      await checkpoint();requests++;
      log(`Request ${requests}: ${entry.file}`);
      let response;
      try {response=await upscaleGemini(png,{apiKey,model:options.model,...entry.target,imageSize:'4K',aspectTolerance:options.aspectTolerance,signal,fetcher});}
      catch(error) {
        if(error.rejectedImage)response=error.rejectedImage;
        else {
          entry.status=error.generationRejected?'needs_review':error.httpStatus && error.httpStatus<500?'error':'uncertain';
          entry.error=safeError(error,apiKey);await report();log(entry.status+': '+entry.error);
          if(entry.status!=='needs_review')break;
          consecutiveReview++;if(consecutiveReview>=3){log('Stopped after 3 consecutive rejected outputs. Inspect report.html before retrying.');break;}continue;
        }
      }
      // A complete receipt directory can be recovered even if the process dies before checkpointing.
      await saveNative(options.output,entry,response);
      entry.status='received';await checkpoint();
      await recoverNative(options.output,entry,options.aspectTolerance);
      await report();log(entry.status+': '+entry.file);
      consecutiveReview=entry.status==='needs_review'?consecutiveReview+1:0;
      if(consecutiveReview>=3){log('Stopped after 3 consecutive rejected outputs. Inspect report.html before retrying.');break;}
    }
    await report();
    log(`Finished this run: ${job.entries.filter(e=>e.status==='complete').length}/${job.entries.length} complete. Review ${path.join(options.output,'report.html')}`);
    return job;
  } finally {await unlock();}
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const abort=new AbortController();
  const stop=()=>{console.error('Stopping; saving the current request state.');abort.abort();};
  process.once('SIGINT',stop);process.once('SIGTERM',stop);
  try {
    const job=await runBatch(parseBatchOptions(process.argv.slice(2)),{signal:abort.signal});
    if(job.entries.some(e=>['error','uncertain','needs_review'].includes(e.status)))process.exitCode=2;
    if(abort.signal.aborted)process.exitCode=130;
  } catch(error){console.error(safeError(error,process.env.GEMINI_API_KEY));process.exitCode=1;}
  finally {process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);}
}
