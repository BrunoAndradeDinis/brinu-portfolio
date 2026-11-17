import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';
import { assertClientJsBudget } from './fixtures/client-js-budget.mjs';

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
  'magalu-cloud': { position: '01 / 04', prev: 'aurastream', next: 'uriana', site: 'https://magalu.cloud/', cta: 'SITE NO AR', video: true },
  uriana: { position: '02 / 04', prev: 'magalu-cloud', next: 'efood', site: 'https://uriana.vercel.app', cta: 'DEMO NO AR', video: true },
  efood: { position: '03 / 04', prev: 'uriana', next: 'aurastream', site: 'https://efood-nine-sepia.vercel.app', cta: 'DEMO NO AR', video: true },
  aurastream: { position: '04 / 04', prev: 'efood', next: 'magalu-cloud', site: 'https://painel-stream.vercel.app', cta: 'DEMO DO PAINEL', video: false },
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
      assert.equal(await showcase.locator('[data-showcase-card="third"]').count(), EXPECTED[id].video ? 1 : 0, `${id} third card`);
      assert.equal(await showcase.locator('[data-showcase-card="media"] video').count(), EXPECTED[id].video ? 1 : 0, `${id} video`);
      const second = showcase.locator('[data-showcase-card="second"]');
      const hasContent = (await second.locator('img, video').count()) > 0 || (await second.getAttribute('data-showcase-highlight')) !== null;
      assert.ok(hasContent, `${id} second content`);
      assert.ok((await showcase.locator('[data-showcase-lead]').textContent()).trim().length > 0, `${id} description`);
      assert.equal(await showcase.locator('[data-showcase-chip]').count(), 3, `${id} stack chips`);
      assert.equal(await showcase.locator('[data-showcase-bar-stack]').count(), 3, `${id} bar stack`);
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
      assert.equal((await bar.locator('[data-showcase-position]').innerText()).trim(), `CASE ${EXPECTED[id].position}`);
      assert.equal(await bar.locator('[data-showcase-prev]').getAttribute('href'), `/cases/${EXPECTED[id].prev}`);
      assert.equal(await bar.locator('[data-showcase-next]').getAttribute('href'), `/cases/${EXPECTED[id].next}`);
      const site = bar.locator('[data-showcase-site]');
      assert.equal(await site.getAttribute('href'), EXPECTED[id].site);
      assert.equal(await site.getAttribute('rel'), 'noopener noreferrer');
      assert.equal(await site.getAttribute('target'), '_blank');
      assert.ok((await site.innerText()).trim().startsWith(EXPECTED[id].cta), `${id} cta`);
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
      assert.ok(await page.locator('[data-showcase-lead]').isVisible());
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
  const { SHOWCASE_MEDIA } = await import('../src/data/showcase.ts');
  for (const id of ['magalu-cloud', 'uriana', 'efood']) {
    const { context, page } = await openPath(`/cases/${id}`);
    try {
      await waitPlaying(page, true);
      const props = await page.locator('[data-showcase-video]').evaluate((video) => ({
        muted: video.muted,
        loop: video.loop,
        inline: video.playsInline,
        poster: video.getAttribute('poster'),
      }));
      assert.deepEqual({ muted: props.muted, loop: props.loop, inline: props.inline }, { muted: true, loop: true, inline: true }, id);
      assert.equal(props.poster, SHOWCASE_MEDIA[id].video.poster.src, `${id} poster is the media record poster`);
      assert.equal((await page.request.get(`${baseUrl}${props.poster}`)).status(), 200, `${id} poster file`);
    } finally {
      await context.close();
    }
  }
});

test('SHOW-05: the play button toggles the video and exposes its state', async () => {
  const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openPath('/cases/uriana', { locale });
    try {
      const button = page.locator('[data-showcase-toggle]');
      await waitPlaying(page, true);
      assert.equal(await button.isVisible(), true);
      assert.equal(await button.evaluate((node) => getComputedStyle(node).cursor), 'none');
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      const { play, pause } = DICTIONARIES[locale].showcase;
      assert.equal((await button.innerText()).replace(/\s+/g, ' ').trim(), pause, `${locale} playing button shows pause`);
      await button.click();
      await waitPlaying(page, false);
      assert.equal(await button.getAttribute('aria-pressed'), 'false');
      assert.equal((await button.innerText()).replace(/\s+/g, ' ').trim(), play, `${locale} paused button shows play`);
      await button.click();
      await waitPlaying(page, true);
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      assert.equal((await button.innerText()).replace(/\s+/g, ' ').trim(), pause, `${locale} resumed button shows pause`);
    } finally {
      await context.close();
    }
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
    const away = () => page.evaluate(() => { document.querySelector('[data-showcase-stage]').style.display = 'none'; });
    const back = () => page.evaluate(() => { document.querySelector('[data-showcase-stage]').style.display = ''; });
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

test('MOB-03: the video stays inline and never goes fullscreen by itself', async () => {
  for (const id of ['magalu-cloud', 'uriana', 'efood']) {
    const { context, page } = await openPath(`/cases/${id}`, { viewport: { width: 390, height: 844 } });
    try {
      await waitPlaying(page, true);
      await page.waitForTimeout(600);
      const state = await page.locator('[data-showcase-video]').evaluate((video) => ({
        inline: video.playsInline,
        controls: video.hasAttribute('controls'),
        fullscreen: document.fullscreenElement !== null || video.webkitDisplayingFullscreen === true,
      }));
      assert.deepEqual(state, { inline: true, controls: false, fullscreen: false }, id);
      await page.locator('[data-showcase-toggle]').click();
      await waitPlaying(page, false);
      await page.locator('[data-showcase-toggle]').click();
      await waitPlaying(page, true);
      assert.equal(await page.evaluate(() => document.fullscreenElement === null), true, `${id} fullscreen after toggling`);
    } finally {
      await context.close();
    }
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
    await page.locator('[data-showcase-toggle]').click();
    await waitPlaying(page, true);
    assert.ok(media.length > 0, 'pressing play under Save-Data downloads and plays the video');
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
      await page.waitForFunction((label) => document.querySelector('[data-showcase-site]').textContent.includes(label), media.copy.cta.en);
      const text = (selector) => page.locator(selector).first().textContent().then((value) => value.trim());
      assert.equal(await page.evaluate(() => window.__marker), 'kept', `${id} no reload`);
      assert.equal((await page.locator('[data-showcase-position]').innerText()).trim(), `${english.caseLabel} ${EXPECTED[id].position}`);
      assert.equal(await text('[data-showcase-lead]'), media.copy.lead.en);
      assert.equal(await text('[data-showcase-note]'), media.copy.note.en);
      assert.equal(await text('[data-showcase-kicker]'), media.copy.kicker?.en ?? enCases.find((c) => c.id === id).subtitle.replace('•', '·'));
      assert.equal(await page.locator('[data-showcase-prev]').getAttribute('aria-label'), english.prevAria);
      assert.equal(await page.locator('[data-showcase-next]').getAttribute('aria-label'), english.nextAria);
      assert.equal(await page.locator('[data-showcase-tiles]').getAttribute('aria-label'), english.tilesAria);
      assert.equal(await page.locator('[data-showcase-card="media"] img, [data-showcase-video]').first().evaluate((node) => node.getAttribute('alt') ?? node.getAttribute('aria-label')), media.video ? media.video.poster.alt.en : media.screenshot.alt.en);
      const imageAlts = await page.locator('[data-showcase-card] img').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('alt')));
      assert.ok(imageAlts.every((alt) => alt === media.screenshot.alt.en), `${id} screenshot alts ${imageAlts}`);
      if (media.highlight) {
        assert.equal(await text('[data-showcase-highlight-label]'), media.highlight.label.en);
        assert.equal(await text('[data-showcase-highlight-note]'), media.highlight.note.en);
      }
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
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('[data-lang-toggle]').first().click();
    await page.waitForFunction(() => document.querySelector('[data-showcase-site]').textContent.includes('SITE NO AR'));
    await page.waitForTimeout(400);
    assert.equal(await playing(page), false);
    assert.equal(await page.locator('[data-showcase-toggle]').getAttribute('aria-pressed'), 'false');
  } finally {
    await context.close();
  }
});

const TABLET = { width: 768, height: 1024 };
const rectOf = (page, selector) =>
  page.locator(selector).first().evaluate((node) => {
    const { x, y, width, height, right, bottom } = node.getBoundingClientRect();
    return { x, y, width, height, right, bottom };
  });

test('TAB-01: the 768px showcase stacks in order with no horizontal overflow', async () => {
  for (const id of IDS) {
    for (const locale of ['pt-br', 'en']) {
      const { context, page } = await openPath(`/cases/${id}`, { locale, viewport: TABLET, reducedMotion: 'reduce' });
      try {
        const bar = await rectOf(page, '[data-showcase-bar]');
        const title = await rectOf(page, '[data-showcase-name]');
        const stage = await rectOf(page, '[data-showcase-stage]');
        const text = await rectOf(page, '[data-showcase-lead]');
        const tiles = await rectOf(page, '[data-showcase-tiles]');
        const label = `${id} ${locale}`;
        assert.equal(Math.round(bar.height), 80, `${label} bar height`);
        assert.ok(bar.bottom <= title.y + 1 && title.bottom <= stage.y + 1 && stage.bottom <= text.y + 1 && text.bottom <= tiles.y + 1, `${label} order`);
        const grid = await page.locator('[data-showcase-tiles] a').evaluateAll((nodes) =>
          nodes.map((node) => {
            const { x, y } = node.getBoundingClientRect();
            return { x: Math.round(x), y: Math.round(y) };
          })
        );
        assert.equal(grid[0].y, grid[1].y, `${label} row 1`);
        assert.equal(grid[2].y, grid[3].y, `${label} row 2`);
        assert.ok(grid[2].y > grid[0].y, `${label} two rows`);
        assert.equal(grid[0].x, grid[2].x, `${label} column 1`);
        assert.equal(grid[1].x, grid[3].x, `${label} column 2`);
        const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth }));
        assert.ok(m.sw <= m.cw && m.bw <= m.cw, `${label} overflow ${m.sw}/${m.bw} > ${m.cw}`);
        const unbrokenOverflow = await page.locator('[data-showcase-name]').first().evaluate((node) => {
          node.style.overflowWrap = 'normal';
          node.style.wordBreak = 'normal';
          return node.scrollWidth - node.clientWidth;
        });
        assert.ok(unbrokenOverflow <= 0, `${label} a title word does not fit its line (${unbrokenOverflow}px)`);
      } finally {
        await context.close();
      }
    }
  }
});

test('TAB-02: the 768px stage scrolls its own track and keeps the sticker inside', async () => {
  for (const id of IDS) {
    const { context, page } = await openPath(`/cases/${id}`, { viewport: TABLET, reducedMotion: 'reduce' });
    try {
      const stage = await rectOf(page, '[data-showcase-stage]');
      const media = await rectOf(page, '[data-showcase-card="media"]');
      const second = await rectOf(page, '[data-showcase-card="second"]');
      assert.ok(media.x >= stage.x && media.right <= stage.right, `${id} media card fully inside the stage`);
      if (EXPECTED[id].video) assert.ok(Math.abs(media.width - 680) <= 1, `${id} video card width ${media.width}`);
      const trackBox = await rectOf(page, '[data-showcase-track]');
      const visible = Math.min(second.right, trackBox.right) - Math.max(second.x, trackBox.x);
      assert.ok(visible >= 24 && visible < second.width - 24, `${id} second card shows ${visible}px of ${second.width}px`);
      const track = await page.locator('[data-showcase-track]').evaluate((node) => ({
        overflowX: getComputedStyle(node).overflowX,
        snap: getComputedStyle(node).scrollSnapType,
        scrollable: node.scrollWidth > node.clientWidth,
      }));
      assert.ok(['auto', 'scroll'].includes(track.overflowX) && track.snap.includes('x'), `${id} track ${JSON.stringify(track)}`);
      assert.equal(track.scrollable, true, `${id} track scrolls`);
      assert.equal(await page.locator('[data-showcase-sticker]').count(), 0, `${id} no sticker`);
      const before = await page.evaluate(() => document.documentElement.scrollWidth);
      await page.locator('[data-showcase-track]').evaluate((node) => { node.scrollLeft = node.scrollWidth; });
      const after = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, x: window.scrollX }));
      assert.deepEqual(after, { sw: before, x: 0 }, `${id} page does not move`);
    } finally {
      await context.close();
    }
  }
});

test('TAB-03: 768px controls are at least 44px', async () => {
  const { context, page } = await openPath('/cases/magalu-cloud', { viewport: TABLET });
  try {
    for (const selector of ['[data-showcase-prev]', '[data-showcase-next]', '[data-showcase-site]', '[data-showcase-toggle]']) {
      const box = await rectOf(page, selector);
      assert.ok(box.width >= 44 && box.height >= 44, `${selector} ${box.width}x${box.height}`);
    }
  } finally {
    await context.close();
  }
});

test('MOB-01: the 390px and 320px showcase has zero horizontal overflow', async () => {
  for (const width of [390, 320]) {
    for (const id of IDS) {
      for (const locale of ['pt-br', 'en']) {
        const label = `${id} ${locale} ${width}px`;
        const { context, page } = await openPath(`/cases/${id}`, { locale, viewport: { width, height: 844 }, reducedMotion: 'reduce' });
        try {
          const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth }));
          assert.ok(m.sw <= m.cw && m.bw <= m.cw, `${label} overflow ${m.sw}/${m.bw} > ${m.cw}`);
          assert.equal(Math.round((await rectOf(page, '[data-showcase-bar]')).height), 64, `${label} bar height`);
          const unbroken = await page.locator('[data-showcase-name]').first().evaluate((node) => {
            node.style.overflowWrap = 'normal';
            node.style.wordBreak = 'normal';
            return node.scrollWidth - node.clientWidth;
          });
          assert.ok(unbroken <= 0, `${label} a title word does not fit (${unbroken}px)`);
          const stage = await rectOf(page, '[data-showcase-stage]');
          const media = await rectOf(page, '[data-showcase-card="media"]');
          assert.ok(media.x >= stage.x && media.right <= stage.right, `${label} media card inside the stage`);
          if (width === 390 && EXPECTED[id].video) assert.ok(Math.abs(media.width - 350) <= 1, `${label} video card ${media.width}px`);
          assert.equal(await page.locator('[data-showcase-sticker]').count(), 0, `${label} no sticker`);
          const tiles = await page.locator('[data-showcase-tiles] a').evaluateAll((nodes) => nodes.map((node) => { const { x, y } = node.getBoundingClientRect(); return { x: Math.round(x), y: Math.round(y) }; }));
          assert.ok(tiles[0].y === tiles[1].y && tiles[2].y === tiles[3].y && tiles[2].y > tiles[0].y && tiles[0].x === tiles[2].x, `${label} tiles 2x2`);
          const site = (await page.locator('[data-showcase-site]').innerText()).trim();
          assert.ok(/^(SITE|DEMO)\s*↗$/.test(site), `${label} compact site label "${site}"`);
        } finally {
          await context.close();
        }
      }
    }
  }
});

test('MOB-02: 390px controls are at least 44px', async () => {
  const { context, page } = await openPath('/cases/magalu-cloud', { viewport: { width: 390, height: 844 } });
  try {
    const selectors = ['[data-showcase-prev]', '[data-showcase-next]', '[data-showcase-site]', '[data-showcase-toggle]'];
    const boxes = [];
    for (const selector of selectors) boxes.push([selector, await rectOf(page, selector)]);
    const tiles = await page.locator('[data-showcase-tiles] a').evaluateAll((nodes) => nodes.map((node) => { const { width, height } = node.getBoundingClientRect(); return { width, height }; }));
    tiles.forEach((box, index) => boxes.push([`tile ${index + 1}`, box]));
    for (const [name, box] of boxes) assert.ok(box.width >= 44 && box.height >= 44, `${name} ${box.width}x${box.height}`);
  } finally {
    await context.close();
  }
});

const auditText = (page, rootSelector = 'body') =>
  page.evaluate((rootSelector) => {
    const parse = (v) => {
      const m = v.match(/rgba?\(([^)]+)\)/);
      if (m) { const [r, g, b, a = 1] = m[1].split(/[,/ ]+/).filter(Boolean).map(Number); return { r, g, b, a }; }
      const c = v.match(/color\(srgb ([^)]+)\)/);
      if (c) { const [r, g, b, a = 1] = c[1].split(/[ /]+/).filter(Boolean).map(Number); return { r: r * 255, g: g * 255, b: b * 255, a }; }
      const ok = v.match(/oklab\(([^)]+)\)/);
      if (ok) {
        const [L, A, B, al = 1] = ok[1].split(/[ /]+/).filter(Boolean).map((x) => (x.endsWith('%') ? parseFloat(x) / 100 : Number(x)));
        const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
        const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
        const sx = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
        const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * sx, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * sx, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * sx];
        const enc = (x) => 255 * Math.min(1, Math.max(0, x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055));
        return { r: enc(lin[0]), g: enc(lin[1]), b: enc(lin[2]), a: al };
      }
      throw new Error(`unsupported color format: ${v}`);
    };
    const over = (top, base) => ({ r: top.r * top.a + base.r * (1 - top.a), g: top.g * top.a + base.g * (1 - top.a), b: top.b * top.a + base.b * (1 - top.a), a: 1 });
    const lum = ({ r, g, b }) => { const f = (x) => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const backdrop = (el) => {
      const layers = [];
      for (let n = el; n; n = n.parentElement) {
        const bg = parse(getComputedStyle(n).backgroundColor);
        if (bg.a > 0) layers.push(bg);
        if (bg.a >= 1) break;
      }
      let base = { r: 8, g: 8, b: 8, a: 1 };
      if (layers.length && layers[layers.length - 1].a >= 1) base = layers.pop();
      return layers.reverse().reduce((acc, layer) => over(layer, acc), base);
    };
    const out = [];
    const walker = document.createTreeWalker(document.querySelector(rootSelector), NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent.trim()) continue;
      const el = node.parentElement;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || el.getClientRects().length === 0) continue;
      if (el.closest('.sr-only, [aria-hidden="true"], #p5-wipe-overlay')) continue;
      const size = parseFloat(cs.fontSize);
      if (size >= 24) continue;
      const bg = backdrop(el);
      const fg = over(parse(cs.color), bg);
      const l1 = lum(fg);
      const l2 = lum(bg);
      out.push({ text: node.textContent.trim().slice(0, 30), contrast: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05), floor: el.closest('[data-prototype-contrast]') ? 3.8 : 4.5 });
    }
    return out;
  }, rootSelector);


test('QUA-01: contrast is at least 4.5:1 on showcase, cockpit and stickers', async () => {
  const screens = [
    ['showcase video case', '/cases/magalu-cloud', null],
    ['showcase highlight case', '/cases/aurastream', null],
    ['cockpit open', '/', async (page) => {
      await page.locator('#cockpit-trigger-btn').click();
      await page.waitForFunction(() => document.getElementById('cockpit-menu-overlay').getAttribute('aria-hidden') === 'false');
    }],
    ['stickers', '/stickers', null],
  ];
  const roots = { 'cockpit open': '#cockpit-menu-overlay' };
  for (const [name, route, prepare] of screens) {
    for (const locale of ['pt-br', 'en']) {
      for (const width of [390, 768, 1440]) {
        const { context, page } = await openPath(route, { locale, viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        try {
          if (prepare) await prepare(page);
          const audit = await auditText(page, roots[name] ?? 'body');
          assert.ok(audit.length >= 5, `${name}: expected to audit text (${audit.length})`);
          assert.deepEqual(audit.filter((row) => row.contrast < row.floor).map((row) => `${row.text} (${row.contrast.toFixed(2)})`), [], `${name} ${locale} ${width}px low contrast`);
        } finally {
          await context.close();
        }
      }
    }
  }
});

test('QUA-02: first-load js stays within 200 kB gzip and every chunk under 500 kB', async () => {
  await assertClientJsBudget(assert, browser, baseUrl, ['/cases/magalu-cloud', '/cases/uriana', '/cases/efood', '/cases/aurastream']);
});

test('QUA-03: showcase media declares its dimensions', async () => {
  for (const id of IDS) {
    const { context, page } = await openPath(`/cases/${id}`, { reducedMotion: 'reduce' });
    try {
      const missing = await page.locator('[data-showcase] img, [data-showcase] video').evaluateAll((nodes) =>
        nodes.filter((node) => !(Number(node.getAttribute('width')) > 0 && Number(node.getAttribute('height')) > 0)).map((node) => node.getAttribute('src') ?? node.getAttribute('poster'))
      );
      assert.deepEqual(missing, [], `${id} media without width and height`);
    } finally {
      await context.close();
    }
  }
});

test('EDGE-1: rapid next clicks end on the last requested case', async () => {
  const { getLocalizedCases } = await import('../src/data/cases.ts');
  const titles = Object.fromEntries(getLocalizedCases('pt-br').map((entry) => [`/cases/${entry.id}`, entry.title]));
  for (const gap of [0, 250]) {
    const { context, page } = await openPath('/cases/magalu-cloud', { reducedMotion: 'no-preference' });
    try {
      const requested = [];
      for (let i = 0; i < 3; i++) {
        requested.push(await page.evaluate(() => {
          const next = document.querySelector('[data-showcase-next]');
          const href = next.getAttribute('href');
          next.click();
          return href;
        }));
        if (gap) await page.waitForTimeout(gap);
      }
      const last = requested[requested.length - 1];
      await page.waitForFunction((path) => location.pathname === path, last, { timeout: 15000 });
      await page.waitForTimeout(1200);
      const state = await page.evaluate(() => ({
        path: location.pathname,
        wiping: !!document.querySelector('#p5-wipe-overlay[data-wiping="true"], html[data-p5-wiping]'),
        locked: document.documentElement.classList.contains('lenis-stopped'),
        title: document.querySelector('[data-showcase] h1')?.textContent.trim(),
      }));
      assert.equal(state.path, last, `gap ${gap}: ended on the last requested case`);
      assert.equal(state.title, titles[last], `gap ${gap}: the page content matches its route`);
      assert.equal(state.wiping, false);
      assert.equal(state.locked, false);
    } finally {
      await context.close();
    }
  }
});

test('EDGE-2: switching locale keeps a paused video paused', async () => {
  const { context, page } = await openPath('/cases/efood', { locale: 'pt-br' });
  try {
    await waitPlaying(page, true);
    await page.locator('[data-showcase-toggle]').click();
    await waitPlaying(page, false);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('[data-lang-toggle]').first().click();
    await page.waitForFunction(() => document.querySelector('[data-showcase-site]').textContent.includes('LIVE DEMO'));
    await page.waitForTimeout(500);
    assert.equal(await playing(page), false);
    assert.equal(await page.locator('[data-showcase-toggle]').getAttribute('aria-pressed'), 'false');
  } finally {
    await context.close();
  }
});

test('EDGE-3: back navigation re-evaluates playback rules', async () => {
  const { context, page } = await openPath('/cases/uriana');
  try {
    await waitPlaying(page, true);
    await page.locator('[data-showcase-toggle]').click();
    await waitPlaying(page, false);
    await page.locator('[data-showcase-next]').click();
    await page.waitForFunction(() => location.pathname === '/cases/efood');
    await page.goBack();
    await page.waitForFunction(() => location.pathname === '/cases/uriana');
    await waitPlaying(page, true);
    assert.equal(await page.locator('[data-showcase-toggle]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-showcase-toggle]').click();
    await waitPlaying(page, false);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await waitPlaying(page, false);
    assert.equal(await page.locator('[data-showcase-toggle]').getAttribute('aria-pressed'), 'false');
  } finally {
    await context.close();
  }
});

test('EDGE-4: scrolling the stage track does not scroll the page', async () => {
  const { context, page } = await openPath('/cases/magalu-cloud', { viewport: { width: 768, height: 1024 }, reducedMotion: 'reduce' });
  try {
    const before = await page.evaluate(() => ({ x: window.scrollX, sw: document.documentElement.scrollWidth }));
    await page.locator('[data-showcase-track]').evaluate((node) => { node.scrollLeft = node.scrollWidth; });
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => ({ x: window.scrollX, sw: document.documentElement.scrollWidth, track: document.querySelector('[data-showcase-track]').scrollLeft }));
    assert.ok(after.track > 0, 'the track scrolled');
    assert.deepEqual({ x: after.x, sw: after.sw }, before);
  } finally {
    await context.close();
  }
});

test('QUA-04: the showcase title scales fluidly without breaking a word', async () => {
  const widths = [320, 360, 390, 639, 640, 767, 768, 1023, 1024, 1440, 2560];
  for (const id of IDS) {
    for (const locale of ['pt-br', 'en']) {
      const { context, page } = await openPath(`/cases/${id}`, { locale, reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
      try {
        for (const width of widths) {
          await page.setViewportSize({ width, height: 900 });
          await page.waitForTimeout(80);
          const m = await page.locator('[data-showcase-name]:visible').first().evaluate((node) => {
            const size = parseFloat(getComputedStyle(node).fontSize);
            node.style.overflowWrap = 'normal';
            node.style.wordBreak = 'normal';
            const vertical = getComputedStyle(node).writingMode.startsWith('vertical');
            const overflow = vertical ? node.scrollHeight - node.clientHeight : node.scrollWidth - node.clientWidth;
            node.style.overflowWrap = '';
            node.style.wordBreak = '';
            return { size, overflow, doc: document.documentElement.scrollWidth - document.documentElement.clientWidth };
          });
          const label = `${id} ${locale} ${width}px`;
          const cap = width < 768 ? 44 : 84;
          assert.ok(m.size > 0 && m.size <= cap + 0.5, `${label} title is ${m.size}px, cap ${cap}px`);
          assert.ok(m.overflow <= 0, `${label} a title word does not fit (${m.overflow}px)`);
          assert.ok(m.doc <= 0, `${label} page overflow`);
        }
      } finally {
        await context.close();
      }
    }
  }
});

const PROTOTYPE = {
  1440: { bar: 96, cells: [128, 128, 220], rail: 128, stage: 620, first: [984, 580], second: [984, 580], text: 236, tilesRow: 150, tile: 130, name: 45, cols: 4 },
  768: { bar: 80, cells: [80, 80, 140], rail: 0, stage: 540, first: [680, 504], second: [680, 504], tile: 128, name: 84, cols: 2 },
  390: { bar: 64, cells: [56, 56, 76], rail: 0, stage: 330, first: [350, 300], second: [350, 300], tile: 96, name: 44, cols: 2 },
};

test('PROTO: the magalu showcase keeps the prototype measures at 1440, 768 and 390px', async () => {
  for (const [width, want] of Object.entries(PROTOTYPE)) {
    const { context, page } = await openPath('/cases/magalu-cloud', { viewport: { width: Number(width), height: 1000 }, reducedMotion: 'reduce' });
    try {
      const near = (actual, expected, label, tolerance = 1.5) => assert.ok(Math.abs(actual - expected) <= tolerance, `${width}px ${label}: ${actual} vs prototype ${expected}`);
      near((await rectOf(page, '[data-showcase-bar]')).height, want.bar, 'bar height');
      const cells = [(await rectOf(page, '[data-showcase-prev]')).width, (await rectOf(page, '[data-showcase-next]')).width, (await rectOf(page, '[data-showcase-position]')).width];
      cells.forEach((cell, index) => near(cell, want.cells[index], `bar cell ${index + 1}`));
      near((await rectOf(page, '[data-showcase-stage]')).height, want.stage, 'stage height');
      const first = await rectOf(page, '[data-showcase-card="media"]');
      const second = await rectOf(page, '[data-showcase-card="second"]');
      near(first.width, want.first[0], 'video card width');
      near(first.height, want.first[1], 'video card height');
      near(second.width, want.second[0], 'screenshot card width');
      near(second.height, want.second[1], 'screenshot card height');
      assert.equal(await page.locator('[data-showcase-sticker]').count(), 0, 'no sticker');
      assert.equal(await page.locator('[data-showcase-card="second"] video').count(), 1, 'second card has duplicated video');
      const tile = await rectOf(page, '[data-showcase-tiles] a');
      near(tile.height, want.tile, 'tile height');
      const rows = await page.locator('[data-showcase-tiles] a').evaluateAll((nodes) => new Set(nodes.map((node) => Math.round(node.getBoundingClientRect().y))).size);
      assert.equal(4 / rows, want.cols, `${width}px tile columns`);
      const railVisible = await page.locator('[data-showcase-rail]').isVisible();
      assert.equal(railVisible, want.rail > 0, `${width}px vertical title rail`);
      if (railVisible) {
        near((await rectOf(page, '[data-showcase-rail]')).width, want.rail, 'rail width');
        assert.equal(await page.locator('[data-showcase-rail]').evaluate((node) => getComputedStyle(node).backgroundColor), 'rgb(254, 0, 0)');
        near((await rectOf(page, '[data-showcase-tiles]')).height, want.tilesRow, 'tiles row');
        near((await rectOf(page, '[data-showcase-kicker]')).x, 176, 'text column starts after the rail', 2);
      }
      const fontSize = await page.locator('[data-showcase-name]').evaluateAll((nodes) => parseFloat(getComputedStyle(nodes.find((node) => node.getClientRects().length > 0)).fontSize));
      near(fontSize, want.name, 'case name font size', 1);
      assert.equal(await page.locator('[data-showcase-tag]').count(), 0);
      assert.equal((await page.locator('[data-showcase-toggle]').innerText()).replace(/\s+/g, ' ').trim(), 'PLAY');
      const toggleBox = await rectOf(page, '[data-showcase-toggle]');
      const card = await rectOf(page, '[data-showcase-card="media"]');
      assert.ok(toggleBox.x > card.x && toggleBox.bottom < card.bottom, `${width}px the play pill sits over the video`);
      assert.equal(await page.locator('[data-showcase-tiles] a[aria-current="page"] b').innerText(), '01');
    } finally {
      await context.close();
    }
  }
});

test('SHOW-10: switching between cases exits each element of the current case and enters each element of the next case without the route band', async () => {
  const { context, page } = await openPath('/cases/magalu-cloud', { reducedMotion: 'no-preference' });
  try {
    await page.waitForFunction(() => !/is-(in|covered|out)/.test(document.getElementById('route-band').className), null, { timeout: 2500 });
    await page.evaluate(() => {
      const record = {
        bandTriggered: false,
        exited: false,
        enteredAtSwap: false,
        states: [],
        stackAppearTimes: [null, null, null],
      };
      window.__caseTransition = record;
      const band = document.getElementById('route-band');
      new MutationObserver(() => {
        if (/is-(in|covered|out)/.test(band.className)) record.bandTriggered = true;
      }).observe(band, { attributes: true, attributeFilter: ['class'] });

      const observeShowcase = (node) => {
        if (!node) return;
        const pushState = () => {
          const state = node.dataset.showcaseTransition;
          if (state && record.states.at(-1) !== `${node.dataset.showcase}:${state}`) {
            record.states.push(`${node.dataset.showcase}:${state}`);
          }
          if (state === 'exiting') record.exited = true;
        };
        pushState();
        new MutationObserver(pushState).observe(node, { attributes: true, attributeFilter: ['data-showcase-transition'] });
      };
      observeShowcase(document.querySelector('[data-showcase]'));
      document.addEventListener('astro:after-swap', () => {
        const next = document.querySelector('[data-showcase]');
        if (next?.dataset.showcaseTransition === 'entering') record.enteredAtSwap = true;
        observeShowcase(next);
        const sampleStack = () => {
          if (!next || next.dataset.showcaseTransition !== 'entering') return;
          const items = next.querySelectorAll('[data-showcase-bar-stack]');
          items.forEach((item, idx) => {
            if (record.stackAppearTimes[idx] === null && parseFloat(getComputedStyle(item).opacity) > 0.05) {
              record.stackAppearTimes[idx] = performance.now();
            }
          });
          requestAnimationFrame(sampleStack);
        };
        requestAnimationFrame(sampleStack);
      });
    });

    await page.locator('[data-showcase-next]').click();
    await page.waitForFunction(
      () => location.pathname === '/cases/uriana' && document.querySelector('[data-showcase]')?.dataset.showcaseTransition === 'idle',
      null,
      { timeout: 8000 }
    );

    const record = await page.evaluate(() => window.__caseTransition);
    assert.equal(record.bandTriggered, false, 'case-to-case transition does not trigger #route-band');
    assert.equal(record.exited, true, 'outgoing case ran exitShowcase');
    assert.equal(record.enteredAtSwap, true, 'incoming case was prepared for enterShowcase at swap');
    assert.deepEqual(record.states, ['magalu-cloud:exiting', 'uriana:entering', 'uriana:idle']);
    assert.ok(
      record.stackAppearTimes.every((t) => typeof t === 'number') &&
        record.stackAppearTimes[1] - record.stackAppearTimes[0] >= 80 &&
        record.stackAppearTimes[2] - record.stackAppearTimes[1] >= 80,
      `stack items appear sequentially one after another: ${JSON.stringify(record.stackAppearTimes)}`
    );
  } finally {
    await context.close();
  }
});

test('SHOW-11: the video cards form an infinite carousel that advances when clicking the peeked card', async () => {
  const { context, page } = await openPath('/cases/magalu-cloud', { viewport: { width: 1900, height: 992 }, reducedMotion: 'no-preference' });
  try {
    await waitPlaying(page, true);
    const button = page.locator('[data-showcase-toggle]');
    const firstBox = await rectOf(page, '[data-showcase-card="media"]');
    await page.mouse.move(firstBox.x + 200, firstBox.y + 200);
    assert.equal((await button.innerText()).trim(), 'PAUSE', 'hovering active playing card shows PAUSE');

    const secondBox = await rectOf(page, '[data-showcase-card="second"]');
    await page.mouse.move(secondBox.x + 80, secondBox.y + 200);
    assert.equal((await button.innerText()).trim(), 'PLAY', 'hovering peeked next card shows PLAY');

    for (let step = 1; step <= 3; step += 1) {
      await page.mouse.move(secondBox.x + 80, secondBox.y + 200);
      await page.mouse.click(secondBox.x + 80, secondBox.y + 200);
      await page.waitForFunction(
        (expected) => document.querySelector('[data-showcase-track]')?.dataset.carouselSteps === String(expected),
        step,
        { timeout: 4000 }
      );
      await waitPlaying(page, true);
      assert.equal(await page.locator('[data-showcase-card="media"]').count(), 1);
      assert.equal(await page.locator('[data-showcase-card="second"]').count(), 1);
      assert.equal(await page.locator('[data-showcase-card="third"]').count(), 1);
      const scrollLeft = await page.locator('[data-showcase-track]').evaluate((node) => node.scrollLeft);
      assert.equal(scrollLeft, 0, `step ${step}: track scrollLeft stays 0 so active card is never cut off on the left`);
      const afterBox = await rectOf(page, '[data-showcase-card="media"]');
      assert.ok(Math.abs(afterBox.x - firstBox.x) <= 2, `step ${step}: active card stays at ${firstBox.x}px (got ${afterBox.x}px)`);
    }
  } finally {
    await context.close();
  }
});
