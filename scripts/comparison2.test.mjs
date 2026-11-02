import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const original=json('content/compare/catalog.json').products;
const editorial=json('content/comparison2/articles.json').products;
const labels=json('content/comparison2/ui.json');
const plans=json('content/plans.json').plans;
const markup=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
const forbidden=/desk-based reviews|controlled speed|image-quality benchmarks|public login wall|not yet verified|review in progress/i;
const money=(n,locale)=>new Intl.NumberFormat(locale==='uk'?'uk-UA':'en-US',{style:'currency',currency:'USD',minimumFractionDigits:n%1?2:0,maximumFractionDigits:2}).format(n);

test('The alternative has distinct bilingual capability paragraphs and explicit confirmation items for all nine providers',()=>{
 assert.deepEqual(editorial.map(p=>p.slug),original.map(p=>p.slug));
 for(const locale of ['en','uk']){
  assert.equal(new Set(editorial.map(p=>p.intro[locale])).size,9);
  for(const article of editorial){
   const product=original.find(p=>p.slug===article.slug);
   assert.equal(article.planDetails.length,product.pricing.plans.length);
   assert.ok(article.sections.length>=3&&article.checks.length>=2);
   assert.equal(new Set(article.sections.map(s=>s.id)).size,article.sections.length);
   for(const section of article.sections){assert.match(section.id,/^[a-z-]+$/);assert.ok(section.heading[locale]);assert.equal(section.paragraphs.length,2);assert.ok(section.paragraphs[0][locale].includes(product.name));assert.ok(section.paragraphs[1][locale].includes('Briller'));}
   assert.ok(!forbidden.test(JSON.stringify(article)));assert.ok(article.checks.every(p=>p[locale]?.trim()));
  }
 }
});

test('All localized alternative pages render prose, pricing-only tables, confirmation flags and accurate plan amounts',()=>{
 for(const locale of ['en','uk'])for(const slug of ['',...original.map(p=>p.slug)]){
  const path=`/${locale}/comparison2/${slug?slug+'/':''}`;
  const raw=fs.readFileSync('out'+path+'index.html','utf8'),html=markup(raw);
  assert.equal((html.match(/<h1\b/g)||[]).length,1,path);
  assert.ok(html.includes(`<html lang="${locale}"`));assert.ok(html.includes('name="robots" content="noindex'));
  assert.ok(html.includes(`<link rel="canonical" href="https://briller.house${path}"`));
  for(const language of ['en','uk'])assert.ok(html.includes(`hrefLang="${language}" href="https://briller.house/${language}/comparison2/${slug?slug+'/':''}"`));
  assert.ok(!forbidden.test(html),path);assert.equal((html.match(/<table\b/g)||[]).length,1,path);
  assert.ok(html.indexOf('id="pricing"')<html.indexOf('<table'));
  const nav=[...html.matchAll(/<(header|footer)\b[^>]*>[\s\S]*?<\/\1>/g)].map(m=>m[0]).join('').replace(/<nav class="footer-languages"[^>]*>[\s\S]*?<\/nav>/g,'');
  assert.ok(!/href="\/(en|uk)\/comparison2\//.test(nav));
  if(!slug){for(const product of original)assert.ok(html.includes(`href="/${locale}/comparison2/${product.slug}/"`));continue;}
  const product=original.find(p=>p.slug===slug),article=editorial.find(p=>p.slug===slug);
  const prose=html.slice(html.indexOf('class="comparison2-prose"'),html.indexOf('id="pricing"'));
  assert.ok(!prose.includes('<table'));assert.ok(html.includes('id="to-confirm"'));
  for(const check of article.checks)assert.ok(html.includes(check[locale].replaceAll('&','&amp;')));
  for(const section of article.sections)assert.ok(html.includes(`id="${section.id}"`));
  for(const plan of [...product.pricing.plans,...plans])assert.ok(html.includes(money(plan.amount??plan.monthly,locale)),`${path}: missing plan amount`);
  for(const link of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes(`id="${link[1]}"`),path+': missing section anchor');
  assert.ok(!html.includes('compare-citations'));assert.equal((html.match(new RegExp(`href="${product.url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}"`,'g'))||[]).length,1);
 }
});

test('The requested /comparison2 folder works directly; the parallel version stays outside sitemap and llms listings',()=>{
 const sitemap=fs.readFileSync('out/sitemap.xml','utf8'),llms=fs.readFileSync('out/llms.txt','utf8');
 assert.ok(!sitemap.includes('/comparison2/')&&!llms.includes('/comparison2/'));
 for(const slug of ['',...original.map(p=>p.slug)]){
  const html=markup(fs.readFileSync(`out/comparison2/${slug?slug+'/':''}index.html`,'utf8'));
  assert.ok(html.includes('class="comparison2-page"'));
  assert.ok(html.includes(`<link rel="canonical" href="https://briller.house/en/comparison2/${slug?slug+'/':''}"`));
 }
 // Existing comparison pages retain their original published URLs and layout.
 for(const locale of ['en','uk'])for(const product of original){const html=fs.readFileSync(`out/${locale}/compare/${product.slug}/index.html`,'utf8');assert.ok(html.includes('compare-feature-table'));assert.ok(!html.includes('comparison2-capability'));}
});
