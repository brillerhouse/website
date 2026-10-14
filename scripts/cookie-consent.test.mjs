import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

function compile(file, scope = {}) {
  const { outputText } = ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const context = { exports: {}, ...scope };
  vm.runInNewContext(outputText, context);
  return context.exports;
}
const rules = compile('lib/cookie-consent.ts');
const { makeConsent, parseConsent, readConsent, allowedTracking, CONSENT_COOKIE, CONSENT_DURATION, withdrawal, optionalCookie } = rules;
const config = { googleAnalyticsId: 'G-TEST123', metaPixelId: '123456789012345' };
function page() {
  const scripts = new Map(), cookies = new Map([['_ga','old'],['_ga_TEST','old'],['_fbp','old'],['_fbc','old'],['briller_language','uk']]);
  const document = { referrer: 'https://example.org/search/?email=private#part',
    getElementById: id => scripts.get(id),
    createElement: () => ({ remove() { scripts.delete(this.id); } }),
    head: { appendChild(script) { scripts.set(script.id,script); } }
  };
  Object.defineProperty(document,'cookie',{ get:()=>[...cookies].map(([k,v])=>k+'='+v).join('; '), set:value=>{const [pair]=value.split(';');const [name,...parts]=pair.split('=');if(value.includes('Max-Age=0'))cookies.delete(name);else cookies.set(name,parts.join('='));}});
  const window = {};
  const tracking = compile('lib/tracking.ts',{ require:id=>{assert.equal(id,'./cookie-consent');return rules;}, window, document, location:{hostname:'briller.house',protocol:'https:',origin:'https://briller.house',pathname:'/en/solutions/'}, URL });
  return {window,document,scripts,cookies,tracking};
}
test('optional trackers fail closed before consent and while IDs are unconfigured',()=>{
  assert.equal(allowedTracking(null,config).analytics,false);
  assert.equal(allowedTracking(null,config).marketing,false);
  const choice=makeConsent(true,true,100);
  assert.equal(allowedTracking(choice,{googleAnalyticsId:'',metaPixelId:''}).analytics,false);
  assert.equal(allowedTracking(choice,{googleAnalyticsId:'',metaPixelId:''}).marketing,false);
  const p=page();p.tracking.applyTracking(null,config);assert.equal(p.scripts.size,0);
  p.tracking.applyTracking(choice,{googleAnalyticsId:'',metaPixelId:''});assert.equal(p.scripts.size,0);
});
test('analytics and advertising consent work independently',()=>{
  const analytics=page();analytics.tracking.applyTracking(makeConsent(true,false,100),config);
  assert.equal(analytics.scripts.size,1);assert(analytics.scripts.has('briller-google-analytics'));assert(!analytics.window.fbq);
  const meta=page();meta.tracking.applyTracking(makeConsent(false,true,100),config);
  assert.equal(meta.scripts.size,1);assert(meta.scripts.has('briller-meta-pixel'));assert(!meta.window.gtag);
});
test('repeated initialization does not duplicate scripts or PageView events',()=>{
  const p=page(), choice=makeConsent(true,true,100);
  p.tracking.applyTracking(choice,config);p.tracking.applyTracking(choice,config);
  assert.equal(p.scripts.size,2);
  assert.equal(p.window.dataLayer.filter(args=>args[0]==='config').length,1);
  assert.equal(p.window.fbq.queue.filter(args=>args[0]==='track'&&args[1]==='PageView').length,1);
  const params=p.window.dataLayer.find(args=>args[0]==='config')[2];
  assert.equal(params.page_location,'https://briller.house/en/solutions/');
  assert.equal(params.page_referrer,'https://example.org/search/');
  assert.equal(params.allow_google_signals,false);assert.equal(params.allow_ad_personalization_signals,false);
  assert(p.window.fbq.queue.some(args=>args[0]==='set'&&args[1]==='autoConfig'&&args[2]===false));
});
test('withdrawal disables integrations and clears optional first-party cookies only',()=>{
  const p=page();p.tracking.applyTracking(makeConsent(true,true,100),config);
  p.tracking.applyTracking(makeConsent(false,false,100),config);
  assert.equal(p.window['ga-disable-G-TEST123'],true);
  assert(p.window.fbq.queue.some(args=>args[0]==='consent'&&args[1]==='revoke'));
  assert.equal(p.scripts.size,0);
  assert.equal(p.cookies.has('_ga'),false);assert.equal(p.cookies.has('_ga_TEST'),false);assert.equal(p.cookies.has('_fbp'),false);assert.equal(p.cookies.has('_fbc'),false);
  assert.equal(p.cookies.get('briller_language'),'uk');
  assert.equal(withdrawal(makeConsent(true,false,100),makeConsent(false,false,101)),true);
  assert.equal(withdrawal(makeConsent(false,false,100),makeConsent(true,false,101)),false);
});
test('expired, malformed, invalid-version and future consent records are rejected',()=>{
  const now=CONSENT_DURATION+1000;
  assert.equal(parseConsent(JSON.stringify(makeConsent(true,true,now-CONSENT_DURATION)),now),null);
  assert.equal(parseConsent(JSON.stringify(makeConsent(true,true,now+1)),now),null);
  for(const value of ['bad','null','{"version":2,"analytics":true,"marketing":true,"savedAt":1}','{"version":1,"analytics":"true","marketing":true,"savedAt":1}'])assert.equal(parseConsent(value,now),null);
});
test('cookie record recovers a valid choice if local storage is unavailable',()=>{
  const choice=makeConsent(false,true,100), cookie=CONSENT_COOKIE+'='+encodeURIComponent(JSON.stringify(choice));
  assert.equal(readConsent(null,cookie,101).marketing,true);assert.equal(readConsent(null,cookie,101).analytics,false);
  assert.equal(readConsent(null,CONSENT_COOKIE+'=%invalid',101),null);
  assert.equal(optionalCookie('briller_cookie_consent','analytics'),false);
  assert.equal(optionalCookie('_fbp','marketing'),true);
});
