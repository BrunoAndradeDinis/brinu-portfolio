import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};
let server;
let baseUrl = '';
let browser;

before(async () => {
  const distDir = path.resolve('dist');
  server = http.createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url || '/', 'http://127.0.0.1').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const filePath = path.join(distDir, pathname);
    if (!filePath.startsWith(distDir) || !fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', () => {
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    resolve();
  }));
  const launchOptions = { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  if (fs.existsSync('/usr/bin/google-chrome')) launchOptions.executablePath = '/usr/bin/google-chrome';
  browser = await chromium.launch(launchOptions);
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

const closeBox = (page, selector) =>
  page.evaluate((dialogSelector) => {
    const dialog = document.querySelector(dialogSelector);
    const button = dialog.querySelector('[data-panel-close]');
    const box = dialog.getBoundingClientRect();
    const rect = button.getBoundingClientRect();
    const style = getComputedStyle(button);
    return {
      top: Math.round(rect.top - box.top),
      right: Math.round(box.right - rect.right),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      background: style.backgroundColor,
      color: style.color,
      label: button.getAttribute('aria-label'),
      icon: button.querySelector('svg path')?.getAttribute('d'),
      text: button.textContent.trim(),
    };
  }, selector);

test('the arsenal and hobby panels share the same x close button', async () => {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.getElementById('intro-preloader')?.remove());
      await page.locator('[data-hobby-card="skate"]').click();
      const hobby = await closeBox(page, '[data-hobby-panel]');
      await page.keyboard.press('Escape');
      await page.locator('#arsenal [data-skill-tile]').first().click();
      const arsenal = await closeBox(page, '#arsenal dialog');
      assert.deepEqual(arsenal, hobby, `${width}px: same button, same place`);
      assert.equal(arsenal.label, 'Fechar');
      assert.equal(arsenal.text, '', 'an icon button, not a text label');
      assert.ok(arsenal.top < 40 && arsenal.right < 40, `${width}px: top-right corner`);
      assert.equal(await page.locator('#arsenal dialog [data-panel-close]').count(), 1);
    } finally {
      await context.close();
    }
  }
});
