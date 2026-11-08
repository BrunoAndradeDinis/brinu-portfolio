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




const toggleLocale = async (page) => {
  await page.locator('#nav-lang-toggle-btn').dispatchEvent('click');
  await page.waitForTimeout(500);
};

const CODES = ['ARCANA // EMPRESS', 'ARCANA // HIEROPHANT', 'ARCANA // TEMPERANCE', 'ARCANA // CHARIOT'];

test('C4: lab renders four cards in works order with their arcana codes', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    const cards = await page.locator('#lab [data-arcana-card]').evaluateAll((els) => els.map((el) => ({ id: el.id, code: el.querySelector('[data-arcana-code]').textContent.trim() })));
    assert.equal(cards.length, 4);
    const worksOrder = await page.locator('#works [id^="case-"]').evaluateAll((els) => els.map((el) => el.id.replace('case-', '')));
    const deckOrder = cards.map((c) => c.id.replace('arcana-', ''));
    assert.deepEqual(deckOrder, worksOrder.filter((id) => deckOrder.includes(id)), 'deck order must follow the works section');
    assert.deepEqual(cards.map((c) => c.code), CODES);
  } finally {
    await context.close();
  }
});

test('C5: card front and back match the works section text', async () => {
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openHome(locale, { reducedMotion: 'reduce' });
    try {
      const data = await page.evaluate(() => {
        const text = (root, sel) => root.querySelector(sel)?.textContent.replace(/\s+/g, ' ').trim();
        return [...document.querySelectorAll('#lab [data-arcana-card]')].map((card) => {
          const id = card.id.replace('arcana-', '');
          const work = document.getElementById(`case-${id}`);
          return {
            id,
            title: [text(card, '[data-arcana-title]'), text(work, '[data-case-title]')],
            challenge: [text(card, '[data-arcana-challenge]'), text(work, '[data-case-challenge]')],
            solution: [text(card, '[data-arcana-solution]'), text(work, '[data-case-solution]')],
            categoryInReel: text(work, '[data-case-reel]').includes(text(card, '[data-arcana-category]')),
            stack: [[...card.querySelectorAll('[data-arcana-stack-item]')].map((el) => el.textContent.trim()), [...work.querySelectorAll('[data-case-stack-item]')].map((el) => el.textContent.trim())],
            links: [[...card.querySelectorAll('[data-arcana-link]')].map((el) => el.getAttribute('href')), [...work.querySelectorAll('[data-case-link]')].map((el) => el.getAttribute('href'))],
          };
        });
      });
      assert.equal(data.length, 4);
      for (const c of data) {
        for (const field of ['title', 'challenge', 'solution', 'stack', 'links']) {
          assert.ok(c[field][0] && c[field][0].length > 0, `${locale} ${c.id} ${field} is empty`);
          assert.deepEqual(c[field][0], c[field][1], `${locale} ${c.id} ${field} differs from the works section`);
        }
        assert.equal(c.categoryInReel, true, `${locale} ${c.id} category must come from the same data`);
      }
    } finally {
      await context.close();
    }
  }
});

test('C13: lab title anchor and menu label read ARCANA DECK', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    for (const locale of ['pt-br', 'en']) {
      if (locale === 'en') await toggleLocale(page);
      assert.equal(await page.locator('#lab').count(), 1);
      assert.equal(await page.locator('#lab [data-lab-title]').getAttribute('aria-label'), 'ARCANA DECK', `${locale} title`);
      await page.locator('#cockpit-trigger-btn').dispatchEvent('click');
      const label = page.locator('#cockpit-menu-overlay a[href="#lab"]');
      await label.waitFor({ state: 'visible', timeout: 8000 });
      assert.match((await label.textContent()).replace(/\s+/g, ' '), /04 \/\/ ARCANA DECK/, `${locale} menu label`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(900);
    }
  } finally {
    await context.close();
  }
});

test('C15: with JavaScript disabled the four cases stay readable in the lab', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    const cards = page.locator('#lab [data-arcana-card]');
    assert.equal(await cards.count(), 4);
    for (let i = 0; i < 4; i++) {
      const card = cards.nth(i);
      for (const sel of ['[data-arcana-code]', '[data-arcana-title]', '[data-arcana-category]', '[data-arcana-challenge]', '[data-arcana-solution]', '[data-arcana-stack-item]']) {
        assert.equal(await card.locator(sel).first().isVisible(), true, `card ${i + 1} ${sel} must be visible without JS`);
        assert.ok((await card.locator(sel).first().textContent()).trim().length > 0, `card ${i + 1} ${sel} must have text`);
      }
    }
  } finally {
    await context.close();
  }
});
