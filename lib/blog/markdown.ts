import MarkdownIt from 'markdown-it';

export type ArticleHeading = { id: string; title: string; level: number };
export function renderArticle(source: string) {
  // The title and supplied byline have their own accessible article header.
  const body = source.replace(/^# .+\r?\n+/, '').replace(/^\*By .+\*\r?\n+/, '');
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
  const tokens = md.parse(body, {}), headings: ArticleHeading[] = [], ids = new Map<string, number>();
  let inSources = false, sourceNumber = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === 'heading_open') {
      const inline = tokens[i + 1];
      const title = inline.content.replace(/^\d+\.\s+/, '');
      // Retain numbered checks (H3); remove decorative numbering on major sections.
      if (token.tag === 'h2') {
        inline.content = title;
        if (inline.children?.[0]?.type === 'text') inline.children[0].content = inline.children[0].content.replace(/^\d+\.\s+/, '');
      }
      const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const count = ids.get(base) || 0; ids.set(base, count + 1);
      const id = count ? `${base}-${count + 1}` : base;
      token.attrSet('id', id);
      if (token.tag === 'h2') { headings.push({ id, title, level: 2 }); inSources = title.toLowerCase() === 'sources'; }
    }
    if (inSources && token.type === 'list_item_open') token.attrSet('id', `source-${++sourceNumber}`);
  }
  const originalText = md.renderer.rules.text!;
  md.renderer.rules.text = (inlineTokens, index, options, env, self) => {
    const escaped = originalText(inlineTokens, index, options, env, self);
    return escaped.replace(/\[(\d+)\]/g, (match, number) => Number(number) > 0 && Number(number) <= sourceNumber
      ? `<sup class="article-citation"><a href="#source-${number}" aria-label="Source ${number}">${number}</a></sup>` : match);
  };
  const originalTable = md.renderer.rules.table_open;
  md.renderer.rules.table_open = (t, i, o, e, r) => `<div class="article-table" role="region" tabindex="0" aria-label="Article table">${originalTable ? originalTable(t, i, o, e, r) : r.renderToken(t, i, o)}`;
  md.renderer.rules.table_close = () => '</table></div>\n';
  return { html: md.renderer.render(tokens, md.options, {}), headings };
}
