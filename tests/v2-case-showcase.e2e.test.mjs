import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

const IDS = ['magalu-cloud', 'uriana', 'efood', 'aurastream'];

let server;
let baseUrl = '';
let browser;

before(async () => {
  const distDir = path.resolve('dist');
  server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
    let pathname = decodeURIComponent(reqUrl.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    else if (!path.extname(pathname)) pathname += '/index.html';
    const filePath = path.join(distDir, pathname);
    if (!filePath.startsWith(distDir) || !fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
  const launchOptions = { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  if (fs.existsSync('/usr/bin/google-chrome')) launchOptions.executablePath = '/usr/bin/google-chrome';
  browser = await chromium.launch(launchOptions);
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function openPath(route, { locale = 'pt-br', viewport = { width: 1440, height: 900 }, ...contextOptions } = {}) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  const page = await context.newPage();
  await page.addInitScript((loc) => {
    window.localStorage.setItem('brinu_locale', loc);
  }, locale);
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const el = document.getElementById('intro-preloader');
    if (el) {
      el.click();
      el.remove();
    }
    window.dispatchEvent(new CustomEvent('intro-complete'));
  });
  return { context, page };
}


const EXPECTED = {
  'magalu-cloud': { position: '01 / 04', prev: 'aurastream', next: 'uriana', site: 'https://magalu.cloud/', video: true },
  uriana: { position: '02 / 04', prev: 'magalu-cloud', next: 'efood', site: 'https://uriana.vercel.app', video: true },
  efood: { position: '03 / 04', prev: 'uriana', next: 'aurastream', site: 'https://efood-nine-sepia.vercel.app', video: true },
  aurastream: { position: '04 / 04', prev: 'efood', next: 'magalu-cloud', site: 'https://painel-stream.vercel.app', video: false },
};

test('SHOW-01: every case page renders the six showcase blocks', async () => {
  for (const id of IDS) {
    const { context, page } = await openPath(`/cases/${id}`, { reducedMotion: 'reduce' });
    try {
      const showcase = page.locator('[data-showcase]');
      assert.equal(await showcase.count(), 1, `${id} showcase`);
      assert.equal(await showcase.locator('[data-showcase-bar]').count(), 1, `${id} bar`);
      assert.equal(await page.locator('h1').count(), 1, `${id} h1`);
      assert.equal(await showcase.locator('h1[data-case-title]').count(), 1, `${id} title in showcase`);
      assert.equal(await showcase.locator('[data-showcase-card="media"]').count(), 1, `${id} media card`);
      assert.equal(await showcase.locator('[data-showcase-card="second"]').count(), 1, `${id} second card`);
      assert.equal(await showcase.locator('[data-showcase-card="media"] video').count(), EXPECTED[id].video ? 1 : 0, `${id} video`);
      const second = showcase.locator('[data-showcase-card="second"]');
      const hasContent = (await second.locator('img').count()) > 0 || (await second.getAttribute('data-showcase-highlight')) !== null;
      assert.ok(hasContent, `${id} second content`);
      assert.ok((await showcase.locator('[data-case-description]').textContent()).trim().length > 0, `${id} description`);
      assert.ok((await showcase.locator('[data-case-stack-item]').count()) > 0, `${id} stack`);
      assert.equal(await showcase.locator('[data-showcase-tiles] a').count(), 4, `${id} tiles`);
    } finally {
      await context.close();
    }
  }
});

test('SHOW-02: the control bar shows the position, wrapping arrows and the live site link', async () => {
  for (const id of IDS) {
    const { context, page } = await openPath(`/cases/${id}`, { reducedMotion: 'reduce' });
    try {
      const bar = page.locator('[data-showcase-bar]');
      assert.equal((await bar.locator('[data-showcase-position]').textContent()).trim(), `CASE ${EXPECTED[id].position}`);
      assert.equal(await bar.locator('[data-showcase-prev]').getAttribute('href'), `/cases/${EXPECTED[id].prev}`);
      assert.equal(await bar.locator('[data-showcase-next]').getAttribute('href'), `/cases/${EXPECTED[id].next}`);
      const site = bar.locator('[data-showcase-site]');
      assert.equal(await site.getAttribute('href'), EXPECTED[id].site);
      assert.equal(await site.getAttribute('rel'), 'noopener noreferrer');
      assert.equal(await site.getAttribute('target'), '_blank');
      assert.match((await site.textContent()).trim(), /^SITE NO AR/);
    } finally {
      await context.close();
    }
  }
});

test('SHOW-03: the tiles keep the case order and mark only the current case', async () => {
  for (const id of IDS) {
    const { context, page } = await openPath(`/cases/${id}`, { reducedMotion: 'reduce' });
    try {
      const tiles = await page.locator('[data-showcase-tiles] a').evaluateAll((nodes) =>
        nodes.map((node) => ({ href: node.getAttribute('href'), current: node.getAttribute('aria-current') }))
      );
      assert.deepEqual(tiles.map((tile) => tile.href), IDS.map((other) => `/cases/${other}`));
      assert.deepEqual(tiles.map((tile) => tile.current), IDS.map((other) => (other === id ? 'page' : null)));
    } finally {
      await context.close();
    }
  }
});

test('SHOW-08: without JavaScript the poster, texts and links are present with declared sizes', async () => {
  for (const id of IDS) {
    const { context, page } = await openPath(`/cases/${id}`, { reducedMotion: 'reduce', javaScriptEnabled: false });
    try {
      const media = page.locator('[data-showcase-card="media"]');
      if (EXPECTED[id].video) {
        const video = media.locator('video');
        assert.ok(await video.getAttribute('poster'), `${id} poster`);
        assert.ok(Number(await video.getAttribute('width')) > 0 && Number(await video.getAttribute('height')) > 0, `${id} video size`);
        assert.equal(await video.getAttribute('autoplay'), null);
      }
      const images = await page.locator('[data-showcase] img').evaluateAll((nodes) =>
        nodes.map((node) => ({ w: node.getAttribute('width'), h: node.getAttribute('height'), src: node.getAttribute('src') }))
      );
      assert.ok(images.length >= 3, `${id} images`);
      assert.deepEqual(images.filter((image) => !Number(image.w) || !Number(image.h)).map((image) => image.src), []);
      assert.ok(await page.locator('[data-showcase-site]').isVisible());
      assert.ok(await page.locator('h1').isVisible());
      assert.ok(await page.locator('[data-case-description]').isVisible());
    } finally {
      await context.close();
    }
  }
});
