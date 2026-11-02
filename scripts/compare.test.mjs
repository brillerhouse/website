import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const catalog=read('content/compare/catalog.json'),ui=read('content/compare/ui.json'),plans=read('content/plans.json');
const products=catalog.products;
const {outputText}=ts.transpileModule(fs.readFileSync('lib/compare.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}});
const content={href:(locale,page='')=>`/${locale}/${page?page+'/':''}`,site:{origin:'https://briller.house'},socialPreview:{url:'https://briller.house/images/briller-social-preview.png'}};
const scope={exports:{},require:id=>{
 if(id==='@/content/compare/catalog.json')return{default:catalog};
 if(id==='@/content/compare/ui.json')return{default:ui};
 if(id==='@/content/plans.json')return{default:plans};
 if(id==='./content')return content;
 throw Error('Unexpected comparison dependency: '+id);
}};
vm.runInNewContext(outputText,scope);const lib=scope.exports;

test('The directory includes nine unique alternatives, including Spacely.ai, in both locales',()=>{
 assert.equal(products.length,9);assert.equal(new Set(products.map(p=>p.slug)).size,9);
 assert.ok(products.some(p=>p.slug==='spacely-ai'&&p.name==='Spacely.ai'));
 for(const product of products){assert.match(product.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);assert.equal(new URL(product.url).protocol,'https:');assert.ok(['photo','planning'].includes(product.category));}
 for(const locale of ['en','uk']){assert.ok(ui[locale].method.length>=4);assert.equal(Object.keys(ui[locale].featureLabels).length,9);for(const p of products)assert.equal(lib.comparisonHref(locale,p.slug),`/${locale}/compare/${p.slug}/`);}
});
test('Documented competitor facts and numeric prices require verified official source references',()=>{
 for(const product of products){
  const sources=new Map(product.sources.map(source=>[source.id,source]));assert.equal(sources.size,product.sources.length);
  const check=ids=>{assert.ok(ids.length,product.slug+': unsupported claim');for(const id of ids){const source=sources.get(id);assert.ok(source,product.slug+': unknown source '+id);assert.equal(source.status,'verified');assert.match(source.checkedAt,/^\d{4}-\d{2}-\d{2}$/);}};
  for(const [key,fact]of Object.entries(product.features)){assert.ok(fact.text.en&&fact.text.uk,product.slug+': '+key);assert.ok(['documented','unconfirmed','different'].includes(fact.state));if(fact.state!=='unconfirmed')check(fact.sources);}
  if(product.pricing.state==='verified')check(product.pricing.sources);
  for(const plan of product.pricing.plans){assert.ok(Number.isFinite(plan.amount)&&plan.amount>0);assert.ok(['monthly','annual','yearly','oneOff','publishedMonthly','seatMonthly'].includes(plan.billing));assert.match(plan.currency,/^[A-Z]{3}$/);assert.ok(plan.allowance.en&&plan.allowance.uk);check(plan.sources);for(const locale of ['en','uk'])assert.ok(ui[locale][plan.billing]);}
  if(product.verification==='reviewed'){assert.match(product.reviewedAt,/^\d{4}-\d{2}-\d{2}$/);assert.ok(product.sources.some(s=>s.status==='verified'));assert.ok(product.takeaways.length>=3&&product.chooseCompetitor.length&&product.chooseBriller.length&&product.watchouts.length);}
  for(const source of product.sources){assert.equal(new URL(source.url).protocol,'https:');assert.ok(source.title);if(source.status==='verified')assert.match(source.checkedAt,/^\d{4}-\d{2}-\d{2}$/);}
 }
});
test('Briller comparison pricing, trial and seats stay synchronized with its actual plan catalogue',()=>{
 for(const locale of ['en','uk']){
  const price=lib.brillerPrice(locale);assert.ok(price.includes(String(plans.plans.find(p=>p.name==='Explorer').monthly).replace('.',locale==='uk'?',':'.')));
  const trial=lib.brillerTrial(locale);assert.ok(trial.includes(String(plans.trial.durationHours))&&trial.includes(String(plans.trial.credits)));
  assert.ok(lib.brillerFeature('teams',locale).includes(String(plans.plans.find(p=>p.name==='Studio / Architect').seats)));
 }
});
test('Metadata uses canonical locale pairs and keeps unfinished research out of indexing',()=>{
 for(const locale of ['en','uk'])for(const product of products){const meta=lib.comparisonMetadata(locale,product);assert.equal(meta.alternates.canonical,content.site.origin+lib.comparisonHref(locale,product.slug));assert.equal(meta.alternates.languages.en,content.site.origin+lib.comparisonHref('en',product.slug));assert.equal(meta.alternates.languages.uk,content.site.origin+lib.comparisonHref('uk',product.slug));assert.equal(meta.robots.index,product.verification==='reviewed');assert.ok(meta.title.includes(product.name));}
});
test('Reviewed analysis is distinct, bilingual and backed by first-party sources',()=>{
 for(const locale of ['en','uk']){
  const reviewed=products.filter(p=>p.verification==='reviewed');
  assert.equal(new Set(reviewed.map(p=>p.summary[locale])).size,reviewed.length);
  for(const product of reviewed){
   assert.ok(product.summary[locale].length>70);
   assert.ok(!/review in progress|Ще не перевірено|Буде уточнено/.test(product.summary[locale]));
   for(const field of ['takeaways','chooseCompetitor','chooseBriller','watchouts'])assert.ok(product[field].every(p=>p[locale]?.trim()));
   const official=new URL(product.url).hostname.replace(/^www\./,'');
   for(const source of product.sources){const host=new URL(source.url).hostname.replace(/^www\./,'');assert.ok(host===official||(product.slug==='remodel-ai'&&host==='apps.apple.com'),product.slug+': nonofficial source '+source.url);}
  }
 }
});
test('Static comparison pages have real cross-links, sources, language metadata and sitemap entries',()=>{
 const sitemap=fs.readFileSync('out/sitemap.xml','utf8');
 for(const locale of ['en','uk']){
  const hub=fs.readFileSync(`out/${locale}/compare/index.html`,'utf8');
  const hubMarkup=hub.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
  for(const product of products){
   const href=lib.comparisonHref(locale,product.slug);assert.ok(hubMarkup.includes(`href="${href}"`));assert.equal(sitemap.includes('https://briller.house'+href),product.verification==='reviewed');
   const html=fs.readFileSync(`out/${locale}/compare/${product.slug}/index.html`,'utf8');assert.ok(html.includes(locale==='uk'?'Альтернатива':'alternative'));assert.ok(html.includes(`<html lang="${locale}"`));
   assert.ok(html.includes(`href="/${locale}/compare/"`));assert.ok(html.includes(`name="description"`));
   const markup=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
   assert.ok(markup.includes(`<link rel="canonical" href="https://briller.house${href}"`));
   for(const language of ['en','uk'])assert.ok(markup.includes(`hrefLang="${language}" href="https://briller.house${lib.comparisonHref(language,product.slug)}"`));
   assert.ok(markup.includes('hrefLang="x-default"'));assert.ok(markup.includes('property="og:image"'));assert.ok(markup.includes('name="twitter:card"'));
   for(const [,target]of markup.matchAll(/href="#(source-[^"]+)"/g))assert.ok(markup.includes(`id="${target}"`),href+': broken source anchor');
   for(const source of product.sources)assert.ok(html.includes(source.url.replaceAll('&','&amp;')));
   const structured=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(([,s])=>JSON.parse(s));
   assert.ok(structured.some(s=>s['@type']==='WebPage'&&s.url==='https://briller.house'+href));assert.ok(!structured.some(s=>s.aggregateRating));
   if(product.verification==='reviewed'){const faq=structured.find(s=>s['@type']==='FAQPage');assert.ok(faq&&faq.mainEntity.length===3);for(const question of faq.mainEntity)assert.ok(html.includes(question.name.replaceAll('&','&amp;')));}else assert.ok(!structured.some(s=>s['@type']==='FAQPage'));
   const llms=fs.readFileSync('out/llms.txt','utf8');assert.equal(llms.includes('https://briller.house'+href),product.verification==='reviewed');
  }
  assert.ok(hubMarkup.includes('role="region"')&&hubMarkup.includes('tabindex="0"'));
  assert.ok(hubMarkup.includes('scope="row"'));assert.equal(sitemap.includes(`https://briller.house/${locale}/compare/`),products.every(product=>product.verification==='reviewed'));
 }
});


test('Alternative-intent titles and descriptions use the competitor name in each language without keyword stuffing',()=>{
 for(const locale of ['en','uk'])for(const product of products){
  const meta=lib.comparisonMetadata(locale,product);
  assert.ok(meta.title.includes(locale==='uk'?'Альтернатива':'Alternative'));
  assert.ok(meta.title.includes(product.name));assert.ok(meta.description.includes(product.name));
  assert.ok(meta.description.length<=181);assert.equal(meta.openGraph.url,meta.alternates.canonical);
  assert.equal(meta.twitter.card,'summary_large_image');
 }
});
test('FAQ answers are visible-content data and unfinished research cannot generate FAQ claims',()=>{
 const pending=products.find(product=>product.verification==='pending');if(pending)assert.deepEqual(Array.from(lib.comparisonFAQs(pending,'en')),[]);
 const specimen={...products[0],verification:'reviewed',chooseBriller:[{en:'Choose a photo-led concept with budget-specific implementation guidance.',uk:'Оберіть концепцію за фото з порадами для бюджету.'}],chooseCompetitor:[{en:'Choose the documented alternative workflow when it fits the project.',uk:'Оберіть підтверджений робочий процес іншого сервісу, якщо він підходить проєкту.'}]};
 for(const locale of ['en','uk']){const questions=lib.comparisonFAQs(specimen,locale);assert.equal(questions.length,3);assert.ok(questions.every(item=>item.question.includes(specimen.name)));assert.equal(questions[0].answer,specimen.chooseBriller[0][locale]);assert.equal(questions[1].answer,specimen.chooseCompetitor[0][locale]);}
});
