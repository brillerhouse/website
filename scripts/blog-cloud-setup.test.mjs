import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
for (const existing of [false, true]) test(`Cloud setup ${existing?'preserves existing':'creates missing'} resources without exposing secret input`, () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'briller-cloud-setup-'));
  try {
    const mock=`#!/usr/bin/env python3
import sys,os,json
args=sys.argv[1:]
with open(os.environ['BRILLER_TEST_CALLS'],'a') as f:f.write(json.dumps(args)+'\\n')
existing=os.environ['BRILLER_TEST_EXISTING']=='1'
if args[:3]==['iam','service-accounts','list'] and existing:print('briller-blog-leads-runtime@nifty-atlas-473013-f9.iam.gserviceaccount.com')
if args[:2]==['secrets','list'] and existing:print('briller-blog-leads-brevo-api-key')
if args[:3]==['secrets','versions','list'] and existing:print('1')
if args[:3]==['secrets','versions','add']:
 assert sys.stdin.read()=='fake-private-test-input'
 print('Created version 1 of the resource secret.')
`;
    fs.writeFileSync(path.join(dir,'gcloud'),mock,{mode:0o700});
    const callsFile=path.join(dir,'calls.jsonl');
    const r=spawnSync('bash',['deployment/setup-blog-leads.sh'],{encoding:'utf8',input:existing?'':'fake-private-test-input\n',env:{...process.env,PATH:dir+path.delimiter+process.env.PATH,BRILLER_TEST_CALLS:callsFile,BRILLER_TEST_EXISTING:existing?'1':'0'}});
    assert.equal(r.status,0,r.stderr);assert.ok(!r.stdout.includes('fake-private-test-input')&&!r.stderr.includes('fake-private-test-input'));
    const calls=fs.readFileSync(callsFile,'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(calls.filter(c=>c.slice(0,3).join(' ')==='secrets versions add').length,existing?0:1);
    assert.equal(calls.filter(c=>c.slice(0,3).join(' ')==='iam service-accounts create').length,existing?0:1);
    assert.ok(!calls.some(c=>c.slice(0,2).join(' ')==='projects add-iam-policy-binding'));
    const accessor=calls.find(c=>c.includes('--role=roles/secretmanager.secretAccessor'));
    assert.ok(accessor.includes('--member=serviceAccount:briller-blog-leads-runtime@nifty-atlas-473013-f9.iam.gserviceaccount.com'));
    assert.ok(calls.some(c=>c.includes('--role=roles/secretmanager.viewer')&&c.includes('--member=serviceAccount:briller-dev-deployer@nifty-atlas-473013-f9.iam.gserviceaccount.com')));
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
