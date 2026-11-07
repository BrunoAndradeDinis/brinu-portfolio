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
        await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => performance.getEntriesByName('intro:beat-fly').length > 0, null, { timeout: 8000 });
        const during = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
        assert.ok(during.scrollWidth <= during.vw, `Overflow during intro at ${width}px (${locale}): ${during.scrollWidth} > ${during.vw}`);
        await page.waitForFunction(() => performance.getEntriesByName('intro:complete').length > 0, null, { timeout: 8000 });
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

const waitForComplete = (page, timeout = 9000) =>
  page.waitForFunction(() => performance.getEntriesByName('intro:complete').length > 0, null, { timeout });

const samplerInit = () => {
  window.__samples = [];
  window.__shardSeen = false;
  const loop = () => {
    const red = document.querySelector('[data-intro-cut="red"]');
    const black = document.querySelector('[data-intro-cut="black"]');
    if (red || black) window.__shardSeen = true;
    const u = document.querySelector('[data-intro-letter="U"]');
    const hu = document.querySelector('[data-hero-letter="U"]');
    if (u && hu && document.getElementById('intro-preloader')?.dataset.introState === 'exiting') {
      const a = u.getBoundingClientRect();
      const b = hu.getBoundingClientRect();
      window.__samples.push({
        t: performance.now(),
        red: red ? red.getBoundingClientRect().left : null,
        black: black ? black.getBoundingClientRect().left : null,
        opacity: Number(getComputedStyle(u).opacity),
        dx: Math.abs(a.left - b.left), dy: Math.abs(a.top - b.top), dw: Math.abs(a.width - b.width), dh: Math.abs(a.height - b.height),
      });
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};

test('C4: exit timeline runs cut, letter flight and settle beats', async () => {
  const { context, page } = await openIntro({ init: samplerInit });
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await waitForComplete(page);
    const [cut] = await markTime(page, 'intro:beat-cut');
    const [fly] = await markTime(page, 'intro:beat-fly');
    const [settle] = await markTime(page, 'intro:beat-settle');
    assert.ok(cut !== undefined && fly !== undefined && settle !== undefined, 'all three beats must run');
    assert.ok(cut < fly && fly < settle, `beats out of order: ${cut}, ${fly}, ${settle}`);
    assert.ok(fly - cut >= 120 && fly - cut <= 320, `flight should start ~200ms after the cut, got ${fly - cut}`);
    assert.ok(settle - fly >= 400 && settle - fly <= 650, `settle should start ~500ms after flight, got ${settle - fly}`);

    const { samples, seen } = await page.evaluate(() => ({ samples: window.__samples, seen: window.__shardSeen }));
    assert.equal(seen, true, 'the red and black polygons must appear');
    const redXs = samples.filter((s) => s.red !== null).map((s) => s.red);
    const blackXs = samples.filter((s) => s.black !== null).map((s) => s.black);
    assert.ok(redXs.length > 3 && blackXs.length > 3, 'both polygons must be sampled while crossing');
    assert.ok(redXs[redXs.length - 1] > redXs[0], 'red polygon must travel left to right');
    assert.ok(blackXs[blackXs.length - 1] < blackXs[0], 'black polygon must travel right to left');

    const flying = samples.filter((s) => s.opacity > 0.6);
    const last = flying[flying.length - 1];
    assert.ok(flying[0].dx + flying[0].dy + flying[0].dw > 8, 'letter must start away from its hero position');
    assert.ok(last.dx < 4 && last.dy < 4 && last.dw < 4 && last.dh < 4, `letter must land on its hero letter, residual ${JSON.stringify(last)}`);
  } finally {
    await context.close();
  }
});

test('C5: full exit timeline lasts at most 1.4 s', async () => {
  const { context, page } = await openIntro();
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await waitForComplete(page);
    const [exitStart] = await markTime(page, 'intro:exit-start');
    const [complete] = await markTime(page, 'intro:complete');
    assert.ok(complete - exitStart <= 1400, `Exit took ${complete - exitStart}ms`);
    assert.ok(complete - exitStart >= 1000, `Exit suspiciously short: ${complete - exitStart}ms`);
  } finally {
    await context.close();
  }
});

test('C6: hero letters end at final layout position with no residual transform', async () => {
  const { context, page } = await openIntro();
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await waitForComplete(page);
    const letters = await page.evaluate(() =>
      [...document.querySelectorAll('[data-hero-letter]')].map((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { transform: cs.transform, visibility: cs.visibility, opacity: cs.opacity, left: r.left, right: r.right, inView: r.left >= 0 && r.right <= innerWidth };
      }),
    );
    assert.equal(letters.length, 5);
    for (const l of letters) {
      assert.ok(l.transform === 'none' || l.transform === 'matrix(1, 0, 0, 1, 0, 0)', `residual transform ${l.transform}`);
      assert.equal(l.visibility, 'visible');
      assert.equal(l.opacity, '1');
      assert.equal(l.inView, true);
    }
    for (let i = 1; i < letters.length; i++) assert.ok(letters[i].left >= letters[i - 1].right - 1, 'letters must sit left to right without overlap');
  } finally {
    await context.close();
  }
});

test('C7: preloader removed, intro-complete fired once and scroll released', async () => {
  const { context, page } = await openIntro({
    init: () => {
      window.__introCompleteCount = 0;
      window.addEventListener('intro-complete', () => { window.__introCompleteCount += 1; });
    },
  });
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await waitForComplete(page);
    await page.waitForTimeout(400);
    const state = await page.evaluate(() => ({
      preloaders: document.querySelectorAll('#intro-preloader').length,
      shards: document.querySelectorAll('[data-intro-cut]').length,
      completes: window.__introCompleteCount,
      locked: document.documentElement.classList.contains('lenis-stopped'),
    }));
    assert.deepEqual(state, { preloaders: 0, shards: 0, completes: 1, locked: false });
    await page.mouse.move(700, 500);
    await page.mouse.wheel(0, 600);
    await page.waitForFunction(() => window.scrollY > 100, null, { timeout: 4000 });
  } finally {
    await context.close();
  }
});

test('C8 sample: scroll stays locked while the intro runs and unlocks after', async () => {
  const { context, page } = await openIntro();
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('lenis-stopped')), true);
    await waitForComplete(page);
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('lenis-stopped')), false);
  } finally {
    await context.close();
  }
});

test('C9: click or key jumps to beat 3 and finishes within 0.7 s', async () => {
  for (const trigger of ['click', 'Escape', 'Space', 'Enter']) {
    const { context, page } = await openIntro({ init: samplerInit });
    try {
      await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);
      if (trigger === 'click') await page.locator('#intro-preloader').dispatchEvent('click');
      else await page.keyboard.press(trigger);
      await waitForComplete(page);
      const [exitStart] = await markTime(page, 'intro:exit-start');
      const [complete] = await markTime(page, 'intro:complete');
      assert.ok(complete - exitStart <= 700, `${trigger}: skip exit took ${complete - exitStart}ms`);
      assert.equal((await markTime(page, 'intro:beat-fly')).length, 0, `${trigger}: skip must not run the flight beat`);
      assert.equal((await markTime(page, 'intro:beat-settle')).length, 1, `${trigger}: skip must run the settle beat`);
      assert.equal(await page.evaluate(() => window.__shardSeen), false, `${trigger}: skip must not show the polygons`);
    } finally {
      await context.close();
    }
  }

  const { context, page } = await openIntro();
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => performance.getEntriesByName('intro:beat-fly').length > 0, null, { timeout: 8000 });
    const clickedAt = await page.evaluate(() => {
      document.getElementById('intro-preloader').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return performance.now();
    });
    await waitForComplete(page);
    const [complete] = await markTime(page, 'intro:complete');
    assert.ok(complete - clickedAt <= 700, `skipping mid-exit took ${complete - clickedAt}ms`);
  } finally {
    await context.close();
  }
});

test('C11: reduced motion uses a 200 ms crossfade without polygons or letter flight', async () => {
  const { context, page } = await openIntro({ contextOptions: { reducedMotion: 'reduce' }, init: samplerInit });
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await waitForComplete(page);
    const [exitStart] = await markTime(page, 'intro:exit-start');
    const [complete] = await markTime(page, 'intro:complete');
    const duration = complete - exitStart;
    assert.ok(duration >= 150 && duration <= 320, `Crossfade took ${duration}ms`);
    assert.equal(await page.evaluate(() => window.__shardSeen), false, 'no polygons in reduced motion');
    assert.equal((await markTime(page, 'intro:beat-fly')).length, 0, 'no letter flight in reduced motion');
    assert.equal((await markTime(page, 'intro:beat-cut')).length, 0, 'no cut in reduced motion');
  } finally {
    await context.close();
  }
});

test('C20: locale change during the intro updates hero texts without restarting the timeline', async () => {
  const { context, page } = await openIntro();
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => performance.getEntriesByName('intro:beat-fly').length > 0, null, { timeout: 8000 });
    await page.locator('#nav-lang-toggle-btn').dispatchEvent('click');
    await waitForComplete(page);
    const left = await page.locator('[data-hero-manifesto="left"]').evaluate((el) => el.innerText.replace(/\s+/g, ' ').trim().toUpperCase());
    assert.ok(left.includes('8 YEARS AT MAGALU'), `hero should be in English, got "${left}"`);
    for (const name of ['intro:start', 'intro:exit-start', 'intro:beat-cut', 'intro:beat-fly', 'intro:complete']) {
      assert.equal((await markTime(page, name)).length, 1, `${name} must run exactly once`);
    }
  } finally {
    await context.close();
  }
});

test('C21: resize during letter flight still ends with letters at final positions', async () => {
  const { context, page } = await openIntro();
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => performance.getEntriesByName('intro:beat-fly').length > 0, null, { timeout: 8000 });
    await page.setViewportSize({ width: 900, height: 700 });
    await waitForComplete(page);
    await page.waitForTimeout(300);
    const letters = await page.evaluate(() =>
      [...document.querySelectorAll('[data-hero-letter]')].map((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { transform: cs.transform, visibility: cs.visibility, left: r.left, right: r.right, inView: r.left >= 0 && r.right <= innerWidth };
      }),
    );
    for (const l of letters) {
      assert.ok(l.transform === 'none' || l.transform === 'matrix(1, 0, 0, 1, 0, 0)', `residual transform ${l.transform}`);
      assert.equal(l.visibility, 'visible');
      assert.equal(l.inView, true);
    }
    for (let i = 1; i < letters.length; i++) assert.ok(letters[i].left >= letters[i - 1].right - 1);
  } finally {
    await context.close();
  }
});
