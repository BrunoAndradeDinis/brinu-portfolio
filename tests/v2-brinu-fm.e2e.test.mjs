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

const REEL_CHUNK = /\/_astro\/brinu-fm-reel\.[\w-]+\.js$/;

async function openHome({ viewport = { width: 1440, height: 900 }, locale = 'pt-br', clock = false, ...options } = {}) {
  const context = await browser.newContext({ viewport, ...options });
  await context.addInitScript((loc) => window.localStorage.setItem('brinu_locale', loc), locale);
  const page = await context.newPage();
  const chunks = [];
  page.on('request', (request) => {
    if (REEL_CHUNK.test(new URL(request.url()).pathname)) chunks.push(request.url());
  });
  if (clock) await page.clock.install();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.getElementById('intro-preloader')?.click());
  if (clock) await page.clock.runFor(4000);
  else await page.waitForFunction(() => document.documentElement.classList.contains('intro-completed'), null, { timeout: 15000 });
  return { context, page, chunks };
}

async function scrollToReel(page) {
  await page.evaluate(() => {
    const el = document.querySelector('[data-brinu-fm]');
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 30);
  });
}

const reel = (page) => page.evaluate(() => {
  const root = document.querySelector('[data-brinu-fm]');
  return {
    state: root.dataset.fmState,
    duration: Number(root.dataset.fmDuration),
    scenes: Number(root.dataset.fmScenes),
    channel: root.querySelector('[data-fm-channel]').textContent.trim(),
    progress: getComputedStyle(root.querySelector('[data-fm-progress]')).transform,
    visible: [...root.querySelectorAll('[data-fm-scene]')].filter((scene) => getComputedStyle(scene).visibility === 'visible').map((scene) => scene.dataset.fmScene),
  };
});

test('FM-01: the reel chunk stays out of the first load and arrives only when the contact panel nears the viewport', async () => {
  const { context, page, chunks } = await openHome();
  try {
    await page.waitForTimeout(800);
    assert.deepEqual(chunks, [], 'no reel chunk on first load');
    assert.equal(await page.locator('[data-brinu-fm]').getAttribute('data-fm-state'), 'idle');
    await scrollToReel(page);
    await page.waitForFunction(() => document.querySelector('[data-brinu-fm]').dataset.fmState === 'playing', null, { timeout: 8000 });
    assert.equal(chunks.length, 1, 'reel chunk loads once near the panel');
    assert.equal(await page.locator('[data-brinu-fm] [data-fm-stage]').getAttribute('aria-hidden'), 'true', 'the stage is decorative');
  } finally {
    await context.close();
  }
});

test('FM-02: the loop lasts 60 seconds and walks through the six hobby channels', async () => {
  const { context, page } = await openHome({ clock: true });
  try {
    await scrollToReel(page);
    await page.clock.runFor(800);
    await page.waitForFunction(() => document.querySelector('[data-brinu-fm]').dataset.fmState === 'playing', null, { timeout: 8000, polling: 50 });
    const first = await reel(page);
    assert.deepEqual({ duration: first.duration, scenes: first.scenes, channel: first.channel, visible: first.visible }, { duration: 60, scenes: 6, channel: 'CH 01/06', visible: ['animes'] });

    const seen = [];
    for (let step = 0; step < 6; step += 1) {
      await page.clock.runFor(10000);
      seen.push((await reel(page)).channel);
    }
    assert.deepEqual(seen, ['CH 02/06', 'CH 03/06', 'CH 04/06', 'CH 05/06', 'CH 06/06', 'CH 01/06'], 'one channel every 10s, looping after 60s');
    assert.deepEqual((await reel(page)).visible, ['animes'], 'the loop wraps back to the first scene');
  } finally {
    await context.close();
  }
});

test('FM-03: the visible control pauses and resumes the broadcast, and it idles offscreen', async () => {
  const { context, page } = await openHome({ clock: true });
  try {
    await scrollToReel(page);
    await page.clock.runFor(800);
    await page.waitForFunction(() => document.querySelector('[data-brinu-fm]').dataset.fmState === 'playing', null, { timeout: 8000, polling: 50 });
    const toggle = page.locator('[data-fm-toggle]');
    assert.equal(await toggle.isVisible(), true);
    assert.equal((await toggle.innerText()).trim(), 'PAUSAR');

    await toggle.click();
    const paused = await reel(page);
    assert.equal(paused.state, 'paused');
    assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
    assert.equal((await toggle.innerText()).trim(), 'TOCAR');
    await page.clock.runFor(4000);
    assert.equal((await reel(page)).progress, paused.progress, 'progress holds while paused');

    await toggle.click();
    await page.clock.runFor(2000);
    const resumed = await reel(page);
    assert.equal(resumed.state, 'playing');
    assert.notEqual(resumed.progress, paused.progress, 'progress moves again');

    await page.evaluate(() => window.scrollTo(0, 0));
    for (let tries = 0; tries < 20 && (await reel(page)).state !== 'idle'; tries += 1) {
      await page.clock.runFor(100);
      await page.waitForTimeout(50);
    }
    assert.equal((await reel(page)).state, 'idle', 'offscreen pauses the loop');
  } finally {
    await context.close();
  }
});

test('FM-04: with reduced motion the panel shows a static six-card sheet and never loads the reel', async () => {
  const { context, page, chunks } = await openHome({ reducedMotion: 'reduce' });
  try {
    await scrollToReel(page);
    await page.waitForTimeout(1200);
    const view = await page.evaluate(() => {
      const root = document.querySelector('[data-brinu-fm]');
      return {
        sheet: getComputedStyle(root.querySelector('[data-fm-sheet]')).display,
        screen: getComputedStyle(root.querySelector('.fm-screen')).display,
        cards: root.querySelectorAll('[data-fm-sheet] li').length,
        controls: getComputedStyle(root.querySelector('.fm-controls')).visibility,
      };
    });
    assert.deepEqual(view, { sheet: 'grid', screen: 'none', cards: 6, controls: 'hidden' });
    assert.deepEqual(chunks, [], 'no reel chunk with reduced motion');
  } finally {
    await context.close();
  }
});

test('FM-05: the panel fits beside the form without overflow from 320 to 2560px in pt and en, and stays out of the stacked layout', async () => {
  for (const locale of ['pt-br', 'en']) {
    for (const width of [320, 768, 1024, 1440, 2560]) {
      const { context, page } = await openHome({ viewport: { width, height: 900 }, locale });
      try {
        await scrollToReel(page);
        await page.waitForTimeout(900);
        const fit = await page.evaluate(() => {
          const root = document.querySelector('[data-brinu-fm]');
          const shown = getComputedStyle(root).display !== 'none';
          const box = root.getBoundingClientRect();
          const form = document.getElementById('bounty-dispatch-container').getBoundingClientRect();
          const spill = shown
            ? [...root.querySelectorAll('.fm-copy, .fm-sticker, .fm-tag, .fm-hud, .fm-controls')].filter((el) => {
                const r = el.getBoundingClientRect();
                return r.width > 0 && (r.left < box.left - 1 || r.right > box.right + 1 || r.bottom > box.bottom + 1);
              }).map((el) => el.className.toString().split(' ')[0])
            : [];
          return {
            shown,
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            spill,
            besideForm: shown ? box.right <= form.left && Math.abs(box.bottom - form.bottom) <= 2 : null,
          };
        });
        assert.equal(fit.overflow, false, `${locale} ${width}px: no horizontal overflow`);
        assert.equal(fit.shown, width >= 1024, `${locale} ${width}px: panel only beside the form`);
        assert.deepEqual(fit.spill, [], `${locale} ${width}px: nothing spills out of the panel`);
        if (fit.shown) assert.equal(fit.besideForm, true, `${locale} ${width}px: panel sits beside the form and ends with it`);
      } finally {
        await context.close();
      }
    }
  }
});

test('FM-06: the broadcast copy switches between pt and en', async () => {
  const { context, page } = await openHome();
  try {
    await scrollToReel(page);
    await page.waitForFunction(() => document.querySelector('[data-brinu-fm]').dataset.fmState === 'playing', null, { timeout: 8000 });
    const copy = () => page.evaluate(() => {
      const root = document.querySelector('[data-brinu-fm]');
      const scene = root.querySelector('[data-fm-scene="musica"]');
      return {
        title: root.querySelector('[data-i18n="contact.fmTitle"]').textContent.trim(),
        name: scene.querySelector('[data-fm-name]').getAttribute('aria-label'),
        position: scene.querySelector('[data-fm-position]').textContent.trim(),
        ticker: scene.querySelector('[data-fm-ticker]').textContent,
        toggle: root.querySelector('[data-fm-toggle]').getAttribute('aria-label'),
      };
    });
    const pt = await copy();
    assert.equal(pt.title, 'TRANSMISSÃO // BRINU FM');
    assert.equal(pt.name, 'MÚSICA');
    assert.equal(pt.position, 'OUV // Ouvinte');
    assert.match(pt.ticker, /Medulla  ✦  Dead Fish  ✦  Racionais MC's  ✦  Cátia de França  ✦  Tinariwen  ✦  Jorge Ben Jor/);

    await page.locator('#cockpit-trigger-btn').click();
    await page.locator('[data-cockpit-lang="en"]').click();
    await page.waitForFunction(() => document.documentElement.getAttribute('data-locale') === 'en');
    await page.waitForTimeout(300);
    const en = await copy();
    assert.equal(en.title, 'BROADCAST // BRINU FM');
    assert.equal(en.name, 'MUSIC');
    assert.equal(en.position, 'LIS // Listener');
    assert.match(en.ticker, /Medulla  ✦  Dead Fish/);
    assert.equal(en.toggle, 'Pause or resume the animated broadcast');
  } finally {
    await context.close();
  }
});
