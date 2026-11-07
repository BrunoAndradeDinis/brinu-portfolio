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


const HERO_KEYS = ['ticker','avatarAria','bubbleDefault','stamp','phrases','manifestoLeftLine1','manifestoLeftLine2','manifestoLeftLine3','craftCta','craftAria','manifestoRightLine1','manifestoRightLine2','manifestoRightLine3','socialAria'];

test('C13: hero avatar renders in a polygonal clip-path rotated at least 3 deg', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    const frame = await page.locator('[data-hero-avatar-frame]').evaluate((el) => {
      const cs = getComputedStyle(el);
      const m = new DOMMatrixReadOnly(cs.transform === 'none' ? undefined : cs.transform);
      const matrixAngle = Math.atan2(m.b, m.a) * 180 / Math.PI;
      const rotateProp = cs.rotate && cs.rotate !== 'none' ? parseFloat(cs.rotate) : 0;
      return { clip: cs.clipPath, angle: Math.abs(matrixAngle + rotateProp) };
    });
    assert.match(frame.clip, /^polygon\(/, `Expected polygon clip-path, got ${frame.clip}`);
    const points = frame.clip.replace(/^polygon\(|\)$/g, '').split(',').map((p) => p.trim());
    assert.ok(points.length >= 4, 'polygon needs at least 4 points');
    assert.notDeepEqual(
      points.map((p) => p.split(/\s+/)),
      [['0%', '0%'], ['100%', '0%'], ['100%', '100%'], ['0%', '100%']],
      'polygon must not be a plain rectangle',
    );
    assert.ok(frame.angle >= 3, `Expected rotation >= 3deg, got ${frame.angle}`);
  } finally {
    await context.close();
  }
});

test('C14: manifestos render as P5Panel and social links as stacked P5Badge column', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    for (const side of ['left', 'right']) {
      const info = await page.locator(`[data-hero-manifesto="${side}"]`).evaluate((el) => ({
        panel: el.hasAttribute('data-p5-panel'),
        clip: getComputedStyle(el).clipPath,
      }));
      assert.equal(info.panel, true, `${side} manifesto must be a P5Panel`);
      assert.match(info.clip, /^polygon\(/, `${side} manifesto needs a polygon clip-path`);
    }

    const badges = await page.locator('#hero [data-hero-socials] [data-p5-badge]').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, left: r.left, right: r.right, height: r.height, text: el.textContent.trim() };
      }),
    );
    assert.deepEqual(badges.map((b) => b.text), ['GITHUB', 'LINKEDIN', 'E-MAIL']);
    for (let i = 1; i < badges.length; i++) {
      assert.ok(badges[i].top >= badges[i - 1].top + badges[i - 1].height - 1, 'badges must stack vertically, no side by side');
      assert.ok(Math.abs(badges[i].right - badges[0].right) < 2, 'badges must share one column edge');
    }
  } finally {
    await context.close();
  }
});

test('C16: hero i18n keys and strings are unchanged in pt-br and en', async () => {
  const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
  for (const locale of ['pt-br', 'en']) {
    const dict = DICTIONARIES[locale].hero;
    assert.deepEqual(Object.keys(dict), HERO_KEYS, `hero keys changed in ${locale}`);

    const { context, page } = await openHome(locale);
    try {
      const rendered = await page.locator('[data-i18n^="hero."]').evaluateAll((els) =>
        els.map((el) => ({
          key: el.getAttribute('data-i18n').slice(5),
          attr: el.getAttribute('data-i18n-attr'),
          text: el.textContent.trim(),
          attrValue: el.getAttribute(el.getAttribute('data-i18n-attr') || 'x'),
        })),
      );
      const keysSeen = new Set(rendered.map((r) => r.key));
      for (const key of HERO_KEYS.filter((k) => k !== 'phrases')) {
        assert.ok(keysSeen.has(key), `hero.${key} must still be bound in the hero in ${locale}`);
      }
      for (const r of rendered) {
        const expected = dict[r.key];
        const actual = r.attr ? r.attrValue : r.text;
        assert.equal(actual, expected, `hero.${r.key} differs in ${locale}`);
      }
    } finally {
      await context.close();
    }
  }
});

test('C15: hero ticker ends in a non-horizontal diagonal cut', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    const clip = await page.locator('[data-hero-ticker]').evaluate((el) => getComputedStyle(el).clipPath);
    assert.match(clip, /^polygon\(/, `Expected polygon clip-path, got ${clip}`);
    const points = clip.replace(/^polygon\(|\)$/g, '').split(',').map((p) => p.trim().split(/\s+/));
    const bottomYs = points.map((p) => parseFloat(p[1])).filter((y) => y > 50);
    assert.ok(bottomYs.length >= 2, 'polygon needs at least two bottom points');
    assert.ok(Math.max(...bottomYs) - Math.min(...bottomYs) > 5, `Expected a slanted bottom edge, got y values ${bottomYs}`);
  } finally {
    await context.close();
  }
});

test('C17: zero horizontal overflow at 320, 375, 768 and 1440px in pt-br and en during and after the intro', async () => {
  const widths = [320, 375, 768, 1440];
  for (const locale of ['pt-br', 'en']) {
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      try {
        await page.addInitScript((loc) => window.localStorage.setItem('brinu_locale', loc), locale);
        await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
        await dismissIntroIfPresent(page);
        const metrics = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          const offenders = [...document.querySelectorAll('#hero *, [data-hero-ticker]')]
            .filter((el) => el.getBoundingClientRect().right > vw + 1 || el.getBoundingClientRect().left < -1)
            .map((el) => el.tagName + (el.id ? '#' + el.id : '') + '.' + String(el.className).slice(0, 40));
          return { scrollWidth: document.documentElement.scrollWidth, vw, offenders };
        });
        assert.ok(metrics.scrollWidth <= metrics.vw, `Overflow after intro at ${width}px (${locale}): ${metrics.scrollWidth} > ${metrics.vw}`);
        assert.deepEqual(metrics.offenders.slice(0, 5), [], `Hero elements outside the viewport at ${width}px (${locale})`);
      } finally {
        await context.close();
      }
    }
  }
});

async function openIntro({ locale = 'pt-br', contextOptions = {}, init } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...contextOptions });
  const page = await context.newPage();
  await page.addInitScript((loc) => window.localStorage.setItem('brinu_locale', loc), locale);
  if (init) await page.addInitScript(init);
  return { context, page };
}

const markTime = (page, name) =>
  page.evaluate((n) => performance.getEntriesByName(n).map((e) => e.startTime), name);

test('C3: preloader counter goes from 0 to 100 and reaches 100 when exit starts', async () => {
  const { context, page } = await openIntro({
    init: () => {
      window.__counterSamples = [];
      document.addEventListener('DOMContentLoaded', () => {
        const el = document.querySelector('[data-intro-counter]');
        if (!el) return;
        window.__counterSamples.push({ t: performance.now(), v: Number(el.textContent) });
        new MutationObserver(() => {
          window.__counterSamples.push({ t: performance.now(), v: Number(el.textContent) });
        }).observe(el, { childList: true, characterData: true, subtree: true });
      });
    },
  });
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => performance.getEntriesByName('intro:exit-start').length > 0, null, { timeout: 8000 });
    const { samples, exitStart } = await page.evaluate(() => ({
      samples: window.__counterSamples,
      exitStart: performance.getEntriesByName('intro:exit-start')[0].startTime,
    }));
    assert.ok(samples.length > 5, `Expected a live counter, got ${samples.length} samples`);
    assert.ok(samples[0].v <= 20, `Counter should start near 0, started at ${samples[0].v}`);
    for (let i = 1; i < samples.length; i++) {
      assert.ok(samples[i].v >= samples[i - 1].v, `Counter went backwards: ${samples[i - 1].v} -> ${samples[i].v}`);
    }
    const hundred = samples.find((s) => s.v === 100);
    assert.ok(hundred, 'Counter must reach 100');
    assert.ok(hundred.t <= exitStart + 30, `Counter reached 100 at ${hundred.t}, after exit start ${exitStart}`);
    assert.ok(samples.filter((s) => s.t < exitStart - 30).every((s) => s.v < 100), 'Counter must not show 100 before the exit starts');
  } finally {
    await context.close();
  }
});

test('C10: repeat visit runs short exit within 0.6 s without the film', async () => {
  const fresh = await openIntro();
  try {
    await fresh.page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    const first = await fresh.page.evaluate(() => {
      const pre = document.getElementById('intro-preloader');
      return { mode: pre.dataset.introMode, film: getComputedStyle(pre.querySelector('[data-intro-letter]')).backgroundImage };
    });
    assert.equal(first.mode, 'full');
    assert.match(first.film, /brinu-avatar/, 'first visit keeps the film inside the letters');
  } finally {
    await fresh.context.close();
  }

  const { context, page } = await openIntro({ init: () => window.sessionStorage.setItem('brinu_intro_seen', '1') });
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    const repeat = await page.evaluate(() => {
      const pre = document.getElementById('intro-preloader');
      return { mode: pre.dataset.introMode, film: getComputedStyle(pre.querySelector('[data-intro-letter]')).backgroundImage };
    });
    assert.equal(repeat.mode, 'short');
    assert.equal(repeat.film, 'none', 'repeat visit must not show the film');
    await page.waitForFunction(() => performance.getEntriesByName('intro:complete').length > 0, null, { timeout: 8000 });
    const [exitStart] = await markTime(page, 'intro:exit-start');
    const [complete] = await markTime(page, 'intro:complete');
    assert.ok(complete - exitStart <= 600, `Short exit took ${complete - exitStart}ms`);
  } finally {
    await context.close();
  }
});

test('C12: with JavaScript disabled the hero is visible and the preloader does not cover the page', async () => {
  const { context, page } = await openIntro({ contextOptions: { javaScriptEnabled: false } });
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('#intro-preloader').isVisible(), false, 'preloader must be hidden without JS');
    assert.equal(await page.locator('#hero h1').isVisible(), true, 'hero must be visible without JS');
    await page.locator('#hero a[href="#works"]').click({ trial: true, timeout: 3000 });
  } finally {
    await context.close();
  }
});

test('C18: exit still happens when the avatar image fails to load', async () => {
  const { context, page } = await openIntro();
  try {
    await page.route('**/assets/brinu-avatar.jpg', (route) => route.abort());
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => performance.getEntriesByName('intro:complete').length > 0, null, { timeout: 8000 });
    const [start] = await markTime(page, 'intro:start');
    const [exitStart] = await markTime(page, 'intro:exit-start');
    const waited = exitStart - start;
    assert.ok(waited >= 2900 && waited <= 3600, `Exit should start at the 3 s cap, started at ${waited}ms`);
    assert.equal(await page.locator('#intro-preloader').count(), 0);
  } finally {
    await context.close();
  }
});

test('C19: preloader does not replay when restored from bfcache', async () => {
  const { context, page } = await openIntro({
    init: () => {
      window.__introCompleteCount = 0;
      window.addEventListener('intro-complete', () => { window.__introCompleteCount += 1; });
    },
  });
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => performance.getEntriesByName('intro:complete').length > 0, null, { timeout: 8000 });
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await page.waitForTimeout(300);
    const state = await page.evaluate(() => ({
      preloaders: document.querySelectorAll('#intro-preloader').length,
      starts: performance.getEntriesByName('intro:start').length,
      completes: window.__introCompleteCount,
    }));
    assert.deepEqual(state, { preloaders: 0, starts: 1, completes: 1 });
  } finally {
    await context.close();
  }
});
