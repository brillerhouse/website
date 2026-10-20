import assert from 'node:assert/strict';
const base = process.argv[2], configured = process.argv[3] === 'true';
let health, healthStatus;
for(let attempt=0;attempt<15;attempt++){
  try{const r=await fetch(base+'/health',{signal:AbortSignal.timeout(3000)});healthStatus=r.status;if(r.ok){health=await r.json();break;}}catch{}
  await new Promise(resolve=>setTimeout(resolve,500));
}
assert.equal(health?.ok,true,`Service must be healthy (HTTP ${healthStatus ?? 'unreachable'})`);
assert.equal(health.deliveryConfigured,configured,'Credential settings presence');
const headers={Origin:'https://briller.house','Content-Type':'application/json'};
const options=await fetch(base+'/checklist',{method:'OPTIONS',headers});assert.equal(options.status,204);assert.equal(options.headers.get('access-control-allow-origin'),'https://briller.house');
const invalid=await fetch(base+'/checklist',{method:'POST',headers,body:JSON.stringify({consent:false})});assert.equal(invalid.status,configured?400:503);assert.equal((await invalid.json()).downloadUrl,undefined);
const rejected=await fetch(base+'/checklist',{method:'OPTIONS',headers:{Origin:'https://unrelated.example'}});assert.equal(rejected.status,403);
console.log('PASS: health, configuration status, restricted CORS and invalid requests; no contacts or emails sent.');
