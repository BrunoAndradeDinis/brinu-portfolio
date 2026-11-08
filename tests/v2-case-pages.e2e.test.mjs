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
const LOCALES = ['pt-br', 'en'];

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

async function expectedCases() {
  const { getLocalizedCases } = await import('../src/data/cases.ts');
  return Object.fromEntries(LOCALES.map((locale) => [locale, getLocalizedCases(locale)]));
}

test('C1b: the build generates exactly four case pages and unknown ids return 404', async () => {
  const dirs = fs.readdirSync(path.resolve('dist/cases')).sort();
  assert.deepEqual(dirs, [...IDS].sort());
  const { context, page } = await openPath('/');
  try {
    const response = await page.goto(`${baseUrl}/cases/does-not-exist`);
    assert.equal(response.status(), 404);
  } finally {
    await context.close();
  }
});

test('C2: each case page shows the full card content in both locales', async () => {
  const cases = await expectedCases();
  for (const locale of LOCALES) {
    for (const expected of cases[locale]) {
      const { context, page } = await openPath(`/cases/${expected.id}`, { locale, reducedMotion: 'reduce' });
      try {
        const text = (selector) => page.locator(selector).first().textContent().then((value) => value.trim());
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await text('h1'), expected.title, `${locale} ${expected.id} h1`);
        assert.equal(await text('[data-case-reel]'), `[ ${expected.reelNumber} ] // ${expected.category}`);
        assert.equal(await text('[data-case-badge]'), expected.badge);
        assert.equal(await text('[data-case-subtitle]'), expected.subtitle);
        assert.equal(await text('[data-case-description]'), expected.description);
        assert.equal(await text('[data-case-challenge]'), expected.challenge);
        assert.equal(await text('[data-case-solution]'), expected.solution);
        assert.equal(await text('[data-case-metric]'), expected.metric);
        const stack = await page.locator('[data-case-stack-item]').allTextContents();
        assert.deepEqual(stack.map((item) => item.trim()), expected.stack);
        const links = await page.locator('[data-case-link]').evaluateAll((nodes) =>
          nodes.map((node) => ({ href: node.getAttribute('href'), label: node.querySelector('[data-case-link-label]').textContent.trim(), aria: node.getAttribute('aria-label') }))
        );
        assert.deepEqual(links, expected.links.map((link) => ({ href: link.url, label: link.label, aria: link.ariaLabel })));
      } finally {
        await context.close();
      }
    }
  }
});

test('C3: each case page sets its own meta and updates it on locale change', async () => {
  const cases = await expectedCases();
  const { getDictionary } = await import('../src/i18n/index.ts');
  const { caseMeta } = await import('../src/utils/case-pages.ts');
  const titles = new Set();
  for (const id of IDS) {
    const { context, page } = await openPath(`/cases/${id}`, { locale: 'pt-br', reducedMotion: 'reduce' });
    try {
      for (const locale of LOCALES) {
        if (locale === 'en') await page.locator('[data-lang-toggle]').first().click();
        await page.waitForFunction((loc) => document.documentElement.getAttribute('data-locale') === loc, locale);
        const expected = caseMeta(cases[locale].find((entry) => entry.id === id), getDictionary(locale).casePage.titleSuffix);
        const meta = await page.evaluate(() => ({
          title: document.title,
          description: document.querySelector('meta[name="description"]').content,
          ogTitle: document.querySelector('meta[property="og:title"]').content,
          ogDescription: document.querySelector('meta[property="og:description"]').content,
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
        }));
        assert.equal(meta.title, expected.title, `${id} ${locale} title`);
        assert.equal(meta.description, expected.description);
        assert.equal(meta.ogTitle, expected.title);
        assert.equal(meta.ogDescription, expected.description);
        assert.equal(meta.canonical, `/cases/${id}`);
        if (locale === 'pt-br') titles.add(meta.title);
      }
    } finally {
      await context.close();
    }
  }
  assert.equal(titles.size, IDS.length, 'titles are distinct per case');
});

test('C4b: each case page links back to its home card and to the next case', async () => {
  const { nextCaseId } = await import('../src/utils/case-pages.ts');
  for (const id of IDS) {
    const { context, page } = await openPath(`/cases/${id}`, { reducedMotion: 'reduce' });
    try {
      assert.equal(await page.locator('[data-case-back]').getAttribute('href'), `/#case-${id}`);
      assert.equal(await page.locator('[data-case-next]').getAttribute('href'), `/cases/${nextCaseId(id)}`);
    } finally {
      await context.close();
    }
  }
});

test('C6: case page text updates in place on locale change', async () => {
  const cases = await expectedCases();
  const { context, page } = await openPath('/cases/uriana', { locale: 'pt-br', reducedMotion: 'reduce' });
  try {
    await page.evaluate(() => { window.__marker = 'kept'; });
    const before = await page.locator('[data-case-description]').textContent();
    await page.locator('[data-lang-toggle]').first().click();
    const english = cases.en.find((c) => c.id === 'uriana');
    await page.waitForFunction((text) => document.querySelector('[data-case-description]').textContent.trim() === text, english.description);
    assert.notEqual(english.description, before.trim());
    assert.equal((await page.locator('h1').textContent()).trim(), english.title);
    assert.equal(await page.evaluate(() => window.__marker), 'kept', 'no reload happened');
    assert.equal((await page.locator('[data-case-description]').textContent()).trim(), cases.en.find((c) => c.id === 'uriana').description);
    assert.equal((await page.locator('[data-case-back]').textContent()).trim(), '← BACK TO PROJECTS');
    assert.equal((await page.locator('[data-case-next]').textContent()).trim(), 'NEXT CASE →');
  } finally {
    await context.close();
  }
});

test('C5: every home card links to its case page in both locales', async () => {
  for (const locale of LOCALES) {
    const { context, page } = await openPath('/', { locale, reducedMotion: 'reduce' });
    try {
      const label = locale === 'pt-br' ? 'ABRIR CASE' : 'OPEN CASE';
      for (const id of IDS) {
        const link = page.locator(`#case-${id} a[data-case-open]`);
        assert.equal(await link.count(), 1, `${id} has one open-case link`);
        assert.equal(await link.getAttribute('href'), `/cases/${id}`);
        assert.equal((await link.textContent()).replace(/\s+/g, ' ').trim().replace(/\s*→$/, ''), label);
      }
    } finally {
      await context.close();
    }
  }
});

test('C13: card title and page h1 share the view transition name', async () => {
  const { context, page } = await openPath('/', { reducedMotion: 'reduce' });
  try {
    for (const id of IDS) {
      const homeName = await page.locator(`#case-${id} [data-case-title]`).evaluate((el) => getComputedStyle(el).viewTransitionName);
      assert.equal(homeName, `case-title-${id}`);
      const detail = await context.newPage();
      await detail.goto(`${baseUrl}/cases/${id}`, { waitUntil: 'networkidle' });
      const pageName = await detail.locator('h1').evaluate((el) => getComputedStyle(el).viewTransitionName);
      assert.equal(pageName, `case-title-${id}`);
      await detail.close();
    }
  } finally {
    await context.close();
  }
});
