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

const playing = (page) => page.locator('[data-showcase-video]').evaluate((video) => !video.paused && !video.ended);
const waitPlaying = (page, expected) =>
  page.waitForFunction(
    (want) => {
      const video = document.querySelector('[data-showcase-video]');
      return video && (!video.paused && !video.ended) === want;
    },
    expected,
    { timeout: 8000 }
  );

test('SHOW-04: the video is muted, looping, inline and autoplays with a poster', async () => {
  const { context, page } = await openPath('/cases/magalu-cloud');
  try {
    await waitPlaying(page, true);
    const props = await page.locator('[data-showcase-video]').evaluate((video) => ({
      muted: video.muted,
      loop: video.loop,
      inline: video.playsInline,
      poster: video.getAttribute('poster'),
    }));
    assert.deepEqual({ muted: props.muted, loop: props.loop, inline: props.inline }, { muted: true, loop: true, inline: true });
    assert.match(props.poster, /^\/assets\/showcase\/magalu-cloud\/.+\.webp$/);
    assert.equal((await page.request.get(`${baseUrl}${props.poster}`)).status(), 200);
  } finally {
    await context.close();
  }
});

test('SHOW-05: the play button toggles the video and exposes its state', async () => {
  const { context, page } = await openPath('/cases/uriana');
  try {
    const button = page.locator('[data-showcase-toggle]');
    await waitPlaying(page, true);
    assert.equal(await button.isVisible(), true);
    assert.equal(await button.getAttribute('aria-pressed'), 'true');
    assert.match((await button.innerText()).trim(), /PLAY\s*·\s*PAUSE/);
    await button.click();
    await waitPlaying(page, false);
    assert.equal(await button.getAttribute('aria-pressed'), 'false');
    await button.click();
    await waitPlaying(page, true);
    assert.equal(await button.getAttribute('aria-pressed'), 'true');
    assert.ok((await button.evaluate((node) => node.getAttribute('aria-label') ?? node.textContent)).trim().length > 0);
  } finally {
    await context.close();
  }
});

test('SHOW-06: reduced motion keeps the video paused on the poster', async () => {
  const { context, page } = await openPath('/cases/efood', { reducedMotion: 'reduce' });
  try {
    await page.waitForTimeout(800);
    assert.equal(await playing(page), false);
    assert.equal(await page.locator('[data-showcase-toggle]').getAttribute('aria-pressed'), 'false');
    assert.ok(await page.locator('[data-showcase-video]').getAttribute('poster'));
    await page.locator('[data-showcase-toggle]').click();
    await waitPlaying(page, true);
  } finally {
    await context.close();
  }
});

test('SHOW-07: the video pauses off screen and resumes only if it was playing', async () => {
  const { context, page } = await openPath('/cases/magalu-cloud');
  try {
    const away = () => page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const back = () => page.evaluate(() => document.querySelector('[data-showcase-card="media"]').scrollIntoView({ block: 'center' }));
    await waitPlaying(page, true);
    await away();
    await waitPlaying(page, false);
    await back();
    await waitPlaying(page, true);

    await page.locator('[data-showcase-toggle]').click();
    await waitPlaying(page, false);
    await away();
    await page.waitForTimeout(500);
    await back();
    await page.waitForTimeout(800);
    assert.equal(await playing(page), false);
  } finally {
    await context.close();
  }
});

test('SHOW-08: a broken video or no JavaScript keeps the poster and links usable', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(/\.(webm|mp4)$/, (route) => route.abort());
  try {
    await page.goto(`${baseUrl}/cases/efood`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    assert.equal(await playing(page), false);
    assert.ok(await page.locator('[data-showcase-video]').getAttribute('poster'));
    assert.equal(await page.locator('[data-showcase-site]').isVisible(), true);
    assert.equal(await page.locator('h1').isVisible(), true);
    assert.equal(await page.locator('[data-showcase-tiles] a').count(), 4);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
});

test('MOB-04: Save-Data keeps the video from autoplaying or downloading', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const media = [];
  page.on('request', (request) => {
    if (/\.(webm|mp4)$/.test(request.url())) media.push(request.url());
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true });
  });
  try {
    await page.goto(`${baseUrl}/cases/uriana`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    assert.equal(await playing(page), false);
    assert.deepEqual(media, []);
    assert.equal(await page.locator('[data-showcase-video]').evaluate((video) => video.playsInline && !document.fullscreenElement), true);
  } finally {
    await context.close();
  }
});

test('SHOW-05: restoring the page from the back-forward cache recomputes the state', async () => {
  const { context, page } = await openPath('/cases/uriana');
  try {
    await waitPlaying(page, true);
    await page.locator('[data-showcase-toggle]').click();
    await waitPlaying(page, false);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await waitPlaying(page, true);
    assert.equal(await page.locator('[data-showcase-toggle]').getAttribute('aria-pressed'), 'true');
  } finally {
    await context.close();
  }
});

test('SHOW-09: showcase text updates in place on locale change', async () => {
  const { SHOWCASE_MEDIA } = await import('../src/data/showcase.ts');
  const { getLocalizedCases } = await import('../src/data/cases.ts');
  const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
  const english = DICTIONARIES.en.showcase;
  const enCases = getLocalizedCases('en');

  for (const id of ['magalu-cloud', 'aurastream']) {
    const media = SHOWCASE_MEDIA[id];
    const { context, page } = await openPath(`/cases/${id}`, { locale: 'pt-br', reducedMotion: 'reduce' });
    try {
      await page.evaluate(() => { window.__marker = 'kept'; });
      await page.locator('[data-lang-toggle]').first().click();
      await page.waitForFunction(() => document.querySelector('[data-showcase-site]').textContent.includes('LIVE SITE'));
      const text = (selector) => page.locator(selector).first().textContent().then((value) => value.trim());
      assert.equal(await page.evaluate(() => window.__marker), 'kept', `${id} no reload`);
      assert.equal(await text('[data-showcase-position]'), `${english.caseLabel} ${await page.evaluate(() => document.querySelector('[data-showcase-position]').textContent.trim().split(' ').slice(1).join(' '))}`);
      assert.equal(await page.locator('[data-showcase-prev]').getAttribute('aria-label'), english.prevAria);
      assert.equal(await page.locator('[data-showcase-next]').getAttribute('aria-label'), english.nextAria);
      assert.equal(await page.locator('[data-showcase-tiles]').getAttribute('aria-label'), english.tilesAria);
      assert.equal(await page.locator('[data-showcase-card="media"] img, [data-showcase-video]').first().evaluate((node) => node.getAttribute('alt') ?? node.getAttribute('aria-label')), media.video ? media.video.poster.alt.en : media.screenshot.alt.en);
      const imageAlts = await page.locator('[data-showcase-card] img').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('alt')));
      assert.ok(imageAlts.every((alt) => alt === media.screenshot.alt.en), `${id} screenshot alts ${imageAlts}`);
      if (media.video) assert.equal(await text('[data-showcase-tag]'), media.video.tag.en);
      if (media.highlight) {
        assert.equal(await text('[data-showcase-highlight-label]'), media.highlight.label.en);
        assert.equal(await text('[data-showcase-highlight-note]'), media.highlight.note.en);
      }
      const tileTitles = await page.locator('[data-showcase-tiles] [data-showcase-tile-title]').allTextContents();
      assert.deepEqual(tileTitles.map((title) => title.trim().replace(/^\d+ · /, '')), IDS.map((other) => enCases.find((c) => c.id === other).title));
    } finally {
      await context.close();
    }
  }
});

test('SHOW-09: switching the locale does not change the video state', async () => {
  const { context, page } = await openPath('/cases/magalu-cloud', { locale: 'pt-br' });
  try {
    await waitPlaying(page, true);
    await page.locator('[data-lang-toggle]').first().click();
    await page.waitForFunction(() => document.querySelector('[data-showcase-site]').textContent.includes('LIVE SITE'));
    assert.equal(await playing(page), true);
    await page.locator('[data-showcase-toggle]').click();
    await waitPlaying(page, false);
    await page.locator('[data-lang-toggle]').first().click();
    await page.waitForFunction(() => document.querySelector('[data-showcase-site]').textContent.includes('SITE NO AR'));
    await page.waitForTimeout(400);
    assert.equal(await playing(page), false);
    assert.equal(await page.locator('[data-showcase-toggle]').getAttribute('aria-pressed'), 'false');
  } finally {
    await context.close();
  }
});
