import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const pages=['','features','use-cases','gallery','pricing','faq','contact','privacy','terms','refunds','cookies'];
const failures=[];let checked=0;
function check(condition,message){if(!condition)failures.push(message);}
for(const locale of ['en','uk'])for(const page of pages){
 const file=path.join('out',locale,page,'index.html');
 check(fs.existsSync(file),`Missing ${file}`);if(!fs.existsSync(file))continue;
 const html=fs.readFileSync(file,'utf8');checked++;
 check(html.includes(`<html lang="${locale}"`),`Wrong HTML language: ${file}`);
 check((html.match(/<h1[ >]/g)||[]).length===1,`Expected one H1: ${file}`);
 check(html.includes('rel="canonical"'),`Missing canonical: ${file}`);
 check(html.includes('hrefLang="uk"')||html.includes('hreflang="uk"'),`Missing UK hreflang: ${file}`);
 check(html.includes('name="description"'),`Missing description: ${file}`);
 check(html.includes('https://build.briller.house'),`Missing app CTA: ${file}`);
 if(process.env.BRILLER_PREVIEW==='1'||['privacy','terms','refunds','cookies'].includes(page))check(html.includes('noindex'),`Non-public page indexed: ${file}`);
 else check(!html.includes('content="noindex'),`Production marketing page has noindex: ${file}`);
 for(const m of html.matchAll(/(?:href|src)="(\/[^"?#]*)/g)){
  const url=m[1];if(url.startsWith('//'))continue;
  const target=path.join('out',decodeURIComponent(url));
  const exists=fs.existsSync(target)||fs.existsSync(path.join(target,'index.html'));
  check(exists,`Broken local URL ${url} on ${file}`);
 }
 for(const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)){
  try{const data=JSON.parse(m[1]);check(data['@context']==='https://schema.org',`Invalid schema context ${file}`)}catch{failures.push(`Invalid JSON-LD ${file}`)}
 }
}
const plans=JSON.parse(fs.readFileSync('content/plans.json'));
assert.equal(plans.plans[2].monthly,24.99);assert.equal(plans.plans[3].credits,650);assert.equal(plans.topups[4][2],750);
check(fs.readFileSync('out/sitemap.xml','utf8').includes('/uk/pricing/'),'Missing translated pricing in sitemap');
check(!fs.readFileSync('out/sitemap.xml','utf8').includes('/privacy/'),'Draft legal page in sitemap');
check(fs.existsSync('out/robots.txt')&&fs.existsSync('out/llms.txt'),'Missing crawler files');
for(const img of JSON.parse(fs.readFileSync('content/gallery.json')))check(fs.statSync(path.join('public',img.image)).size>10000,`Invalid image ${img.image}`);
if(failures.length){console.error([...new Set(failures)].join('\n'));process.exit(1)}
console.log(`PASS: ${checked} localized pages, local links/assets, H1, metadata, HTML languages, JSON-LD, legal noindex and pricing data.`);
