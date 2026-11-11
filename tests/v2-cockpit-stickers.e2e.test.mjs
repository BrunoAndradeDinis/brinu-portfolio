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

test('CKP-04: the open menu shows socials, language toggle and cases link', async () => {
  const { PROFILE } = await import('../src/data/profile.ts');
  const { context, page } = await openPath('/');
  try {
    await openCockpit(page);
    const overlay = page.locator('#cockpit-menu-overlay');
    for (const [name, url] of [['linkedin', PROFILE.linkedin.url], ['github', PROFILE.github.url]]) {
      const link = overlay.locator(`[data-cockpit-social="${name}"]`);
      assert.equal(await link.getAttribute('href'), url, `${name} url`);
      assert.equal(await link.getAttribute('target'), '_blank');
      assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
      assert.ok((await link.getAttribute('aria-label')).trim().length > 0, `${name} label`);
    }
    const pressed = () => overlay.locator('[data-cockpit-lang]').evaluateAll((nodes) => nodes.map((node) => [node.getAttribute('data-cockpit-lang'), node.getAttribute('aria-pressed')]));
    assert.deepEqual(await pressed(), [['pt-br', 'true'], ['en', 'false']]);
    const cases = overlay.locator('[data-cockpit-cases]');
    assert.equal((await cases.textContent()).trim(), 'CASES →');
    await overlay.locator('[data-cockpit-lang="en"]').click();
    await page.waitForFunction(() => document.querySelector('[data-cockpit-lang="en"]').getAttribute('aria-pressed') === 'true');
    assert.deepEqual(await pressed(), [['pt-br', 'false'], ['en', 'true']]);
    assert.ok((await overlay.locator('[data-cockpit-social="github"]').getAttribute('aria-label')).includes('GitHub'));
    assert.equal((await cases.textContent()).trim(), 'CASES →');
    await cases.click();
    await waitClosed(page);
    assert.equal(new URL(page.url()).hash, '#works');
  } finally {
    await context.close();
  }
});

test('CKP-05: the open menu columns and overflow match each breakpoint', async () => {
  const columns = (page, selector) =>
    page.locator(selector).evaluateAll((nodes) => {
      const tops = nodes.map((node) => Math.round(node.getBoundingClientRect().top));
      return tops.filter((top) => top === tops[0]).length;
    });
  for (const locale of ['pt-br', 'en']) {
    for (const width of [320, 390, 768, 1024, 1440, 2560]) {
      const label = `${locale} ${width}px`;
      const { context, page } = await openPath('/', { locale, viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      try {
        await openCockpit(page);
        const m = await page.evaluate(() => {
          const overlay = document.getElementById('cockpit-menu-overlay');
          return { sw: overlay.scrollWidth, cw: overlay.clientWidth, dw: document.documentElement.scrollWidth, dcw: document.documentElement.clientWidth };
        });
        assert.ok(m.sw <= m.cw && m.dw <= m.dcw, `${label} overflow ${JSON.stringify(m)}`);
        const bladeColumns = await columns(page, '#cockpit-menu-overlay [data-cockpit-link]');
        const barColumns = await columns(page, '#cockpit-menu-overlay [data-cockpit-lang="pt-br"], #cockpit-menu-overlay [data-cockpit-cases], #cockpit-menu-overlay #cockpit-audio-toggle');
        if (width >= 768) {
          assert.equal(bladeColumns, 2, `${label} blades in two columns`);
        } else {
          assert.equal(bladeColumns, 1, `${label} blades in one column`);
        }
        const barRow = await page.evaluate(() => {
          const cells = [document.querySelector('#cockpit-menu-overlay [data-cockpit-lang="pt-br"]').closest('div.border-3'), document.querySelector('#cockpit-menu-overlay [data-cockpit-cases]'), document.querySelector('#cockpit-menu-overlay #cockpit-audio-toggle').closest('div.border-3')];
          const tops = cells.map((cell) => Math.round(cell.getBoundingClientRect().top));
          return tops.filter((top) => top === tops[0]).length;
        });
        assert.equal(barRow, width >= 768 ? 3 : 1, `${label} bottom bar columns (${barColumns})`);
        const small = await page.evaluate(() =>
          [...document.querySelectorAll('#cockpit-menu-overlay a, #cockpit-menu-overlay button, #cockpit-trigger-btn')]
            .map((node) => ({ name: node.getAttribute('data-cockpit-link') ?? node.getAttribute('data-cockpit-lang') ?? node.getAttribute('data-cockpit-social') ?? node.id ?? node.tagName, h: Math.round(node.getBoundingClientRect().height), w: Math.round(node.getBoundingClientRect().width) }))
            .filter((box) => box.h < 44 || box.w < 44)
        );
        assert.deepEqual(small, [], `${label} controls under 44px`);
      } finally {
        await context.close();
      }
    }
  }
});
