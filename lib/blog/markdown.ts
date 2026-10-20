import MarkdownIt from 'markdown-it';
import type { Locale } from '@/lib/content';

export type ArticleHeading = { id: string; title: string; level: number };
export type ArticleBlock = { type: 'html'; html: string } | { type: 'download'; resource: string };
export function renderArticle(source: string, locale: Locale = 'en') {
  // The title and supplied byline have their own accessible article header.
  const body = source.replace(/^# .+\r?\n+/, '').replace(/^\*(?:By |Автор: ).+\*\r?\n+/, '');
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
  const tokens = md.parse(body, {}), headings: ArticleHeading[] = [], ids = new Map<string, number>();
  let inSources = false, sourceNumber = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === 'heading_open') {
      const inline = tokens[i + 1];
      const explicit = inline.content.match(/\s+\{#([a-z][a-z0-9-]*)\}$/);
      if (explicit) {
        inline.content = inline.content.replace(explicit[0], '');
        const last = inline.children?.at(-1);
        if (last?.type === 'text') last.content = last.content.replace(explicit[0], '');
      }
      const title = inline.content.replace(/^\d+\.\s+/, '');
      // Retain numbered checks (H3); remove decorative numbering on major sections.
      if (token.tag === 'h2') {
        inline.content = title;
        if (inline.children?.[0]?.type === 'text') inline.children[0].content = inline.children[0].content.replace(/^\d+\.\s+/, '');
      }
      const base = explicit?.[1] || title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
      const count = ids.get(base) || 0; ids.set(base, count + 1);
      const id = count ? `${base}-${count + 1}` : base;
      token.attrSet('id', id);
      if (token.tag === 'h2') { headings.push({ id, title, level: 2 }); inSources = title.toLowerCase() === (locale === 'uk' ? 'джерела' : 'sources'); }
    }
    if (inSources && token.type === 'list_item_open') token.attrSet('id', `source-${++sourceNumber}`);
  }
  const originalText = md.renderer.rules.text!;
  md.renderer.rules.text = (inlineTokens, index, options, env, self) => {
    const escaped = originalText(inlineTokens, index, options, env, self);
    return escaped.replace(/\[(\d+)\]/g, (match, number) => Number(number) > 0 && Number(number) <= sourceNumber
      ? `<sup class="article-citation"><a href="#source-${number}" aria-label="${locale === 'uk' ? 'Джерело' : 'Source'} ${number}">${number}</a></sup>` : match);
  };
  const originalTable = md.renderer.rules.table_open;
  md.renderer.rules.table_open = (t, i, o, e, r) => `<div class="article-table" role="region" tabindex="0" aria-label="${locale === 'uk' ? 'Таблиця статті' : 'Article table'}">${originalTable ? originalTable(t, i, o, e, r) : r.renderToken(t, i, o)}`;
  md.renderer.rules.table_close = () => '</table></div>\n';
  // Standalone resource markers become React slots, never raw HTML or executable content.
  const blocks: ArticleBlock[] = [];
  let start = 0;
  for (let i = 0; i < tokens.length; i++) {
    const marker = tokens[i].type === 'paragraph_open' && tokens[i].level === 0 && tokens[i + 1]?.type === 'inline'
      && tokens[i + 2]?.type === 'paragraph_close'
      ? tokens[i + 1].content.match(/^\{\{download:([a-z0-9-]+)\}\}$/) : null;
    if (!marker) continue;
    if (i > start) blocks.push({ type: 'html', html: md.renderer.render(tokens.slice(start, i), md.options, {}) });
    blocks.push({ type: 'download', resource: marker[1] });
    i += 2; start = i + 1;
  }
  if (start < tokens.length) blocks.push({ type: 'html', html: md.renderer.render(tokens.slice(start), md.options, {}) });
  return { html: blocks.filter((block): block is Extract<ArticleBlock, { type: 'html' }> => block.type === 'html').map(block => block.html).join(''), headings, blocks };
}
