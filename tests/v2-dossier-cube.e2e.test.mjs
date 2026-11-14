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

const { ptBrDict } = await import('../src/i18n/dictionaries.ts');
const BRAND_TONES = ['rgb(254, 0, 0)', 'rgb(163, 0, 0)', 'rgb(8, 8, 8)', 'rgb(43, 43, 43)', 'rgb(251, 250, 244)', 'rgb(217, 213, 199)'];

async function openHome({ viewport = { width: 1440, height: 900 }, ...contextOptions } = {}) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  if (contextOptions.javaScriptEnabled !== false) {
    await page.evaluate(() => {
      const intro = document.getElementById('intro-preloader');
      if (intro) {
        intro.click();
        intro.remove();
      }
      window.dispatchEvent(new CustomEvent('intro-complete'));
    });
  }
  return { context, page };
}

const startCubeRecorder = (page) =>
  page.evaluate(() => {
    const host = document.querySelector('[data-about-portrait]');
    const record = { phases: [], snapshots: {}, overflow: 0, frames: 0, stickerShown: 0, portraitShown: 0, thirdInView: null };
    const frameBox = document.querySelector('[data-about-portrait-frame]');
    const slicesShown = (stage, kind) => {
      const slices = [...stage.querySelectorAll(`[data-cube-slice="${kind}"]`)];
      return slices.length === 9 ? Math.min(...slices.map((slice) => Number(getComputedStyle(slice).opacity))) : 0;
    };
    window.__cube = record;
    const matrixOf = (element) => {
      const transform = getComputedStyle(element).transform;
      return transform === 'none' ? new DOMMatrix() : new DOMMatrix(transform);
    };
    // The face a sticker shows on screen, read from the rendered transforms of its piece and itself.
    const shownFacing = (sticker) => {
      const normal = matrixOf(sticker.parentElement).multiply(matrixOf(sticker)).transformPoint(new DOMPoint(0, 0, 1, 0));
      const axes = [['x', normal.x], ['y', normal.y], ['z', normal.z]];
      const [axis, value] = axes.reduce((best, entry) => (Math.abs(entry[1]) > Math.abs(best[1]) ? entry : best));
      return `${value > 0 ? '+' : '-'}${axis}`;
    };
    const snapshot = (stage) => {
      const stickers = [...stage.querySelectorAll('[data-cube-sticker]')];
      const faces = {};
      for (const sticker of stickers) (faces[shownFacing(sticker)] ??= []).push(sticker.dataset.cubeSticker);
      const front = stickers.filter((sticker) => shownFacing(sticker) === '+z');
      return {
        pieces: stage.querySelectorAll('[data-cube-piece]').length,
        stickers: stickers.length,
        colours: [...new Set(stickers.map((sticker) => getComputedStyle(sticker).backgroundColor))],
        faces,
        stickerSlices: front.map((sticker) => sticker.querySelector('[data-cube-slice="sticker"]')?.style.backgroundImage ?? ''),
        portraitSlices: front.map((sticker) => sticker.querySelector('[data-cube-slice="portrait"]')?.style.backgroundImage ?? ''),
        frameOpacity: Number(getComputedStyle(document.querySelector('[data-about-portrait-frame]')).opacity),
      };
    };
    let last = null;
    const sample = () => {
      const stage = host.querySelector('[data-dossier-cube]');
      const phase = stage ? stage.dataset.dossierCube : record.phases.length ? 'gone' : null;
      if (phase && phase !== last) {
        record.phases.push({ phase, at: performance.now() });
        if (stage) record.snapshots[phase] = snapshot(stage);
        last = phase;
      }
      record.frames += 1;
      if (record.thirdInView === null) {
        const rect = frameBox.getBoundingClientRect();
        const visible = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
        if (rect.height > 0 && visible / rect.height >= 0.35) record.thirdInView = performance.now();
      }
      if (stage) {
        record.stickerShown = Math.max(record.stickerShown, slicesShown(stage, 'sticker'));
        record.portraitShown = Math.max(record.portraitShown, slicesShown(stage, 'portrait'));
      }
      record.overflow = Math.max(record.overflow, document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (phase !== 'gone' || record.frames < 5) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

async function scrollToPortrait(page) {
  await page.evaluate(() => {
    const box = document.querySelector('[data-about-portrait]');
    window.scrollTo(0, box.getBoundingClientRect().top + window.scrollY - Math.max(0, (window.innerHeight - box.offsetHeight) / 2));
  });
}

test('the portrait sits centred in its column, level with the text', async () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1024, height: 800 }, { width: 1440, height: 900 }, { width: 2560, height: 1440 }]) {
    const { context, page } = await openHome({ viewport, reducedMotion: 'reduce' });
    try {
      const boxes = await page.evaluate(() => {
        const read = (selector) => {
          const rect = document.querySelector(selector).getBoundingClientRect();
          return { centreX: rect.left + rect.width / 2, top: rect.top };
        };
        return { column: read('[data-about-avatar-panel]'), portrait: read('[data-about-portrait]'), text: read('[data-about-content-panel]'), bio: read('[data-about-card="bio"]') };
      });
      assert.ok(Math.abs(boxes.portrait.centreX - boxes.column.centreX) <= 1, `${viewport.width}px: the portrait is centred across its column (${boxes.portrait.centreX} vs ${boxes.column.centreX})`);
      if (viewport.width >= 1024) {
        assert.ok(Math.abs(boxes.column.top - boxes.text.top) <= 1, `${viewport.width}px: the portrait column starts level with the text column (${boxes.column.top} vs ${boxes.text.top})`);
        assert.ok(Math.abs(boxes.portrait.top - boxes.bio.top) <= 1, `${viewport.width}px: the portrait starts level with the bio card (${boxes.portrait.top} vs ${boxes.bio.top})`);
      }
    } finally {
      await context.close();
    }
  }
});

test('a scrambled Rubik cube solves itself into the portrait', async () => {
  const { context, page } = await openHome();
  try {
    assert.equal(await page.locator('[data-dossier-cube]').count(), 0, 'no cube before the portrait is reached');
    await startCubeRecorder(page);
    await scrollToPortrait(page);
    await page.waitForFunction(() => window.__cube.phases.some((entry) => entry.phase === 'gone'), null, { timeout: 8000 });
    const record = await page.evaluate(() => window.__cube);
    const startedAt = Number(await page.locator('[data-about-portrait]').getAttribute('data-cube-started-at'));

    assert.deepEqual(record.phases.map((entry) => entry.phase), ['scrambled', 'solving', 'solved', 'sticker', 'portrait', 'gone']);
    const scrambled = record.snapshots.scrambled;
    assert.equal(scrambled.pieces, 27, '27 pieces');
    assert.equal(scrambled.stickers, 54, '54 stickers');
    assert.ok(scrambled.frameOpacity === 0, 'the framed portrait waits behind the cube');
    const mixed = Object.values(scrambled.faces).filter((homes) => new Set(homes).size > 1);
    assert.ok(mixed.length >= 4, `the cube starts scrambled (${mixed.length} mixed faces)`);

    const solved = record.snapshots.solved;
    assert.deepEqual(Object.keys(solved.faces).sort(), ['+x', '+y', '+z', '-x', '-y', '-z']);
    for (const [facing, homes] of Object.entries(solved.faces)) {
      assert.equal(homes.length, 9, `${facing} has nine stickers`);
      assert.equal(new Set(homes).size, 1, `${facing} is one colour once solved`);
    }
    for (const colour of solved.colours) assert.ok(BRAND_TONES.includes(colour), `${colour} is a brand tone`);

    const sticker = record.snapshots.sticker;
    assert.equal(sticker.stickerSlices.length, 9, 'nine front stickers');
    for (const image of sticker.stickerSlices) assert.match(image, /\/stickers\/sticker-04\.svg/, 'sticker 04 is spread over the front');
    const portrait = record.snapshots.portrait;
    for (const image of portrait.portraitSlices) assert.match(image, /brinu-avatar\.jpg/, 'the front settles into the Dossier portrait');
    assert.ok(record.stickerShown >= 0.99, `all nine sticker 04 slices become fully visible (${record.stickerShown})`);
    assert.ok(record.portraitShown >= 0.99, `all nine portrait slices become fully visible (${record.portraitShown})`);

    const end = record.phases.at(-1).at;
    assert.ok(record.thirdInView !== null, 'a third of the portrait came into view');
    assert.ok(startedAt - record.thirdInView <= 100, `the cube starts as 35% of the portrait is on screen (${Math.round(startedAt - record.thirdInView)} ms later)`);
    assert.ok(end - record.thirdInView <= 4000, `the sequence ends within 4 s of that moment (${Math.round(end - record.thirdInView)} ms)`);
    const final = await page.evaluate(() => {
      const image = document.getElementById('about-official-avatar');
      return {
        frameOpacity: Number(getComputedStyle(document.querySelector('[data-about-portrait-frame]')).opacity),
        imageShown: image.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
        alt: image.getAttribute('alt'),
      };
    });
    assert.deepEqual(final, { frameOpacity: 1, imageShown: true, alt: ptBrDict.about.portraitAlt }, 'only the framed portrait remains, with its alt text');
    assert.ok(record.overflow <= 0, 'the cube never widens the page');

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await scrollToPortrait(page);
    await page.waitForTimeout(800);
    assert.equal(await page.locator('[data-dossier-cube]').count(), 0, 'the cube plays once per page load');
  } finally {
    await context.close();
  }
});

test('reduced motion and no JavaScript show the portrait at once', async () => {
  for (const options of [{ reducedMotion: 'reduce' }, { javaScriptEnabled: false }]) {
    const label = options.reducedMotion ? 'reduced motion' : 'no JavaScript';
    const { context, page } = await openHome(options);
    try {
      await scrollToPortrait(page);
      await page.waitForTimeout(500);
      assert.equal(await page.locator('[data-dossier-cube]').count(), 0, `${label}: no cube`);
      const opacity = await page.locator('[data-about-portrait-frame]').evaluate((frame) => Number(getComputedStyle(frame).opacity));
      assert.equal(opacity, 1, `${label}: the framed portrait shows`);
      assert.equal(await page.locator('#about-official-avatar').isVisible(), true);
    } finally {
      await context.close();
    }
  }
});

test('the cube never widens the page from 320 to 2560 px', async () => {
  for (const viewport of [{ width: 320, height: 640 }, { width: 768, height: 1024 }, { width: 2560, height: 1440 }]) {
    const { context, page } = await openHome({ viewport });
    try {
      await startCubeRecorder(page);
      await scrollToPortrait(page);
      await page.waitForFunction(() => window.__cube.phases.some((entry) => entry.phase === 'gone'), null, { timeout: 8000 });
      const record = await page.evaluate(() => window.__cube);
      assert.ok(record.phases.length >= 5, `${viewport.width}px: the cube plays`);
      assert.ok(record.overflow <= 0, `${viewport.width}px: no horizontal overflow while the cube plays (${record.overflow}px)`);
    } finally {
      await context.close();
    }
  }
});

test('each square of the cube shows a different sticker', async () => {
  const { STICKER_FILES } = await import('../src/data/sticker-files.ts');
  const { context, page } = await openHome();
  try {
    await scrollToPortrait(page);
    await page.waitForFunction(() => document.querySelector('[data-dossier-cube]')?.dataset.dossierCube === 'solving');
    const squares = await page.evaluate(() =>
      [...document.querySelectorAll('[data-dossier-cube] [data-cube-sticker]')].map((sticker) => {
        const photo = sticker.querySelector('[data-cube-photo]');
        const box = photo?.getBoundingClientRect();
        const outer = sticker.getBoundingClientRect();
        return {
          image: photo ? getComputedStyle(photo).backgroundImage : '',
          inside: photo ? box.width > 0 && box.width < outer.width + 0.5 : false,
          bordered: photo ? getComputedStyle(sticker).backgroundColor !== 'rgba(0, 0, 0, 0)' : false,
        };
      })
    );
    assert.equal(squares.length, 54, '54 squares');
    const files = squares.map((square) => square.image.match(/\/stickers\/sticker-\d{2}\.svg/)?.[0] ?? '');
    assert.equal(new Set(files).size, 54, 'every square shows a different sticker');
    for (const file of files) {
      assert.ok(STICKER_FILES.includes(file), `${file || '(none)'} comes from the sticker library`);
      assert.notEqual(file, '/stickers/sticker-04.svg', 'sticker 04 is kept for the front');
    }
    assert.ok(squares.every((square) => square.inside && square.bordered), 'each photo sits inside a square of its face colour');
    const loaded = await page.evaluate(async (urls) => {
      const results = await Promise.all(urls.map((url) => fetch(url).then((response) => response.ok && response.headers.get('content-type')?.includes('svg'))));
      return results.every(Boolean);
    }, files);
    assert.equal(loaded, true, 'every sticker file loads');
  } finally {
    await context.close();
  }
});
