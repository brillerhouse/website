import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { searchPosts } from '../lib/blog/search.ts';
import { renderArticle } from '../lib/blog/markdown.ts';
const catalog = JSON.parse(fs.readFileSync('content/blog/catalog.json', 'utf8'));
const source = fs.readFileSync('content/blog/posts/how-to-read-an-ai-render-before-you-build.md', 'utf8');

test('Blog catalog has unique slugs, valid taxonomy and local content/assets', () => {
  for (const collection of [catalog.posts,catalog.categories,catalog.tags])assert.equal(new Set(collection.map(i=>i.slug)).size,collection.length);
  for(const post of catalog.posts){assert.match(post.slug,/^[a-z0-9-]+$/);assert.ok(fs.existsSync(`content/blog/posts/${post.slug}.md`));assert.ok(fs.existsSync('public'+post.image));assert.ok(post.categories.every(id=>catalog.categories.some(c=>c.slug===id)));assert.ok(post.tags.every(id=>catalog.tags.some(t=>t.slug===id)));}
  assert.equal(fs.readFileSync('public/downloads/briller-builder-checklist-letter.pdf').subarray(0,5).toString(),'%PDF-');
});
test('Article renders its real structure, dimension table, five checks and five technical source anchors', () => {
  const {html,headings}=renderArticle(source);assert.ok(!html.includes('<h1'));assert.equal(headings.length,5);assert.ok(headings.some(h=>h.title==='Sources'));assert.equal((html.match(/id="source-\d+"/g)||[]).length,5);assert.equal((html.match(/<h3[^>]*>Check \d:/g)||[]).length,5);assert.match(html,/2,325 mm/);assert.match(html,/<table>/);assert.match(html,/href="#source-5"/);assert.ok(!html.includes('>1. A convincing image'));assert.ok(!html.includes('<h2>1.'));
});
test('Markdown does not allow executable raw HTML or script links', () => {
  const {html}=renderArticle('# Title\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n## A heading\n\n## A heading');assert.ok(!html.includes('<script>'));assert.ok(!html.includes('href="javascript:'));assert.match(html,/id="a-heading"/);assert.match(html,/id="a-heading-2"/);
});
test('Search uses title relevance, full text, categories and tags together', () => {
  const a={slug:'first',title:'Lighting design',excerpt:'Useful guidance',categories:['technical'],tags:['led'],keywords:['lamp'],searchText:'The driver needs maintenance access.'};
  const b={...a,slug:'second',title:'Room details',searchText:'Lighting design and finish samples.'};
  assert.deepEqual(searchPosts([b,a],'lighting').map(p=>p.slug),['first','second']);assert.deepEqual(searchPosts([a,b],'maintenance access','technical','led').map(p=>p.slug),['first']);assert.equal(searchPosts([a],'lighting','other').length,0);assert.equal(searchPosts([a],'lighting','','other').length,0);assert.equal(searchPosts([a],'unknown').length,0);assert.equal(searchPosts([a],'  ').length,1);
});
test('Search normalizes punctuation, diacritics, case and hyphenated terms', () => {
  const post={slug:'x',title:'Café — warm lighting',excerpt:'',categories:[],tags:[],keywords:['load-bearing'],searchText:''};assert.equal(searchPosts([post],'CAFE lighting').length,1);assert.equal(searchPosts([post],'load bearing').length,1);assert.equal(searchPosts([post],'<script>').length,0);
});
test('Every exported blog and taxonomy page is canonical, crawl-controlled and has valid anchors', () => {
  const paths=['/blog/',...catalog.posts.map(p=>`/blog/${p.slug}/`),...catalog.categories.filter(c=>catalog.posts.some(p=>p.categories.includes(c.slug))).map(c=>`/blog/category/${c.slug}/`),...catalog.tags.filter(t=>catalog.posts.some(p=>p.tags.includes(t.slug))).map(t=>`/blog/tag/${t.slug}/`)];
  const sitemap=fs.readFileSync('out/sitemap.xml','utf8');
  for(const path of paths){const html=fs.readFileSync('out'+path+'index.html','utf8');assert.match(html,/<html lang="en"/);assert.ok(html.includes(`rel="canonical" href="https://briller.house${path}"`));assert.equal((html.match(/<h1[ >]/g)||[]).length,1);assert.ok(sitemap.includes('https://briller.house'+path));if(process.env.BRILLER_PREVIEW==='1')assert.match(html,/name="robots" content="noindex, nofollow"/);else assert.ok(!/name="robots" content="noindex/.test(html));
   for(const match of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes(`id="${match[1]}"`),`${path}: missing anchor ${match[1]}`);
   for(const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)/g)){if(match[1].startsWith('//'))continue;assert.ok(fs.existsSync('out'+decodeURIComponent(match[1]))||fs.existsSync('out'+decodeURIComponent(match[1])+'/index.html'),`${path}: missing ${match[1]}`);}
   const header=html.match(/<header class="site-header"[\s\S]*?<\/header>/)?.[0]||'';assert.ok(!header.includes('href="/blog/"'));
   for(const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs))assert.equal(JSON.parse(match[1])['@context'],'https://schema.org');
  }
});
