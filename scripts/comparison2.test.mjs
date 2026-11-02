import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const original=json('content/compare/catalog.json').products;
const editorial=json('content/comparison2/articles.json').products;
const labels=json('content/comparison2/ui.json');
const plans=json('content/plans.json').plans;
const pricing=json('content/comparison2/pricing.json').products;
const markup=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
const forbidden=/desk-based reviews|controlled speed|image-quality benchmarks|public login wall|not yet verified|review in progress/i;
const money=(n,locale)=>new Intl.NumberFormat(locale==='uk'?'uk-UA':'en-US',{style:'currency',currency:'USD',minimumFractionDigits:n%1?2:0,maximumFractionDigits:2}).format(n);

test('The alternative has distinct bilingual capability paragraphs and explicit confirmation items for all nine providers',()=>{
 assert.deepEqual(editorial.map(p=>p.slug),original.map(p=>p.slug));
 for(const locale of ['en','uk']){
  assert.equal(new Set(editorial.map(p=>p.intro[locale])).size,9);
  for(const article of editorial){
   const product=original.find(p=>p.slug===article.slug);
   assert.ok(pricing.some(review=>review.slug===article.slug));
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
  const review=pricing.find(item=>item.slug===slug);
  const rows=[...html.matchAll(/<tr[^>]*data-tier-id="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g)];
  assert.equal(rows.length,review.tiers.length,path);
  for(const tier of review.tiers){
   const row=rows.find(match=>match[1]===tier.id);assert.ok(row,path+': tier missing '+tier.id);
   const cells=[...row[2].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(m=>m[1]);assert.equal(cells.length,2);
   const [competitorCell,brillerCell]=cells;assert.ok(competitorCell.includes(`<h3>${tier.name}</h3>`));
   for(const offer of tier.offers){
    if(offer.amount!==undefined)assert.ok(competitorCell.includes(money(offer.amount,locale)),path+': offer amount missing');else assert.ok(competitorCell.includes(labels[locale].customQuote));
    if(offer.maximum!==undefined)assert.ok(competitorCell.includes(money(offer.maximum,locale)));
    const basis=offer.starting?(offer.perSeat?labels[locale].startingSeatMonth:labels[locale].startingMonth):labels[locale].billingLabels[offer.billing];assert.ok(competitorCell.includes(basis));
   }
   const plan=plans.find(p=>p.name===tier.brillerPlan);assert.ok(brillerCell.includes(`<h3>${plan.name}</h3>`));assert.ok(brillerCell.includes(money(plan.monthly,locale)));
   if(plan.monthly>0){assert.ok(brillerCell.includes(money(Math.round(plan.annualMonthly*1200)/100,locale)));assert.ok(brillerCell.includes(money(plan.annualMonthly,locale)));}
   for(const [key,flag]of [['hdIncluded',plan.resolution],['pdfIncluded',plan.pdf],['commercialIncluded',plan.commercial],['sharedProjects',plan.sharedProjects],['fastQueue',plan.fastQueue]])assert.equal(brillerCell.includes(labels[locale][key]),flag,path+': wrong Briller entitlement '+key);
   assert.ok(brillerCell.includes(labels[locale][plan.insights==='full'?'fullAdvice':'basicAdvice']));
  }
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


test('Fresh tier reviews keep billing units, sources and explicit Briller plan matches',()=>{
 assert.deepEqual(pricing.map(p=>p.slug),original.map(p=>p.slug));
 assert.equal(pricing.reduce((count,p)=>count+p.tiers.length,0),32);
 for(const review of pricing){
  assert.match(review.checkedAt,/^\d{4}-\d{2}-\d{2}$/);assert.ok(review.checks.length);
  const sources=new Map(review.sources.map(s=>[s.id,s]));
  assert.equal(new Set(review.tiers.map(t=>t.id)).size,review.tiers.length);
  for(const tier of review.tiers){
   assert.ok(plans.some(p=>p.name===tier.brillerPlan));assert.ok(tier.offers.length&&tier.features.length>=2&&tier.sources.length);
   for(const id of tier.sources){const source=sources.get(id);assert.ok(source);assert.equal(source.status,'verified');assert.equal(source.checkedAt,review.checkedAt);assert.equal(new URL(source.url).protocol,'https:');}
   for(const locale of ['en','uk']){assert.ok(tier.purpose[locale]&&tier.allowance[locale]);assert.ok(tier.features.every(f=>f[locale]));}
   for(const offer of tier.offers){
    assert.ok(labels.en.billingLabels[offer.billing]);assert.equal(offer.currency,'USD');
    if(offer.billing==='quote')assert.equal(offer.amount,undefined);else assert.ok(Number.isFinite(offer.amount)&&offer.amount>=0);
    if(offer.amount===0)assert.equal(offer.billing,'free');if(offer.maximum!==undefined)assert.ok(offer.maximum>=offer.amount);
    if(offer.starting)assert.equal(offer.billing,'monthly');
   }
  }
 }
 const room=pricing.find(p=>p.slug==='roomgpt');assert.deepEqual(room.tiers.map(t=>t.offers[0].amount),[9,19,29]);assert.ok(room.tiers.every(t=>t.offers[0].billing==='oneOff'));
 const re=pricing.find(p=>p.slug==='reimaginehome');assert.deepEqual(re.tiers.map(t=>t.offers[0].amount),[19,36,59,119]);
 const homestyler=pricing.find(p=>p.slug==='homestyler');assert.ok(homestyler.tiers.filter(t=>t.offers[0].amount>0).every(t=>t.offers[0].starting));assert.ok(homestyler.tiers.find(t=>t.id==='team').offers[0].perSeat);
 const remodel=pricing.find(p=>p.slug==='remodel-ai').tiers.find(t=>t.id==='pro');assert.deepEqual(remodel.offers.map(o=>o.billing),['monthly','yearly','weekly']);
});
