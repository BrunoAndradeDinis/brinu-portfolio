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
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

let server;
let baseUrl = '';
let browser;

async function dismissIntroIfPresent(page) {
  await page.evaluate(() => {
    const el = document.getElementById('intro-preloader');
    if (el) {
      el.click();
      el.remove();
    }
    window.dispatchEvent(new CustomEvent('intro-complete'));
  });
}

async function openHome(locale = 'pt-br', contextOptions = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...contextOptions,
  });
  const page = await context.newPage();
  await page.addInitScript((loc) => {
    window.localStorage.setItem('brinu_locale', loc);
  }, locale);
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await dismissIntroIfPresent(page);
  return { context, page };
}

before(async () => {
  const distDir = path.resolve('dist');
  server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
    let pathname = decodeURIComponent(reqUrl.pathname);
    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    } else if (!path.extname(pathname)) {
      pathname += '/index.html';
    }
    const filePath = path.join(distDir, pathname);
    if (!filePath.startsWith(distDir) || !fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });

  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  if (fs.existsSync('/usr/bin/google-chrome')) {
    launchOptions.executablePath = '/usr/bin/google-chrome';
  }
  browser = await chromium.launch(launchOptions);
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});



const ACCENTS = ['#EBA602', '#30B5BB', '#2B3A8C', '#30B5BB', '#EBA602', '#EBA602'];
const BRAND = ['#FE0000', '#080808', '#FBFAF4'];

test('C3: each background keeps to the brand palette plus its accent at most 15%', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    for (let i = 1; i <= 6; i++) {
      const stats = await page.evaluate(async ({ url, brand, accent }) => {
        const img = new Image();
        img.src = url;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 1120;
        canvas.height = 728;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 1120, 728);
        const data = ctx.getImageData(0, 0, 1120, 728).data;
        const toRgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
        const near = (r, g, b, c) => Math.hypot(r - c[0], g - c[1], b - c[2]) <= 60;
        const brandRgb = brand.map(toRgb);
        const accentRgb = toRgb(accent);
        let inPalette = 0;
        let accentPixels = 0;
        const total = 1120 * 728;
        for (let p = 0; p < data.length; p += 4) {
          const r = data[p], g = data[p + 1], b = data[p + 2];
          if (near(r, g, b, accentRgb)) { accentPixels++; inPalette++; }
          else if (brandRgb.some((c) => near(r, g, b, c))) inPalette++;
        }
        return { inPalette: inPalette / total, accent: accentPixels / total };
      }, { url: `${baseUrl}/assets/filmstrip/passion-bg-${i}.svg`, brand: BRAND, accent: ACCENTS[i - 1] });
      assert.ok(stats.inPalette >= 0.9, `bg ${i}: only ${(stats.inPalette * 100).toFixed(1)}% of pixels in palette`);
      assert.ok(stats.accent <= 0.15, `bg ${i}: accent covers ${(stats.accent * 100).toFixed(1)}%`);
      assert.ok(stats.accent > 0.005, `bg ${i}: accent should be visible (${(stats.accent * 100).toFixed(2)}%)`);
    }
  } finally {
    await context.close();
  }
});

test('C4: rendered frames show the six backgrounds in order', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    const srcs = await page.locator('[data-passion-slide] img').evaluateAll((els) => els.map((el) => new URL(el.src).pathname));
    assert.deepEqual(srcs, [1, 2, 3, 4, 5, 6].map((n) => `/assets/filmstrip/passion-bg-${n}.svg`));
    const loaded = await page.locator('[data-passion-slide] img').evaluateAll((els) => els.map((el) => el.complete && el.naturalWidth > 0));
    assert.deepEqual(loaded, [true, true, true, true, true, true], 'every background must load');
  } finally {
    await context.close();
  }
});

import { PASSION_DECK, FORBIDDEN_PHRASES } from './fixtures/passion-reel/deck.mjs';

const TAGS = {
  'pt-br': ['FRAME 01 // BANDA MEDULLA', 'FRAME 02 // ONE PIECE', 'FRAME 03 // COWBOY BEBOP', 'FRAME 04 // AKIRA 1988', 'FRAME 05 // CAFÉ ESPECIAL', 'FRAME 06 // CULINÁRIA & STREET FOOD'],
  en: ['FRAME 01 // MEDULLA BAND', 'FRAME 02 // ONE PIECE', 'FRAME 03 // COWBOY BEBOP', 'FRAME 04 // AKIRA 1988', 'FRAME 05 // SPECIALTY COFFEE', 'FRAME 06 // GASTRONOMY & STREET FOOD'],
};

const readFrames = (page) =>
  page.locator('[data-passion-slide]').evaluateAll((slides) =>
    slides.map((slide) => {
      const t = (sel) => slide.querySelector(sel).textContent.replace(/\s+/g, ' ').trim();
      const card = slide.querySelectorAll('[data-passion-card] > span');
      return {
        tag: t('[data-passion-tag]'),
        headline: t('[data-passion-headline]'),
        credits: t('[data-passion-credits]'),
        highlight: t('[data-passion-highlight]'),
        cardTitle: card[0].textContent.trim(),
        cardSub: card[1].textContent.trim(),
        alt: slide.querySelector('img').getAttribute('alt'),
      };
    }),
  );

const toggleLocale = async (page) => {
  await page.locator('#nav-lang-toggle-btn').dispatchEvent('click');
  await page.waitForTimeout(400);
};

test('C5: each frame renders the pt-br copy deck as HTML text', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    const frames = await readFrames(page);
    assert.equal(frames.length, 6);
    frames.forEach((frame, i) => {
      assert.equal(frame.tag, TAGS['pt-br'][i], `tag ${i + 1}`);
      for (const field of ['headline', 'credits', 'highlight', 'cardTitle', 'cardSub']) {
        assert.equal(frame[field], PASSION_DECK['pt-br'][i][field], `frame ${i + 1} ${field}`);
      }
    });
  } finally {
    await context.close();
  }
});

test('C6: switching to en renders the English copy deck', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    await toggleLocale(page);
    assert.equal(await page.evaluate(() => localStorage.getItem('brinu_locale')), 'en');
    const frames = await readFrames(page);
    frames.forEach((frame, i) => {
      assert.equal(frame.tag, TAGS.en[i], `tag ${i + 1}`);
      for (const field of ['headline', 'credits', 'highlight', 'cardTitle', 'cardSub']) {
        assert.equal(frame[field], PASSION_DECK.en[i][field], `frame ${i + 1} ${field}`);
      }
    });
  } finally {
    await context.close();
  }
});

test('C7: headline uses the display font and other lines the mono font', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    const result = await page.evaluate(() => {
      const first = (v) => v.split(',')[0].trim().replace(/^["']|["']$/g, '').toLowerCase();
      const root = getComputedStyle(document.documentElement);
      const display = first(root.getPropertyValue('--font-display'));
      const mono = first(root.getPropertyValue('--font-mono'));
      const families = (sel) => [...document.querySelectorAll(`[data-passion-slide] ${sel}`)].map((el) => first(getComputedStyle(el).fontFamily));
      return {
        display, mono,
        headline: families('[data-passion-headline]'),
        credits: families('[data-passion-credits]'),
        highlight: families('[data-passion-highlight]'),
        card: families('[data-passion-card] > span'),
      };
    });
    assert.ok(result.display && result.display !== 'sans-serif', `display font token was "${result.display}"`);
    assert.ok(result.mono && result.mono !== 'sans-serif' && result.mono !== 'monospace', `mono font token was "${result.mono}"`);
    assert.deepEqual(result.headline, Array(6).fill(result.display));
    assert.deepEqual(result.credits, Array(6).fill(result.mono));
    assert.deepEqual(result.highlight, Array(6).fill(result.mono));
    assert.deepEqual(result.card, Array(12).fill(result.mono));
  } finally {
    await context.close();
  }
});

test('C8: removed third-party phrases do not appear in the passion frames', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    for (const locale of ['pt-br', 'en']) {
      if (locale === 'en') await toggleLocale(page);
      const text = (await page.locator('[data-passion-slide]').evaluateAll((els) => els.map((el) => el.textContent + ' ' + el.querySelector('img').alt).join(' '))).toLowerCase();
      for (const phrase of FORBIDDEN_PHRASES) assert.ok(!text.includes(phrase), `${locale}: frames still show "${phrase}"`);
    }
    const html = fs.readFileSync('dist/index.html', 'utf8').toLowerCase();
    for (const phrase of FORBIDDEN_PHRASES) {
      const inFrames = html.split('data-passion-slide').slice(1).join(' ').includes(phrase);
      assert.equal(inFrames, false, `built HTML frames still contain "${phrase}"`);
    }
  } finally {
    await context.close();
  }
});

test('C14: each frame image keeps a translated non-empty alt', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    const pt = (await readFrames(page)).map((f) => f.alt);
    await toggleLocale(page);
    const en = (await readFrames(page)).map((f) => f.alt);
    pt.forEach((alt, i) => {
      assert.ok(alt && alt.trim().length > 10, `pt alt ${i + 1} empty`);
      assert.ok(en[i] && en[i].trim().length > 10, `en alt ${i + 1} empty`);
      assert.notEqual(alt, en[i], `alt ${i + 1} must be translated`);
    });
  } finally {
    await context.close();
  }
});

test('C17: locale change keeps the passion frame nodes', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    await page.evaluate(() => {
      document.querySelectorAll('[data-passion-slide], [data-passion-slide] [data-passion-headline], [data-passion-slide] img').forEach((el, i) => { el.__marker = `n${i}`; });
    });
    const before = await readFrames(page);
    await toggleLocale(page);
    const after = await readFrames(page);
    assert.notEqual(before[4].headline, after[4].headline, 'precondition: the text did change');
    const kept = await page.evaluate(() =>
      [...document.querySelectorAll('[data-passion-slide], [data-passion-slide] [data-passion-headline], [data-passion-slide] img')].every((el) => typeof el.__marker === 'string'));
    assert.equal(kept, true, 'frame nodes must survive a locale change');
  } finally {
    await context.close();
  }
});
