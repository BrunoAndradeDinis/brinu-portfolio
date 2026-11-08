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
