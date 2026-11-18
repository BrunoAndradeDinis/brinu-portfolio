import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const MIME_TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };
let server;
let baseUrl = '';
let browser;

before(async () => {
  const distDir = path.resolve('dist');
  server = http.createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url || '/', 'http://127.0.0.1').pathname);
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

const { buildReceipt } = await import('../src/utils/receipt.ts');

async function captureReceipt(route, locale) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  if (locale) await context.addInitScript((value) => window.localStorage.setItem('brinu_locale', value), locale);
  const page = await context.newPage();
  const logs = [];
  page.on('console', async (message) => {
    if (message.type() !== 'log') return;
    const args = await Promise.all(message.args().map((arg) => arg.jsonValue().catch(() => null)));
    logs.push(args);
  });
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  return { context, page, logs };
}

test('the console prints one receipt in the site language', async () => {
  for (const [route, locale] of [['/', 'pt-br'], ['/whoami', 'en']]) {
    const { context, page, logs } = await captureReceipt(route, locale === 'en' ? 'en' : undefined);
    try {
      const expected = buildReceipt(locale);
      const header = logs.find(([text]) => text === `%c${expected.header}`);
      const body = logs.filter(([text]) => typeof text === 'string' && text.includes('BOUNTY #1996'));
      assert.ok(header, `${route}: header printed`);
      assert.equal(body.length, 1, `${route}: the whole receipt is one console.log`);
      assert.equal(body[0][0], `%c${expected.body}`, `${route}: the receipt matches the data in ${locale}`);
      for (const style of [header[1], body[0][1]]) assert.match(style, /display: inline-block/, 'one box, not a box per line');
      assert.match(body[0][1], /border: 2px solid #FE0000/);
      logs.length = 0;
      await page.evaluate(() => void window.status);
      await page.waitForTimeout(100);
      assert.ok(logs.some(([text]) => text === `%c${expected.body}`), `${route}: status reprints the receipt`);
    } finally {
      await context.close();
    }
  }
});
