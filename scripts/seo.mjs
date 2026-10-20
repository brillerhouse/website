import fs from 'node:fs';
import path from 'node:path';
const origin='https://briller.house';
const solutions=JSON.parse(fs.readFileSync('content/solutions/en.json','utf8')).pages;
const pages=['','features','use-cases','gallery','pricing','faq','contact','privacy','terms','refunds','cookies','solutions',...solutions.map(page=>'solutions/'+page.slug)];
// Blog shares the site's EN/UK structure and stays out of navigation menus.
const blog=JSON.parse(fs.readFileSync('content/blog/catalog.json','utf8'));
const blogSuffixes=['blog',...blog.posts.map(post=>`blog/${post.slug}`),...blog.categories.filter(category=>blog.posts.some(post=>post.categories.includes(category.slug))).map(category=>`blog/category/${category.slug}`),...blog.tags.filter(tag=>blog.posts.some(post=>post.tags.includes(tag.slug))).map(tag=>`blog/tag/${tag.slug}`)];
const localizedPages=[...pages,...blogSuffixes];
for(const page of localizedPages){
 const file=path.join('out','uk',page,'index.html');
 const html=fs.readFileSync(file,'utf8');
 fs.writeFileSync(file,html.replace('<html lang="en"','<html lang="uk"'));
}
fs.writeFileSync('out/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+['en','uk'].flatMap(locale=>localizedPages.map(page=>{const suffix=page?page+'/':'';return `<url><loc>${origin}/${locale}/${suffix}</loc><xhtml:link rel="alternate" hreflang="en" href="${origin}/en/${suffix}"/><xhtml:link rel="alternate" hreflang="uk" href="${origin}/uk/${suffix}"/><xhtml:link rel="alternate" hreflang="x-default" href="${origin}/en/${suffix}"/></url>`})).join('')+'</urlset>');
// HTTP 301 is handled by nginx. These tiny fallbacks keep static/local previews usable.
for(const suffix of blogSuffixes){
 const target='/en/'+suffix+'/', directory=path.join('out',suffix);
 fs.mkdirSync(directory,{recursive:true});
 fs.writeFileSync(path.join(directory,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex, follow"><link rel="canonical" href="${origin}${target}"><title>Blog moved | Briller</title><script>location.replace(${JSON.stringify(target)}+location.search+location.hash)</script></head><body><p><a href="${target}">Continue to the blog</a></p></body></html>`);
}
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
