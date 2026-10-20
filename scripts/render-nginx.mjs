import fs from 'node:fs';
export function renderNginx(template, endpoint = '') {
  if (!endpoint) return template;
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || /[\s;"']/.test(endpoint)) throw new Error('Blog lead endpoint must be a public HTTPS URL without credentials');
  return template.replace("connect-src 'self'", `connect-src 'self' ${url.origin}`);
}
if (process.argv[1]?.endsWith('/render-nginx.mjs') && process.argv[2]) {
  fs.writeFileSync(process.argv[2], renderNginx(fs.readFileSync('deployment/nginx.conf', 'utf8'), process.env.NEXT_PUBLIC_BLOG_LEAD_ENDPOINT || ''));
}
