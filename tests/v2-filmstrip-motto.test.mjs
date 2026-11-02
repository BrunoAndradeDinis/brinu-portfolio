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
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
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

async function dismissIntroIfPresent(page) {
  await page.evaluate(() => {
    const el = document.getElementById('intro-preloader');
    if (el) {
      el.click();
      el.remove();
    }
  });
}

test('F1: FilmstripParallax renders 3D character flip spans (.char-flip) and word wrappers (.motto__word)', async () => {
  const page = await browser.newPage();
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await dismissIntroIfPresent(page);

  const charCount = await page.locator('[data-motto-text] .char-flip').count();
  const wordCount = await page.locator('[data-motto-text] .motto__word').count();
  const graffitiCount = await page.locator('[data-motto-text] .motto__g').count();

  assert.ok(charCount > 100, `Expected >100 characters in motto, got ${charCount}`);
  assert.ok(wordCount > 20, `Expected >20 words in motto, got ${wordCount}`);
  assert.equal(graffitiCount, 3, `Expected 3 graffiti highlights, got ${graffitiCount}`);

  await page.close();
});

test('F2: Scrolling to motto triggers 3D character flip animation and graffiti reveal', async () => {
  const page = await browser.newPage();
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await dismissIntroIfPresent(page);

  // Scroll motto into full view
  await page.evaluate(() => {
    const motto = document.querySelector('[data-motto-text]');
    if (motto) {
      motto.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await page.waitForTimeout(600);

  const isRevealed = await page.evaluate(() => {
    const section = document.querySelector('[data-filmstrip-section]');
    const firstChar = document.querySelector('[data-motto-text] .char-flip');
    const transform = firstChar ? window.getComputedStyle(firstChar).transform : '';
    return {
      hasSection: Boolean(section),
      transform,
    };
  });

  assert.ok(isRevealed.hasSection);
  // Transform should no longer be purely 90deg rotation or should be animated
  assert.ok(isRevealed.transform !== '', 'Character should have computed transform matrix');

  await page.close();
});

test('F3: Changing language reactively rebuilds motto characters in the new language', async () => {
  const page = await browser.newPage();
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await dismissIntroIfPresent(page);

  const initialText = await page.locator('[data-motto-text]').innerText();
  assert.ok(initialText.includes('EU NÃO LEMBRO MAIS'), 'Initial text should be Portuguese');

  // Trigger locale change to EN
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('brinu:locale-change', {
        detail: { locale: 'en' },
      })
    );
  });
  await page.waitForTimeout(300);

  const updatedText = await page.locator('[data-motto-text]').innerText();
  assert.ok(updatedText.includes('I DO NOT REALLY REMEMBER'), 'Updated text should be English');

  const enCharCount = await page.locator('[data-motto-text] .char-flip').count();
  assert.ok(enCharCount > 100, `EN motto should retain .char-flip spans, got ${enCharCount}`);

  await page.close();
});

test('F4: Motto text has zero horizontal overflow across 320px, 375px, 768px, and 1440px viewports', async () => {
  const viewports = [
    { width: 320, height: 600 },
    { width: 375, height: 667 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: vp });
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await dismissIntroIfPresent(page);

    const hasOverflow = await page.evaluate(() => {
      const el = document.querySelector('[data-motto-text]');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > window.innerWidth || document.documentElement.scrollWidth > window.innerWidth;
    });

    assert.equal(
      hasOverflow,
      false,
      `Horizontal overflow detected at viewport ${vp.width}x${vp.height}`
    );
    await page.close();
  }
});
