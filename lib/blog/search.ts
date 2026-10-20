export type SearchPost = {
  slug: string; title: string; excerpt: string; categories: string[]; tags: string[];
  keywords: string[]; searchText: string;
};

export function normalizeSearch(value: string) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function searchPosts<T extends SearchPost>(posts: T[], query: string, category = '', tag = ''): T[] {
  const words = [...new Set(normalizeSearch(query).split(' ').filter(Boolean))].slice(0, 20);
  return posts.map((post, position) => {
    if (category && !post.categories.includes(category) || tag && !post.tags.includes(tag)) return null;
    const title = normalizeSearch(post.title), summary = normalizeSearch(post.excerpt);
    const topics = normalizeSearch([...post.categories, ...post.tags, ...post.keywords].join(' '));
    const body = normalizeSearch(post.searchText);
    let score = 0;
    for (const word of words) {
      const weight = title.includes(word) ? 8 : topics.includes(word) ? 5 : summary.includes(word) ? 3 : body.includes(word) ? 1 : 0;
      if (!weight) return null;
      score += weight;
    }
    return { post, score, position };
  }).filter((item): item is { post: T; score: number; position: number } => item !== null)
    .sort((a, b) => b.score - a.score || a.position - b.position).map(item => item.post);
}
