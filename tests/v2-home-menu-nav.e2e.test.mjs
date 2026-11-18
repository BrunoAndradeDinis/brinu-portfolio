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


const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'mobile', width: 375, height: 812 },
];

async function openHome(viewport, options = {}) {
  const context = await browser.newContext({ viewport, ...options });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.getElementById('intro-preloader')?.click());
  await page.waitForFunction(() => document.documentElement.classList.contains('intro-completed'), null, { timeout: 15000 });
  await page.waitForTimeout(600);
  return { context, page };
}

function homeState(page) {
  return page.evaluate(() => {
    const items = [...document.querySelectorAll('[data-case-item]')];
    const first = items[0]?.querySelector('[data-reveal-case]') ?? items[0];
    const rect = first.getBoundingClientRect();
    return {
      y: Math.round(window.scrollY),
      active: items.findIndex((item) => item.dataset.caseActive === 'true'),
      pinned: document.querySelector('[data-cases-reveal]')?.dataset.casesPinned,
      worksTop: Math.round(document.querySelector('#works').getBoundingClientRect().top),
      firstInView: rect.bottom > 0 && rect.top < window.innerHeight && getComputedStyle(first).visibility !== 'hidden',
      stageTop: Math.round(document.querySelector('[data-cases-stage]').getBoundingClientRect().top),
    };
  });
}

async function scrollPastLastCase(page, width) {
  await page.mouse.move(width / 2, 400);
  for (let i = 0; i < 60; i += 1) {
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(220);
    if ((await homeState(page)).stageTop < -1500) break;
  }
  await page.waitForTimeout(1000);
  const state = await homeState(page);
  assert.ok(state.stageTop < -1500, 'scrolled past the pinned cases');
  assert.equal(state.active, 3, 'the last case was the one on screen');
}


async function menuTo(page, id) {
  await page.locator('#cockpit-trigger-btn').click();
  await page.waitForTimeout(600);
  await page.locator(`[data-cockpit-link="${id}"]`).click();
  await page.waitForTimeout(2500);
}

for (const viewport of VIEWPORTS) {
  test(`NAV-01 (${viewport.label}): the menu Hero link from past the last case lands exactly on the page top`, async () => {
    const { context, page } = await openHome(viewport);
    try {
      await scrollPastLastCase(page, viewport.width);
      await menuTo(page, 'hero');
      assert.equal((await homeState(page)).y, 0);
    } finally {
      await context.close();
    }
  });

  test(`NAV-02 (${viewport.label}): the menu Selected Works link from past the last case shows the first case`, async () => {
    const { context, page } = await openHome(viewport);
    try {
      await scrollPastLastCase(page, viewport.width);
      await menuTo(page, 'works');
      const state = await homeState(page);
      assert.equal(state.active, 0, 'first case is the active one');
      assert.equal(state.firstInView, true, 'first case is on screen');
      assert.equal(state.pinned, 'true', 'landed inside the pin');
      assert.ok(Math.abs(state.stageTop) <= 2, `the stage sits at the pin start, got ${state.stageTop}`);

      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(1200);
      assert.equal((await homeState(page)).active, 1, 'the next wheel moves on to the second case');
    } finally {
      await context.close();
    }
  });
}

test('NAV-03: with reduced motion the menu still lands on the page top and on the first case', async () => {
  const viewport = VIEWPORTS[0];
  const { context, page } = await openHome(viewport, { reducedMotion: 'reduce' });
  try {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    await menuTo(page, 'hero');
    assert.equal((await homeState(page)).y, 0);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    await menuTo(page, 'works');
    const state = await homeState(page);
    assert.equal(state.firstInView, true);
    assert.ok(state.worksTop >= 0 && state.worksTop <= 80, `works starts under the nav, got ${state.worksTop}`);
  } finally {
    await context.close();
  }
});

test('NAV-04: a /#hero link from another page lands on the page top', async () => {
  const { context, page } = await openHome(VIEWPORTS[0]);
  try {
    await page.goto(`${baseUrl}/stickers`, { waitUntil: 'networkidle' });
    await page.locator('#cockpit-trigger-btn').click();
    await page.waitForTimeout(600);
    await page.locator('[data-cockpit-link="hero"]').click();
    await page.waitForURL(/\/#hero$/);
    await page.waitForTimeout(1500);
    assert.equal((await homeState(page)).y, 0);
  } finally {
    await context.close();
  }
});

test('NAV-05: the header Selected Works link, in English, lands on the first case after visiting the last one', async () => {
  const viewport = VIEWPORTS[0];
  const context = await browser.newContext({ viewport });
  await context.addInitScript(() => window.localStorage.setItem('brinu_locale', 'en'));
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.getElementById('intro-preloader')?.click());
    await page.waitForFunction(() => document.documentElement.classList.contains('intro-completed'), null, { timeout: 15000 });
    await page.waitForTimeout(600);
    await scrollPastLastCase(page, viewport.width);
    await menuTo(page, 'hero');
    assert.equal((await homeState(page)).y, 0);
    const link = page.locator('#comic-nav-header a[href="#works"]');
    await link.click();
    await page.waitForTimeout(1500);
    const state = await homeState(page);
    assert.deepEqual({ active: state.active, pinned: state.pinned, firstInView: state.firstInView }, { active: 0, pinned: 'true', firstInView: true });
  } finally {
    await context.close();
  }
});
