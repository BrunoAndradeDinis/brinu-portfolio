import type { APIRoute } from 'astro';
import { MAIN_CASES } from '../data/cases';
import { casePath } from '../utils/case-pages';

const PATHS = ['/', '/whoami', '/stickers', ...MAIN_CASES.map(({ id }) => casePath(id))];

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('sitemap.xml needs `site` in astro.config.mjs');
  const urls = PATHS.map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
