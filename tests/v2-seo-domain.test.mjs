import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://brinu.xyz';
const dist = (file) => fs.readFileSync(path.resolve('dist', file), 'utf8');
const tag = (html, pattern) => html.match(pattern)?.[1];

test('every indexable page carries an absolute canonical and og:image on brinu.xyz without a trailing slash', () => {
  const caseIds = fs.readdirSync(path.resolve('dist/cases'));
  const pages = [['index.html', '/'], ['whoami/index.html', '/whoami'], ['stickers/index.html', '/stickers'], ...caseIds.map((id) => [`cases/${id}/index.html`, `/cases/${id}`])];
  for (const [file, route] of pages) {
    const html = dist(file);
    assert.equal(tag(html, /<link rel="canonical" href="([^"]+)"/), `${SITE}${route}`, `${file} canonical`);
    assert.equal(tag(html, /<meta property="og:url" content="([^"]+)"/), `${SITE}${route}`, `${file} og:url`);
    assert.equal(tag(html, /<meta property="og:image" content="([^"]+)"/), `${SITE}/assets/brinu-avatar.jpg`, `${file} og:image`);
  }
});

test('the 404 page is noindex and has no canonical', () => {
  const html = dist('404.html');
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.doesNotMatch(html, /rel="canonical"/);
});

test('sitemap.xml lists the home, /whoami, /stickers and every case, and robots.txt points to it', () => {
  const sitemap = dist('sitemap.xml');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const cases = fs.readdirSync(path.resolve('dist/cases')).map((id) => `${SITE}/cases/${id}`);
  assert.deepEqual(new Set(locs), new Set([`${SITE}/`, `${SITE}/whoami`, `${SITE}/stickers`, ...cases]));
  assert.match(dist('robots.txt'), new RegExp(`^Sitemap: ${SITE}/sitemap\\.xml$`, 'm'));
});
