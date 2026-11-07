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

test('C12: html background color matches the section occupying the top of the viewport', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    for (const sectionId of ['#hero', '#works', '#about', '#contact']) {
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const top = window.scrollY + el.getBoundingClientRect().top + 24;
        window.scrollTo({ top, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
      }, sectionId);
      await page.waitForTimeout(60);

      const colors = await page.evaluate((sel) => {
        const sec = document.querySelector(sel);
        return {
          htmlBg: window.getComputedStyle(document.documentElement).backgroundColor,
          sectionBg: sec ? window.getComputedStyle(sec).backgroundColor : null,
        };
      }, sectionId);

      assert.equal(
        colors.htmlBg,
        colors.sectionBg,
        `Expected <html> background (${colors.htmlBg}) to match ${sectionId} background (${colors.sectionBg})`
      );
    }
  } finally {
    await context.close();
  }
});

test('C14: activating an in-page anchor link stops target at least 8px below visible nav controls', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    const urianaChip = page.locator('a[href="#case-uriana"]').first();
    await urianaChip.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    await urianaChip.click();

    await page.waitForFunction(() => {
      const target = document.getElementById('case-uriana');
      const avatar = document.querySelector('#comic-nav-logo [data-nav-avatar]');
      const trigger = document.getElementById('cockpit-trigger-btn');
      if (!target || !avatar || !trigger) return false;
      const navBottom = Math.max(
        avatar.getBoundingClientRect().bottom,
        trigger.getBoundingClientRect().bottom
      );
      const targetTop = target.getBoundingClientRect().top;
      return targetTop >= navBottom + 8 && targetTop <= navBottom + 80;
    }, null, { timeout: 4000 });

    const metrics = await page.evaluate(() => {
      const target = document.getElementById('case-uriana');
      const avatar = document.querySelector('#comic-nav-logo [data-nav-avatar]');
      const trigger = document.getElementById('cockpit-trigger-btn');
      const navBottom = Math.max(
        avatar ? avatar.getBoundingClientRect().bottom : 0,
        trigger ? trigger.getBoundingClientRect().bottom : 0
      );
      const targetTop = target ? target.getBoundingClientRect().top : 0;
      return { navBottom, targetTop, gap: targetTop - navBottom };
    });

    assert.ok(
      metrics.gap >= 8,
      `Expected #case-uriana top (${metrics.targetTop}px) to stop >= 8px below nav controls bottom (${metrics.navBottom}px), got gap=${metrics.gap}px`
    );
  } finally {
    await context.close();
  }
});

test('C15: scrolling past hero hides nameplate and keeps only avatar badge and menu button visible', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    assert.equal(await page.locator('[data-nav-nameplate]').isVisible(), true);

    await page.evaluate(() => {
      const works = document.getElementById('works');
      const y = works ? window.scrollY + works.getBoundingClientRect().top : 1200;
      window.scrollTo({ top: y, behavior: 'instant' });
      window.dispatchEvent(new Event('scroll'));
    });
    await page.waitForTimeout(250);

    const state = await page.evaluate(() => {
      const avatar = document.querySelector('#comic-nav-logo [data-nav-avatar]');
      const nameplate = document.querySelector('[data-nav-nameplate]');
      const menuBtn = document.getElementById('cockpit-trigger-btn');
      const worksCta = document.querySelector('#comic-nav-header a[href="#works"]');
      const langBtn = document.getElementById('nav-lang-toggle-btn');

      const isVisible = (el) => {
        if (!el) return false;
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.05;
      };

      return {
        avatarVisible: isVisible(avatar),
        menuVisible: isVisible(menuBtn),
        nameplateVisible: isVisible(nameplate),
        worksCtaVisible: isVisible(worksCta),
        langBtnVisible: isVisible(langBtn),
      };
    });

    assert.equal(state.avatarVisible, true, 'Avatar badge must stay visible past hero');
    assert.equal(state.menuVisible, true, 'Menu button must stay visible past hero');
    assert.equal(state.nameplateVisible, false, 'Nameplate must be hidden past hero');
    assert.equal(state.worksCtaVisible, false, 'Secondary works CTA must be hidden past hero');
    assert.equal(state.langBtnVisible, false, 'Secondary lang button must be hidden past hero');
  } finally {
    await context.close();
  }
});
