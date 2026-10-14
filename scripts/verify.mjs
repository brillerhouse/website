import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const solutions=JSON.parse(fs.readFileSync('content/solutions/en.json','utf8')).pages;
const pages=['','features','use-cases','gallery','pricing','faq','contact','privacy','terms','refunds','cookies','solutions',...solutions.map(page=>'solutions/'+page.slug)];
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
 check(html.includes('class="footer-cookie-settings"')&&html.includes('class="cookie-dialog"'),`Missing consent settings: ${file}`);
 check(!html.includes('<script src="https://www.googletagmanager.com')&&!html.includes('<script src="https://connect.facebook.net'),`Tracker included before client consent: ${file}`);
 check(!/<header[\s\S]*?class="locale"[\s\S]*?<\/header>/.test(html),`Language control still in header: ${file}`);
 const footerLanguage=html.match(/<nav class="footer-languages"[^>]*>([\s\S]*?)<\/nav>/)?.[1]||'';
 for(const language of ['en','uk'])check(footerLanguage.includes(`href="/${language}/${page?page+'/':''}"`),`Footer language loses page: ${file}/${language}`);
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
const ukSolutions=JSON.parse(fs.readFileSync('content/solutions/uk.json','utf8')).pages;
assert.equal(solutions.length,27,'All supplied solution pages must be included');
assert.deepEqual(ukSolutions.map(page=>page.slug),solutions.map(page=>page.slug),'Localized solution slugs must match');
const navigation=JSON.parse(fs.readFileSync('content/solutions/navigation.json','utf8'));
for(const solution of solutions){
 check(navigation.categories.some(category=>category.id===solution.category),`Unknown category: ${solution.slug}`);
 check(solution.audiences.every(role=>navigation.audiences.some(audience=>audience.id===role)),`Unknown audience: ${solution.slug}`);
 check(solution.related.every(slug=>solutions.some(page=>page.slug===slug)&&slug!==solution.slug),`Broken related solution: ${solution.slug}`);
 for(const locale of ['en','uk']){
  const hub=fs.readFileSync(`out/${locale}/solutions/index.html`,'utf8');
  check(hub.includes(`href="/${locale}/solutions/${solution.slug}/"`),`Solution absent from hub: ${locale}/${solution.slug}`);
  check(fs.readFileSync('out/sitemap.xml','utf8').includes(`/${locale}/solutions/${solution.slug}/`),`Solution absent from sitemap: ${locale}/${solution.slug}`);
 }
}
const plans=JSON.parse(fs.readFileSync('content/plans.json'));
assert.deepEqual(plans.plans.map(plan=>plan.commercial),[false,true,true,true]);
assert.deepEqual(plans.plans.map(plan=>plan.pdf),[false,false,true,true]);
assert.deepEqual(plans.plans.map(plan=>plan.fastQueue),[false,false,true,true]);
assert.deepEqual(plans.plans.map(plan=>plan.sharedProjects),[false,false,false,true]);
assert.equal(plans.plans[2].monthly,24.99);assert.equal(plans.plans[3].credits,650);assert.equal(plans.topups[4][2],750);
check(fs.readFileSync('out/sitemap.xml','utf8').includes('/uk/pricing/'),'Missing translated pricing in sitemap');
check(!fs.readFileSync('out/sitemap.xml','utf8').includes('/privacy/'),'Draft legal page in sitemap');
check(fs.existsSync('out/robots.txt')&&fs.existsSync('out/llms.txt'),'Missing crawler files');
for(const img of JSON.parse(fs.readFileSync('content/gallery.json')))check(fs.statSync(path.join('public',img.image)).size>10000,`Invalid image ${img.image}`);
if(failures.length){console.error([...new Set(failures)].join('\n'));process.exit(1)}
console.log(`PASS: ${checked} localized pages, local links/assets, H1, metadata, HTML languages, JSON-LD, legal noindex and pricing data.`);
