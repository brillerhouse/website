import fs from 'node:fs';
import path from 'node:path';
const origin='https://briller.house';
const pages=['','features','use-cases','gallery','pricing','faq','contact'];
const legal=['privacy','terms','refunds','cookies'];
for(const page of ['',...pages.slice(1),...legal]){
 const file=path.join('out','uk',page,'index.html');
 const html=fs.readFileSync(file,'utf8');
 fs.writeFileSync(file,html.replace('<html lang="en"','<html lang="uk"'));
}
fs.writeFileSync('out/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+['en','uk'].flatMap(locale=>pages.map(page=>{const suffix=page?page+'/':'';return `<url><loc>${origin}/${locale}/${suffix}</loc><xhtml:link rel="alternate" hreflang="en" href="${origin}/en/${suffix}"/><xhtml:link rel="alternate" hreflang="uk" href="${origin}/uk/${suffix}"/><xhtml:link rel="alternate" hreflang="x-default" href="${origin}/en/${suffix}"/></url>`})).join('')+'</urlset>');
const preview=process.env.BRILLER_PREVIEW==='1';
if(preview){
 function protect(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  const file=path.join(directory,entry.name);
  if(entry.isDirectory())protect(file);
  else if(entry.name.endsWith('.html')){
   let html=fs.readFileSync(file,'utf8');
   const robots=/<meta name="robots" content="[^"]*"\s*\/?\s*>/g;
   html=html.replace(robots,'');
   fs.writeFileSync(file,html.replace('<head>','<head><meta name="robots" content="noindex, nofollow"/>'));
  }
 }}
 protect('out');
}
fs.writeFileSync('out/robots.txt',preview?'User-agent: *\nDisallow: /\n':`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
fs.copyFileSync('content/llms.txt','out/llms.txt');
console.log('SEO: Ukrainian HTML language, bilingual sitemap, robots.txt and llms.txt generated.');
