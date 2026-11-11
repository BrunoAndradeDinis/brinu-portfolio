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



const BLADES = ['hero', 'works', 'about', 'lab', 'contact', 'whoami'];
const overlayOpen = (page) =>
  page.evaluate(() => {
    const overlay = document.getElementById('cockpit-menu-overlay');
    const trigger = document.getElementById('cockpit-trigger-btn');
    return {
      hidden: overlay.getAttribute('aria-hidden'),
      display: getComputedStyle(overlay).display,
      expanded: trigger.getAttribute('aria-expanded'),
      locked: document.documentElement.classList.contains('cockpit-menu-open'),
      overflow: getComputedStyle(document.documentElement).overflow,
    };
  });
const waitClosed = (page) =>
  page.waitForFunction(() => {
    const overlay = document.getElementById('cockpit-menu-overlay');
    return overlay.getAttribute('aria-hidden') === 'true' && !document.documentElement.classList.contains('cockpit-menu-open');
  });
const openCockpit = async (page) => {
  await page.locator('#cockpit-trigger-btn').click();
  await page.waitForFunction(() => document.getElementById('cockpit-menu-overlay').getAttribute('aria-hidden') === 'false');
};

test('CKP-01: the trigger opens the modal menu and locks scroll', async () => {
  const { context, page } = await openPath('/');
  try {
    const dialog = page.locator('#cockpit-menu-overlay');
    assert.equal(await dialog.getAttribute('role'), 'dialog');
    assert.equal(await dialog.getAttribute('aria-modal'), 'true');
    assert.equal((await overlayOpen(page)).expanded, 'false');
    await openCockpit(page);
    const state = await overlayOpen(page);
    assert.equal(state.expanded, 'true');
    assert.equal(state.display, 'block');
    assert.equal(state.locked, true);
    assert.equal(state.overflow, 'hidden');
  } finally {
    await context.close();
  }
});

test('CKP-02: Escape or the trigger closes the menu and returns focus', async () => {
  const { context, page } = await openPath('/');
  try {
    for (const closeWith of ['escape', 'trigger']) {
      await openCockpit(page);
      if (closeWith === 'escape') await page.keyboard.press('Escape');
      else await page.locator('#cockpit-trigger-btn').click();
      await waitClosed(page);
      const state = await overlayOpen(page);
      assert.equal(state.expanded, 'false', `${closeWith} expanded`);
      assert.equal(state.locked, false, `${closeWith} scroll released`);
      assert.equal(state.overflow === 'hidden', false, `${closeWith} overflow`);
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'cockpit-trigger-btn', `${closeWith} focus`);
    }
  } finally {
    await context.close();
  }
});

test('CKP-03: the menu lists six blades and closes on activation', async () => {
  const { context, page } = await openPath('/');
  try {
    await openCockpit(page);
    const blades = await page.locator('#cockpit-menu-overlay [data-cockpit-link]').evaluateAll((nodes) =>
      nodes.map((node) => ({ id: node.getAttribute('data-cockpit-link'), href: node.getAttribute('href'), current: node.getAttribute('aria-current') }))
    );
    assert.deepEqual(blades.map((blade) => blade.id), BLADES);
    assert.deepEqual(blades.map((blade) => blade.href), ['#hero', '#works', '#about', '#lab', '#contact', '/whoami']);
    assert.deepEqual(blades.filter((blade) => blade.current).map((blade) => blade.id), ['hero']);
    await page.locator('#cockpit-menu-overlay [data-cockpit-link="works"]').click();
    await waitClosed(page);
    assert.equal(new URL(page.url()).hash, '#works');
    await openCockpit(page);
    const active = await page.locator('#cockpit-menu-overlay [data-cockpit-link][aria-current]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-cockpit-link')));
    assert.equal(active.length, 1);
    assert.notEqual(active[0], 'whoami');
  } finally {
    await context.close();
  }
});

test('CKP-06: reduced motion opens and closes the menu without a tween', async () => {
  const closeDelay = async (reducedMotion) => {
    const { context, page } = await openPath('/', { reducedMotion });
    try {
      await openCockpit(page);
      await page.locator('#cockpit-trigger-btn').click();
      await page.waitForTimeout(60);
      return (await overlayOpen(page)).locked;
    } finally {
      await context.close();
    }
  };
  assert.equal(await closeDelay('reduce'), false, 'reduced motion closes at once');
  assert.equal(await closeDelay('no-preference'), true, 'full motion still tweens');
});
