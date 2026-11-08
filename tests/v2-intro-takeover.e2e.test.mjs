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


const HERO_BASELINE = {"pt-br": {"ticker": "• DESENVOLVEDOR FRONTEND • MAGALU CLOUD • CREATIVE DEVELOPER • PAI DA HELENA • FRANCA / SP • SEE YOU SPACE COWBOY •", "avatarAria": "Avatar oficial de Bruno Dinis em moldura brutalista. Clique para interagir.", "bubbleDefault": "Pai da Helena & Noivo Apaixonado", "stamp": "PAI DA HELENA", "phrases": ["Pai da Helena & Noivo Apaixonado", "É uma cilada, Brinu!", "Desenvolvedor Frontend & Creative Developer", "Base: Franca / SP • Remoto", "Astro, React & motion de autor"], "manifestoLeftLine1": "8 ANOS DE MAGALU", "manifestoLeftLine2": "DO ATENDIMENTO", "manifestoLeftLine3": "AO FRONT-END", "craftCta": "A ENGENHARIA COMEÇOU", "craftAria": "Explorar projetos selecionados", "manifestoRightLine1": "INTERFACES", "manifestoRightLine2": "COM PERSONALIDADE", "manifestoRightLine3": "E CÓDIGO LIMPO", "socialAria": "Canais Oficiais de Contato e Perfis Sociais"}, "en": {"ticker": "• FRONTEND DEVELOPER • MAGALU CLOUD • CREATIVE DEVELOPER • HELENA'S DAD • FRANCA / SP • SEE YOU SPACE COWBOY •", "avatarAria": "Official avatar of Bruno Dinis in brutalist frame. Click to interact.", "bubbleDefault": "Helena's Dad & Devoted Fiancé", "stamp": "HELENA'S DAD", "phrases": ["Helena's Dad & Devoted Fiancé", "It's a trap, Brinu!", "Frontend Developer & Creative Developer", "Base: Franca / SP • Remote", "Astro, React & signature motion"], "manifestoLeftLine1": "8 YEARS AT MAGALU", "manifestoLeftLine2": "FROM SUPPORT", "manifestoLeftLine3": "TO FRONTEND", "craftCta": "THE CRAFT HAS BEGUN", "craftAria": "Explore selected works: The Craft Has Begun", "manifestoRightLine1": "INTERFACES", "manifestoRightLine2": "WITH PERSONALITY", "manifestoRightLine3": "AND CLEAN CODE", "socialAria": "Official Contact Channels and Social Profiles"}};
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
    const img = await page.evaluate(() => {
      const f = document.querySelector('[data-hero-avatar-frame]').getBoundingClientRect();
      const i = document.querySelector('[data-hero-avatar-frame] img');
      const r = i.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, fx: f.left + f.width / 2, fy: f.top + f.height / 2, fw: f.width, loaded: i.complete && i.naturalWidth > 0 };
    });
    assert.equal(img.loaded, true, 'avatar image must be loaded inside the frame');
    assert.ok(Math.abs(img.cx - img.fx) < img.fw / 4 && Math.abs(img.cy - img.fy) < img.fw / 4, 'avatar image must sit inside the polygonal frame');
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
      assert.equal(await page.locator(`[data-hero-manifesto="${side}"]`).evaluate((el) => el.classList.contains('p5-panel')), true, `${side} manifesto must carry the p5-panel class`);
      assert.match(info.clip, /^polygon\(/, `${side} manifesto needs a polygon clip-path`);
    }

    const badges = await page.locator('#hero [data-hero-socials] [data-p5-badge]').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, left: r.left, right: r.right, height: r.height, text: el.textContent.trim() };
      }),
    );
    assert.equal(await page.locator('#hero [data-hero-socials] [data-p5-badge].p5-badge').count(), 3, 'three badges rendered through P5Badge');
    assert.deepEqual(badges.map((b) => b.text), ['GITHUB', 'LINKEDIN', 'E-MAIL']);
    for (let i = 1; i < badges.length; i++) {
      assert.ok(badges[i].top >= badges[i - 1].top + badges[i - 1].height - 1, 'badges must stack vertically, no side by side');
      assert.ok(Math.abs(badges[i].right - badges[0].right) < 2, 'badges must share one column edge');
    }
    await page.setViewportSize({ width: 375, height: 812 });
    const narrow = await page.locator('#hero [data-hero-socials] [data-p5-badge]').evaluateAll((els) => els.map((el) => ({ top: el.getBoundingClientRect().top, left: el.getBoundingClientRect().left })));
    for (let i = 1; i < narrow.length; i++) {
      assert.ok(narrow[i].top > narrow[i - 1].top, 'badges must stay stacked at 375px');
      assert.ok(Math.abs(narrow[i].left - narrow[0].left) < 2, 'badges must share one column at 375px');
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
    assert.deepEqual(dict, HERO_BASELINE[locale], `hero strings changed in ${locale}`);

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
        const expected = HERO_BASELINE[locale][r.key];
        const actual = r.attr ? r.attrValue : r.text;
        assert.equal(actual, expected, `hero.${r.key} differs in ${locale}`);
      }
    } finally {
      await context.close();
    }
  }
});

test('C15: hero ticker renders its full bottom black border stripe', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    const styles = await page.locator('[data-hero-ticker]').evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        clipPath: cs.clipPath,
        borderBottomWidth: cs.borderBottomWidth,
        borderBottomStyle: cs.borderBottomStyle,
        borderBottomColor: cs.borderBottomColor,
      };
    });
    assert.equal(styles.clipPath, 'none', `Expected no clip-path cutting the bottom border, got ${styles.clipPath}`);
    assert.equal(styles.borderBottomWidth, '6px');
    assert.equal(styles.borderBottomStyle, 'solid');
    assert.equal(styles.borderBottomColor, 'rgb(8, 8, 8)');
  } finally {
    await context.close();
  }
});

test('C17: zero horizontal overflow at 320, 375, 768 and 1440px in pt-br and en during and after the intro', async () => {
  const widths = [320, 375, 768, 1440];
  for (const locale of ['pt-br', 'en']) {
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: width === 320 ? 568 : 900 } });
      const page = await context.newPage();
      try {
        await page.addInitScript((loc) => window.localStorage.setItem('brinu_locale', loc), locale);
        await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
        for (const beat of ['intro:beat-cut', 'intro:beat-fly', 'intro:beat-settle']) {
          await page.waitForFunction((b) => performance.getEntriesByName(b).length > 0, beat, { timeout: 8000 });
          const during = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth, bodyScroll: document.body.scrollWidth }));
          assert.ok(during.scrollWidth <= during.vw && during.bodyScroll <= during.vw, `Overflow at ${beat} at ${width}px (${locale}): ${during.scrollWidth}/${during.bodyScroll} > ${during.vw}`);
        }
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
    await fresh.page.waitForFunction(() => performance.getEntriesByName('intro:exit-start').length > 0, null, { timeout: 8000 });
    assert.equal(await fresh.page.evaluate(() => window.sessionStorage.getItem('brinu_intro_seen')), '1', 'the first visit must set the repeat-visit flag');
    await fresh.page.waitForFunction(() => performance.getEntriesByName('intro:complete').length > 0, null, { timeout: 8000 });
    await fresh.page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await fresh.page.evaluate(() => document.getElementById('intro-preloader').dataset.introMode), 'short', 'a reload in the same tab must run the short intro');
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
    assert.ok(complete - exitStart <= 600 && complete - exitStart >= 300, `Short exit took ${complete - exitStart}ms`);
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
  window.__shardColors = {};
  const loop = () => {
    const red = document.querySelector('[data-intro-cut="red"]');
    const black = document.querySelector('[data-intro-cut="black"]');
    if (red || black) window.__shardSeen = true;
    if (red) window.__shardColors.red = getComputedStyle(red).backgroundColor;
    if (black) window.__shardColors.black = getComputedStyle(black).backgroundColor;
    const pre = document.getElementById('intro-preloader');
    if (pre && pre.dataset.introState === 'exiting') {
      const letters = {};
      for (const l of ['B', 'R', 'I', 'N', 'U']) {
        const a = document.querySelector(`[data-intro-letter="${l}"]`);
        const h = document.querySelector(`[data-hero-letter="${l}"]`);
        if (!a || !h) continue;
        const ra = a.getBoundingClientRect();
        const rh = h.getBoundingClientRect();
        letters[l] = {
          opacity: Number(getComputedStyle(a).opacity),
          dx: Math.abs(ra.left - rh.left), dy: Math.abs(ra.top - rh.top), dw: Math.abs(ra.width - rh.width), dh: Math.abs(ra.height - rh.height),
        };
      }
      const header = document.getElementById('comic-nav-header');
      const panel = document.querySelector('[data-hero-manifesto="left"]');
      const ticker = document.querySelector('[data-hero-ticker]');
      window.__samples.push({
        t: performance.now(),
        red: red ? red.getBoundingClientRect().left : null,
        black: black ? black.getBoundingClientRect().left : null,
        preloaderOpacity: Number(getComputedStyle(pre).opacity),
        letters,
        headerTop: header ? header.getBoundingClientRect().top : null,
        panelOpacity: panel ? Number(getComputedStyle(panel).opacity) : null,
        tickerTop: ticker ? ticker.getBoundingClientRect().top : null,
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

    const { samples, seen, colors } = await page.evaluate(() => ({ samples: window.__samples, seen: window.__shardSeen, colors: window.__shardColors }));
    assert.equal(seen, true, 'the red and black polygons must appear');
    assert.equal(colors.red, 'rgb(254, 0, 0)', 'one polygon must be the brand red');
    assert.equal(colors.black, 'rgb(8, 8, 8)', 'the other polygon must be the brand black');
    const redXs = samples.filter((s) => s.red !== null).map((s) => s.red);
    const blackXs = samples.filter((s) => s.black !== null).map((s) => s.black);
    assert.ok(redXs.length > 3 && blackXs.length > 3, 'both polygons must be sampled while crossing');
    assert.ok(redXs[redXs.length - 1] > redXs[0], 'red polygon must travel left to right');
    assert.ok(blackXs[blackXs.length - 1] < blackXs[0], 'black polygon must travel right to left');

    for (const letter of ['B', 'R', 'I', 'N', 'U']) {
      const seenSamples = samples.map((s) => s.letters[letter]).filter((l) => l && l.opacity > 0.6);
      assert.ok(seenSamples.length > 3, `${letter} must be sampled in flight`);
      const first = seenSamples[0];
      const last = seenSamples[seenSamples.length - 1];
      assert.ok(first.dx + first.dy + first.dw + first.dh > 4, `${letter} must start away from its hero position`);
      assert.ok(last.dx < 4 && last.dy < 4 && last.dw < 4 && last.dh < 4, `${letter} must land on its hero letter, residual ${JSON.stringify(last)}`);
    }

    const headerTops = samples.map((s) => s.headerTop).filter((v) => v !== null);
    assert.ok(Math.min(...headerTops) < -20, 'the nav must start above the viewport and descend in the settle beat');
    assert.ok(headerTops[headerTops.length - 1] > -1, 'the nav must end in place');
    const panelOpacities = samples.map((s) => s.panelOpacity).filter((v) => v !== null);
    assert.ok(Math.min(...panelOpacities) < 0.5 && panelOpacities[panelOpacities.length - 1] === 1, 'manifestos must fade in during the settle beat');
    const tickerTops = samples.map((s) => s.tickerTop).filter((v) => v !== null);
    assert.ok(tickerTops[0] < tickerTops[tickerTops.length - 1] - 20, 'the ticker must drop into place during the settle beat');
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
  const { context, page } = await openIntro({ init: samplerInit });
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await waitForComplete(page);
    const samples = await page.evaluate(() => window.__samples);
    for (const letter of ['B', 'R', 'I', 'N', 'U']) {
      const visible = samples.map((s) => s.letters[letter]).filter((l) => l && l.opacity > 0.6);
      const last = visible[visible.length - 1];
      assert.ok(last.dx < 4 && last.dy < 4 && last.dw < 4 && last.dh < 4, `${letter} must end beat 2 on its hero slot, residual ${JSON.stringify(last)}`);
    }
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
    const opacities = (await page.evaluate(() => window.__samples)).map((s) => s.preloaderOpacity);
    assert.ok(opacities.some((o) => o > 0.05 && o < 0.95), 'the preloader must fade through intermediate opacities');
    assert.ok(opacities[opacities.length - 1] < opacities[0], 'the preloader opacity must fall during the crossfade');
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
  const measure = (pg) =>
    pg.evaluate(() =>
      [...document.querySelectorAll('[data-hero-letter]')].map((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { transform: cs.transform, visibility: cs.visibility, left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width) };
      }),
    );

  const reference = await openIntro({ contextOptions: { viewport: { width: 900, height: 700 } } });
  let expected;
  try {
    await reference.page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await waitForComplete(reference.page);
    await reference.page.waitForTimeout(300);
    expected = await measure(reference.page);
  } finally {
    await reference.context.close();
  }

  const { context, page } = await openIntro();
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => performance.getEntriesByName('intro:beat-fly').length > 0, null, { timeout: 8000 });
    await page.setViewportSize({ width: 900, height: 700 });
    await waitForComplete(page);
    await page.waitForTimeout(300);
    const letters = await measure(page);
    assert.equal(letters.length, 5);
    letters.forEach((l, i) => {
      assert.ok(l.transform === 'none' || l.transform === 'matrix(1, 0, 0, 1, 0, 0)', `residual transform ${l.transform}`);
      assert.equal(l.visibility, 'visible');
      assert.ok(Math.abs(l.left - expected[i].left) <= 2 && Math.abs(l.top - expected[i].top) <= 2 && Math.abs(l.width - expected[i].width) <= 2,
        `letter ${i} at ${JSON.stringify(l)} should match the layout of a fresh 900x700 load ${JSON.stringify(expected[i])}`);
    });
  } finally {
    await context.close();
  }
});

test('C19: bfcache restore while the preloader is still loading finishes it instead of replaying', async () => {
  const { context, page } = await openIntro();
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => performance.getEntriesByName('intro:exit-start').length), 0, 'precondition: still loading');
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await page.waitForFunction(() => performance.getEntriesByName('intro:exit-start').length > 0, null, { timeout: 800 });
    await waitForComplete(page);
    const [start] = await markTime(page, 'intro:start');
    const [complete] = await markTime(page, 'intro:complete');
    assert.ok(complete - start < 1200, `restored page must skip the wait, took ${complete - start}ms`);
    assert.equal((await markTime(page, 'intro:start')).length, 1);
  } finally {
    await context.close();
  }
});
