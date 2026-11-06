import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const original=json('content/compare/catalog.json').products;
const editorial=json('content/comparison2/articles.json').products;
const labels=json('content/comparison2/ui.json');
const plans=json('content/plans.json').plans;
const pricing=json('content/comparison2/pricing.json').products;
const monthlyTiers=review=>review.tiers.filter(t=>t.offers.some(o=>o.billing==='monthly'));
const monthlyOffer=tier=>tier.offers.find(o=>o.billing==='monthly'&&!o.starting);
const solutions=Object.fromEntries(['en','uk'].map(locale=>[locale,json(`content/solutions/${locale}.json`).pages]));
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
   for(const section of article.sections){assert.match(section.id,/^[a-z-]+$/);assert.ok(section.heading[locale]);assert.equal(section.paragraphs.length,2);assert.ok(section.paragraphs[0][locale].includes(product.name));assert.ok(section.paragraphs[1][locale].includes('Briller'));assert.ok(section.perspective.audience[locale]);assert.ok(section.perspective.text[locale].length>200);assert.ok(section.perspective.label[locale]);assert.ok(solutions[locale].some(page=>page.slug===section.perspective.solution));}
   assert.ok(!forbidden.test(JSON.stringify(article)));assert.ok(article.checks.every(p=>p[locale]?.trim()));
  }
 }
});

test('All localized alternative pages render prose, pricing-only tables, confirmation flags and accurate plan amounts',()=>{
 for(const locale of ['en','uk'])for(const slug of ['',...original.map(p=>p.slug)]){
  const path=`/${locale}/compare/${slug?slug+'/':''}`;
  const raw=fs.readFileSync('out'+path+'index.html','utf8'),html=markup(raw);
  assert.equal((html.match(/<h1\b/g)||[]).length,1,path);
  assert.ok(html.includes(`<html lang="${locale}"`));
  assert.ok(html.includes(`name="robots" content="${process.env.BRILLER_PREVIEW==='1'||(slug&&original.find(p=>p.slug===slug).verification!=='reviewed')?'noindex':'index'}`));
  assert.ok(html.includes(`<link rel="canonical" href="https://briller.house${path}"`));
  for(const language of ['en','uk'])assert.ok(html.includes(`hrefLang="${language}" href="https://briller.house/${language}/compare/${slug?slug+'/':''}"`));
  assert.ok(!forbidden.test(html),path);assert.equal((html.match(/<table\b/g)||[]).length,slug==='roomgpt'?0:1,path);
  if(slug!=='roomgpt')assert.ok(html.indexOf('id="pricing"')<html.indexOf('<table'));
  const header=html.match(/<header class="site-header"[\s\S]*?<\/header>/)?.[0]||'';
  const footer=(html.match(/<footer[\s\S]*?<\/footer>/)?.[0]||'').replace(/<nav class="footer-languages"[^>]*>[\s\S]*?<\/nav>/g,'');
  assert.ok(!/href="\/(en|uk)\/compare\//.test(header));
  assert.ok(footer.includes(`href="/${locale}/compare/">AI home design</a>`));
  assert.equal((footer.match(/href="\/(en|uk)\/compare\//g)||[]).length,1);
  if(!slug){for(const product of original)assert.ok(html.includes(`href="/${locale}/compare/${product.slug}/"`));continue;}
  const product=original.find(p=>p.slug===slug),article=editorial.find(p=>p.slug===slug);
  const prose=html.slice(html.indexOf('class="comparison2-prose"'),html.indexOf('id="pricing"'));
  assert.ok(!prose.includes('<table'));assert.ok(html.includes('id="to-confirm"'));
  const decision=json('content/comparison2/roundup.json').products.find(p=>p.slug===slug);
  for(const [id,label] of [['pros','pros'],['cons','cons'],['best-for','bestFor']]){
   const block=prose.match(new RegExp(`<section\\b[^>]*id="${id}"[^>]*>([\\s\\S]*?)</section>`));
   assert.ok(block,path+': missing '+id);assert.ok(block[1].includes(`>${labels[locale][label]}</h2>`));
   assert.ok(html.includes(`href="#${id}"`),path+': missing decision navigation');
   const points=label==='bestFor'?[decision.bestFor]:decision[label];
   for(const point of points)assert.ok(block[1].includes(point[locale].replaceAll('&','&amp;')),path+': incorrect '+id+' copy');
  }
  for(const check of article.checks)assert.ok(html.includes(check[locale].replaceAll('&','&amp;')));
  for(const section of article.sections){assert.ok(html.includes(`id="${section.id}"`));assert.ok(prose.includes(`href="/${locale}/solutions/${section.perspective.solution}/"`));assert.ok(prose.includes(section.perspective.audience[locale]));}
  const review=pricing.find(item=>item.slug===slug);
  const rows=[...html.matchAll(/<tr[^>]*data-tier-id="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g)];
  assert.equal(rows.length,monthlyTiers(review).length,path);
  const pricingSection=html.slice(html.indexOf('id="pricing"'),html.indexOf('id="to-confirm"'));
  assert.ok(!/billed annually|per year|per week|річн|щорічн|тиждень/i.test(pricingSection),path+': non-monthly billing leaked');
  for(const tier of review.tiers.filter(t=>!monthlyTiers(review).includes(t)))assert.ok(!rows.some(r=>r[1]===tier.id));
  for(const tier of monthlyTiers(review)){
   const row=rows.find(match=>match[1]===tier.id);assert.ok(row,path+': tier missing '+tier.id);
   const cells=[...row[2].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(m=>m[1]);assert.equal(cells.length,2);
   const [competitorCell,brillerCell]=cells;assert.ok(competitorCell.includes(`<h3>${tier.name}</h3>`));
   const offer=monthlyOffer(tier);
   if(offer){assert.ok(competitorCell.includes(money(offer.amount,locale)),path+': monthly price missing');if(offer.maximum!==undefined)assert.ok(competitorCell.includes(money(offer.maximum,locale)));assert.ok(competitorCell.includes(labels[locale].billingLabels.monthly));}
   else {assert.ok(competitorCell.includes(labels[locale].monthlyUnknown));assert.ok(!competitorCell.includes(money(tier.offers[0].amount,locale)),path+': unconfirmed starting price used as monthly');}
   assert.ok(tier.monthlyAllowance[locale]);
   const plan=plans.find(p=>p.name===tier.brillerPlan);assert.ok(brillerCell.includes(`<h3>${plan.name}</h3>`));assert.ok(brillerCell.includes(money(plan.monthly,locale)));
   assert.ok(brillerCell.includes(labels[locale][plan.insights==='full'?'fullAdvice':'basicAdvice']));
  }
  for(const link of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes(`id="${link[1]}"`),path+': missing section anchor');
  assert.ok(!html.includes('compare-citations'));assert.equal((html.match(new RegExp(`href="${product.url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}"`,'g'))||[]).length,2);
 }
});

test('Public /compare URLs are listed for discovery and legacy /comparison2 URLs redirect to them',()=>{
 const sitemap=fs.readFileSync('out/sitemap.xml','utf8'),llms=fs.readFileSync('out/llms.txt','utf8');
 assert.ok(!sitemap.includes('/comparison2/')&&!llms.includes('/comparison2/'));
 for(const locale of ['en','uk'])for(const slug of ['',...original.map(p=>p.slug)]){
  const suffix=slug?slug+'/':'',target=`/${locale}/compare/${suffix}`;
  assert.ok(sitemap.includes(`<loc>https://briller.house${target}</loc>`));assert.ok(llms.includes('https://briller.house'+target));
  const old=fs.readFileSync(`out/${locale}/comparison2/${suffix}index.html`,'utf8');
  assert.ok(old.includes(`href="https://briller.house${target}"`));assert.ok(old.includes(`location.replace("${target}"+location.search+location.hash)`));assert.ok(old.includes('noindex'));
 }
 for(const slug of ['',...original.map(p=>p.slug)])for(const root of ['compare','comparison2']){
  const suffix=slug?slug+'/':'',html=fs.readFileSync(`out/${root}/${suffix}index.html`,'utf8'),target=`/en/compare/${suffix}`;
  assert.ok(html.includes(`href="https://briller.house${target}"`));assert.ok(html.includes(`location.replace("${target}"+location.search+location.hash)`));
 }
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


test('Monthly presentation has 23 tier choices, with no invented RoomGPT subscription or Homestyler monthly amount',()=>{
 assert.equal(pricing.reduce((n,p)=>n+monthlyTiers(p).length,0),23);
 for(const review of pricing)for(const tier of monthlyTiers(review)){
  for(const locale of ['en','uk']){
   assert.ok(tier.monthlyAllowance[locale]);
   assert.ok(!/annual|year|річн/i.test(tier.monthlyAllowance[locale]));
  }
 }
 assert.equal(monthlyTiers(pricing.find(p=>p.slug==='roomgpt')).length,0);
 assert.ok(monthlyTiers(pricing.find(p=>p.slug==='homestyler')).every(t=>!monthlyOffer(t)));
 for(const locale of ['en','uk']){
  const hub=markup(fs.readFileSync(`out/${locale}/compare/index.html`,'utf8'));
  assert.ok(hub.includes(labels[locale].noMonthly));assert.ok(hub.includes(labels[locale].monthlyUnknown));
  for(const article of editorial)for(const section of article.sections)assert.ok(fs.existsSync(`out/${locale}/solutions/${section.perspective.solution}/index.html`));
 }
});

test('Feature screenshots have matching local image files, provenance and bilingual descriptions',async()=>{
 const {createHash}=await import('node:crypto');const {default:sharp}=await import('sharp');
 const products=json('content/comparison2/screenshots.json').products;
 assert.deepEqual(products.map(p=>p.slug),original.map(p=>p.slug));
 const paths=new Set();
 for(const product of products){
  const article=editorial.find(p=>p.slug===product.slug),identity=original.find(p=>p.slug===product.slug);
  assert.ok(product.images.length>0,product.slug+': feature screenshot missing');assert.ok(!product.pending,product.slug+': capture still pending');
  assert.equal(new Set(product.images.map(i=>i.id)).size,product.images.length);
  for(const image of product.images){
   assert.ok(article.sections.some(s=>s.id===image.section));assert.match(image.src,/^\/images\/comparison2\/[a-z0-9-]+\.webp$/);assert.ok(!paths.has(image.src));paths.add(image.src);
   assert.equal(new URL(image.sourceUrl).protocol,'https:');assert.equal(new URL(image.sourceUrl).hostname.replace(/^www\./,''),new URL(identity.url).hostname.replace(/^www\./,''));
   assert.match(image.capturedAt,/^\d{4}-\d{2}-\d{2}$/);
   for(const locale of ['en','uk'])assert.ok(image.alt[locale].length>20&&image.caption[locale].length>20);
   const bytes=fs.readFileSync('public'+image.src),metadata=await sharp(bytes).metadata();
   assert.equal(metadata.format,'webp');assert.equal(metadata.width,image.width);assert.equal(metadata.height,image.height);
   assert.ok(image.width>=500&&image.height>=250);assert.equal(createHash('sha256').update(bytes).digest('hex'),image.sha256);
  }
 }
 assert.ok(paths.size>0);
});

test('Screenshots appear next to the correct capability, open locally at full size and retain source credits',()=>{
 const products=json('content/comparison2/screenshots.json').products;
 for(const locale of ['en','uk'])for(const product of products){
  const html=markup(fs.readFileSync(`out/${locale}/compare/${product.slug}/index.html`,'utf8'));
  const figures=[...html.matchAll(/<figure\b[^>]*data-screenshot-id="([^"]+)"[^>]*>([\s\S]*?)<\/figure>/g)];assert.equal(figures.length,product.images.length);
  for(const image of product.images){
   const figure=figures.find(f=>f[1]===image.id);assert.ok(figure);
   const position=html.indexOf(figure[0]);const section=html.lastIndexOf('<section ',position);assert.ok(html.slice(section,position).includes(`id="${image.section}"`));
   assert.ok(figure[2].includes(`src="${image.src}"`));assert.ok(figure[2].includes(`href="${image.src}" target="_blank" rel="noopener noreferrer"`));assert.ok(figure[2].includes('loading="lazy"'));assert.ok(figure[2].includes('decoding="async"'));
   assert.ok(figure[2].includes(labels[locale].officialDemo));assert.ok(figure[2].includes(labels[locale].openScreenshot));
   assert.ok(!figure[2].includes('src="https://'));assert.ok(fs.existsSync('out'+image.src));
  }
 }
});

test('Each competitor has a local homepage capture and an official logo with source records',async()=>{
 const {createHash}=await import('node:crypto');const {default:sharp}=await import('sharp');const brands=json('content/comparison2/brands.json').products;
 assert.deepEqual(brands.map(b=>b.slug),original.map(p=>p.slug));
 for(const brand of brands){
  const product=original.find(p=>p.slug===brand.slug);
  assert.equal(brand.homepage.sourceUrl,product.url);
  for(const key of ['homepage','logo']){
   const asset=brand[key];assert.match(asset.src,new RegExp(`^/images/comparison2/${brand.slug}-${key}\\.webp$`));
   const bytes=fs.readFileSync('public'+asset.src),meta=await sharp(bytes).metadata();assert.equal(meta.format,'webp');assert.equal(meta.width,asset.width);assert.equal(meta.height,asset.height);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);assert.match(asset.capturedAt,/^\d{4}-\d{2}-\d{2}$/);assert.equal(new URL(asset.sourceUrl).protocol,'https:');
  }
  assert.equal(brand.homepage.width,1440);assert.ok(brand.homepage.height>=700&&brand.homepage.height<=1000);
  assert.ok(brand.logo.width>=100&&brand.logo.height>=20);assert.ok(['light','dark'].includes(brand.logo.background));
  for(const locale of ['en','uk'])assert.ok(brand.homepage.alt[locale].includes(product.name));
 }
});

test('Localized article heroes use homepage images and official website links contain the matching logo',()=>{
 const brands=json('content/comparison2/brands.json').products;
 for(const locale of ['en','uk'])for(const brand of brands){
  const product=original.find(p=>p.slug===brand.slug),html=markup(fs.readFileSync(`out/${locale}/compare/${brand.slug}/index.html`,'utf8'));
  const hero=html.slice(html.indexOf('class="page-heading comparison2-hero"'),html.indexOf('class="section comparison2-reading-layout"'));
  assert.ok(hero.includes('comparison2-hero-layout'));assert.ok(hero.includes(`src="${brand.homepage.src}"`));assert.ok(hero.includes(`alt="${brand.homepage.alt[locale]}"`));assert.ok(hero.includes('fetchPriority="high"'));assert.ok(!hero.includes('loading="lazy"'));
  const homepage=hero.match(/<figure class="comparison2-homepage">([\s\S]*?)<\/figure>/)[1];
  assert.ok(homepage.includes(`href="${product.url}" target="_blank" rel="noopener noreferrer"`));assert.ok(homepage.includes(labels[locale].opensInNewTab));assert.ok(!homepage.includes('<figcaption'));assert.ok(!homepage.includes(`href="${brand.homepage.src}"`));
  const official=html.slice(html.indexOf('class="section comparison2-official"'));
  assert.ok(official.includes(`href="${product.url}" target="_blank" rel="noopener noreferrer"`));assert.ok(official.includes(`src="${brand.logo.src}"`));assert.ok(official.includes(`alt="${product.name}"`));assert.ok(official.includes('comparison2-logo-'+brand.logo.background));
  assert.ok(fs.existsSync('out'+brand.homepage.src)&&fs.existsSync('out'+brand.logo.src));
 }
});

test('The overview is a bilingual guide with specific features, pros, cons, best-for copy and a Briller conclusion',()=>{
 const guide=json('content/comparison2/roundup.json');assert.equal(guide.products.length,9);assert.deepEqual([...guide.products.map(p=>p.slug)].sort(),original.map(p=>p.slug).sort());
 for(const locale of ['en','uk']){
  assert.ok(guide.intro[locale].split(/\s+/).length<65);
  const html=markup(fs.readFileSync(`out/${locale}/compare/index.html`,'utf8'));
  for(const entry of guide.products){
   assert.ok(entry.features.length>=3&&entry.pros.length>=2&&entry.cons.length>=1);assert.ok(entry.summary[locale]&&entry.bestFor[locale]&&entry.confirm[locale]);
   assert.ok(html.includes(`id="${entry.slug}"`));assert.ok(html.includes(`href="#${entry.slug}"`));
   const block=html.slice(html.indexOf(`class="comparison2-roundup-product" id="${entry.slug}"`),html.indexOf('</section>',html.indexOf(`class="comparison2-roundup-product" id="${entry.slug}"`)));
   for(const label of ['keyFeatures','pros','cons','bestFor'])assert.ok(block.includes(`<h3>${labels[locale][label]}</h3>`),entry.slug+': missing '+label);
   assert.ok(block.includes('comparison2-homepage'));assert.ok(block.includes('comparison2-brand-link'));assert.ok(block.includes(`href="/${locale}/compare/${entry.slug}/"`));
   const homepage=block.match(/<figure class="comparison2-homepage">([\s\S]*?)<\/figure>/)[1],product=original.find(p=>p.slug===entry.slug);
   assert.ok(homepage.includes(`href="${product.url}" target="_blank" rel="noopener noreferrer"`));assert.ok(!homepage.includes('<figcaption'));assert.ok(!homepage.includes(labels[locale].openScreenshot));
   assert.ok(!block.includes('<table'));for(const feature of entry.features)assert.ok(feature.title[locale]&&feature.text[locale]);
  }
  assert.ok(html.indexOf('id="briller-conclusion"')>html.indexOf('id="pricing"'));
  const conclusion=html.slice(html.indexOf('id="briller-conclusion"'));assert.ok(conclusion.includes('Briller'));assert.ok(conclusion.includes('PDF'));assert.ok(conclusion.includes(`href="/${locale}/solutions/first-room-refresh/"`));
  for(const link of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes(`id="${link[1]}"`));
  assert.ok(!/we tested|fastest|best overall|ми протестували/i.test(JSON.stringify(guide)));
 }
});

test('Capterra feedback can render only with verified, dated and attributed source records',()=>{
 const feedback=json('content/comparison2/reviews.json');
 if(feedback.status==='verified'){assert.ok(feedback.reviews.length>0);assert.match(feedback.checkedAt,/^\d{4}-\d{2}-\d{2}$/);}else assert.equal(feedback.reviews.length,0);
 for(const review of feedback.reviews){
  assert.equal(review.verified,true);assert.ok(original.some(p=>p.slug===review.slug));assert.ok(review.id&&review.author);assert.ok(review.score>=1&&review.score<=5);
  assert.match(review.reviewedAt,/^\d{4}-\d{2}-\d{2}$/);assert.match(review.accessedAt,/^\d{4}-\d{2}-\d{2}$/);assert.ok(review.reviewedAt<=review.accessedAt);assert.equal(new URL(review.sourceUrl).hostname,'www.capterra.com');
  for(const locale of ['en','uk']){assert.ok(review.summary[locale]);const html=markup(fs.readFileSync(`out/${locale}/compare/index.html`,'utf8'));assert.ok(html.includes(review.author));assert.ok(html.includes(`dateTime="${review.reviewedAt}"`));assert.ok(html.includes(`href="${review.sourceUrl}"`));}
 }
 if(!feedback.reviews.length)for(const locale of ['en','uk']){const html=markup(fs.readFileSync(`out/${locale}/compare/index.html`,'utf8'));assert.ok(!html.includes('class="comparison2-review"'));}
});

test('The 2026 guide has targeted metadata, canonical locales and visible questions matching structured data',()=>{
 const guide=json('content/comparison2/roundup.json');
 for(const locale of ['en','uk']){
  const raw=fs.readFileSync(`out/${locale}/compare/index.html`,'utf8'),html=markup(raw),c=labels[locale];
  assert.ok(html.includes(`<title>${c.seoTitle} | Briller</title>`));assert.ok(html.includes(`<h1>${c.title}</h1>`));
  assert.ok(html.includes(`name="description" content="${c.seoDescription}"`));assert.ok(c.seoDescription.length>=100&&c.seoDescription.length<=170);
  assert.ok(html.includes(`property="og:title" content="${c.seoTitle}"`));assert.ok(html.includes('2026'));
  const schemas=[...raw.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const graph=schemas.find(s=>s['@graph']?.some(n=>n['@type']==='CollectionPage'))?.['@graph'];assert.ok(graph);
  const article=graph.find(n=>n['@type']==='Article'),list=graph.find(n=>n['@type']==='CollectionPage').mainEntity,faq=graph.find(n=>n['@type']==='FAQPage');
  assert.equal(article.headline,c.title);assert.equal(article.datePublished,guide.publishedAt);assert.equal(article.dateModified,guide.updatedAt);assert.equal(article.author.name,'Briller');
  assert.equal(list.numberOfItems,9);assert.equal(list.itemListElement.length,9);assert.equal(faq.mainEntity.length,guide.questions.length);
  for(const [i,item] of guide.questions.entries()){
   assert.equal(faq.mainEntity[i].name,item.question[locale]);assert.equal(faq.mainEntity[i].acceptedAnswer.text,item.answer[locale]);
   assert.ok(html.includes(item.question[locale].replaceAll('&','&amp;')));assert.ok(html.includes(item.answer[locale].replaceAll('&','&amp;')));
  }
 }
});
