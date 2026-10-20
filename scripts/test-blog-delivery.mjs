// Only invoked with an explicitly authorized recipient via workflow input.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const response = await fetch(process.argv[2] + '/checklist', {
  method: 'POST', headers: { Origin: 'https://briller.house', 'Content-Type': 'application/json' },
  body: JSON.stringify({name:'Briller test', email:process.env.TEST_EMAIL, consent:true, website:'', startedAt:Date.now()-2000, requestId:randomUUID(), resource:'builder-checklist',source:'how-to-read-an-ai-render-before-you-build'}),
  signal: AbortSignal.timeout(25000)
});
assert.equal(response.status,200,'Live contact storage must succeed');
const result=await response.json();
assert.equal(result.downloadUrl,'/downloads/briller-builder-checklist-letter.pdf');
assert.equal(result.emailSent,true,'Brevo must accept the requested email');
console.log('::notice title=Resource delivery test::Contact stored and one authorized test email accepted by Brevo. Inbox receipt still needs recipient confirmation.');
