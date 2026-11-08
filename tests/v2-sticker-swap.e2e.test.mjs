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





const BRAND = ['#FE0000', '#080808', '#FBFAF4'];

test('C3: each sticker keeps at least 90% of opaque pixels in the brand palette', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    for (let i = 1; i <= 12; i++) {
      const n = String(i).padStart(2, '0');
      const stats = await page.evaluate(async ({ url, brand }) => {
        const img = new Image();
        img.src = url;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, 400, 400);
        const data = ctx.getImageData(0, 0, 400, 400).data;
        const toRgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
        const palette = brand.map(toRgb);
        let opaque = 0;
        let inPalette = 0;
        for (let p = 0; p < data.length; p += 4) {
          if (data[p + 3] < 128) continue;
          opaque++;
          if (palette.some((c) => Math.hypot(data[p] - c[0], data[p + 1] - c[1], data[p + 2] - c[2]) <= 60)) inPalette++;
        }
        return { opaque, share: inPalette / opaque };
      }, { url: `${baseUrl}/stickers/sticker-${n}.svg`, brand: BRAND });
      assert.ok(stats.opaque > 4000, `sticker ${n} must have visible art (${stats.opaque} opaque pixels)`);
      assert.ok(stats.share >= 0.9, `sticker ${n}: only ${(stats.share * 100).toFixed(1)}% of opaque pixels in the brand palette`);
    }
  } finally {
    await context.close();
  }
});

import { STICKERS } from '../src/data/stickers.ts';
import { ptBrDict } from '../src/i18n/dictionaries.ts';

const FILES = STICKERS.map((s) => s.file);
const BADGE = '#comic-nav-logo [data-nav-avatar]';

async function openSwap(contextOptions = {}, locale = 'pt-br') {
  const { context, page } = await openHome(locale, contextOptions);
  await page.waitForTimeout(900);
  return { context, page };
}

const stickerState = (page) =>
  page.evaluate(() => {
    const badge = document.querySelector('#comic-nav-logo [data-nav-avatar]');
    const img = badge.querySelector('[data-nav-sticker]');
    const avatar = badge.querySelector('[data-nav-avatar-img]');
    return {
      active: badge.dataset.stickerActive === 'true',
      src: img ? new URL(img.src, location.href).pathname : null,
      avatarVisible: getComputedStyle(avatar).visibility !== 'hidden',
      stickerVisible: img ? getComputedStyle(img).display !== 'none' : false,
    };
  });

test('C4: pointer enter swaps the avatar for a different library sticker each time', async () => {
  const { context, page } = await openSwap();
  try {
    const seen = [];
    for (let i = 0; i < 8; i++) {
      await page.hover(BADGE);
      await page.waitForTimeout(80);
      const state = await stickerState(page);
      assert.equal(state.active, true, `enter ${i}: a sticker must show`);
      assert.equal(state.stickerVisible, true);
      assert.equal(state.avatarVisible, false, 'the avatar is hidden while a sticker shows');
      assert.ok(FILES.includes(state.src), `${state.src} must come from the library`);
      seen.push(state.src);
      await page.mouse.move(700, 600);
      await page.waitForTimeout(60);
    }
    for (let i = 1; i < seen.length; i++) assert.notEqual(seen[i], seen[i - 1], `sticker ${i} repeated the previous one`);
    assert.ok(new Set(seen).size >= 3, `expected variety, saw ${new Set(seen).size} different stickers`);
  } finally {
    await context.close();
  }
});

test('C5: pointer leave returns the avatar badge', async () => {
  const { context, page } = await openSwap();
  try {
    await page.hover(BADGE);
    await page.waitForTimeout(100);
    assert.equal((await stickerState(page)).active, true);
    await page.mouse.move(700, 600);
    await page.waitForTimeout(100);
    const state = await stickerState(page);
    assert.equal(state.active, false);
    assert.equal(state.avatarVisible, true);
    assert.equal(state.stickerVisible, false);
  } finally {
    await context.close();
  }
});

test('C6: keyboard focus and blur swap and restore the logo', async () => {
  const { context, page } = await openSwap();
  try {
    let focused = false;
    for (let i = 0; i < 6 && !focused; i++) {
      await page.keyboard.press('Tab');
      focused = await page.evaluate(() => document.activeElement?.id === 'comic-nav-logo');
    }
    assert.equal(focused, true, 'the logo must be reachable with Tab');
    const during = await stickerState(page);
    assert.equal(during.active, true, 'focus shows a sticker');
    assert.ok(FILES.includes(during.src));
    await page.keyboard.press('Tab');
    assert.equal((await stickerState(page)).active, false, 'blur restores the avatar');
  } finally {
    await context.close();
  }
});

test('C7: a tap shows a sticker for 1.2 s without scrolling and triple tap still opens the cilada', async () => {
  const { context, page } = await openSwap({ hasTouch: true, viewport: { width: 390, height: 800 } });
  try {
    await page.evaluate(() => {
      window.scrollTo(0, 900);
      window.__cilada = 0;
      window.addEventListener('bebop:cilada-trigger', () => { window.__cilada += 1; });
    });
    await page.waitForTimeout(700);
    const box = await page.locator(BADGE).boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    const scrollBefore = await page.evaluate(() => scrollY);
    await page.touchscreen.tap(x, y);
    await page.waitForTimeout(250);
    assert.equal((await stickerState(page)).active, true, 'a tap shows a sticker');
    assert.equal(await page.evaluate(() => scrollY), scrollBefore, 'a tap must not scroll to the top');
    assert.ok(new URL(page.url()).pathname === '/', 'a tap must not navigate');
    await page.waitForTimeout(1300);
    assert.equal((await stickerState(page)).active, false, 'the avatar returns after 1.2 s');
    for (let i = 0; i < 3; i++) {
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(120);
    }
    assert.equal(await page.evaluate(() => window.__cilada), 1, 'three quick taps open the cilada alert');
    assert.equal(await page.evaluate(() => scrollY), scrollBefore, 'the triple tap must not scroll either');
  } finally {
    await context.close();
  }
});

test('C8: stickers are requested only after load and all twelve are requested', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const reqs = performance.getEntriesByType('resource').filter((e) => /\/stickers\/sticker-\d+\.svg$/.test(e.name));
      return { loadStart: nav.loadEventStart, starts: reqs.map((e) => e.startTime), names: reqs.map((e) => new URL(e.name).pathname) };
    });
    assert.deepEqual([...new Set(info.names)].sort(), [...FILES].sort(), 'all twelve stickers are requested');
    for (const start of info.starts) assert.ok(start >= info.loadStart, `a sticker was requested at ${start}ms, before load (${info.loadStart}ms)`);
  } finally {
    await context.close();
  }
});

test('C9: reduced motion still swaps without an entry animation', async () => {
  const motion = await openSwap();
  try {
    await motion.page.hover(BADGE);
    await motion.page.waitForTimeout(80);
    const name = await motion.page.evaluate(() => getComputedStyle(document.querySelector('[data-nav-sticker]')).animationName);
    assert.notEqual(name, 'none', 'with motion the sticker pops in');
  } finally {
    await motion.context.close();
  }
  const { context, page } = await openSwap({ reducedMotion: 'reduce' });
  try {
    await page.hover(BADGE);
    await page.waitForTimeout(80);
    const state = await stickerState(page);
    assert.equal(state.active, true, 'the swap still happens');
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('[data-nav-sticker]')).animationName), 'none', 'no entry animation');
  } finally {
    await context.close();
  }
});

test('C10: the logo keeps its accessible name and the sticker image is decorative', async () => {
  const { context, page } = await openSwap();
  try {
    const before = await page.locator('#comic-nav-logo').getAttribute('aria-label');
    assert.equal(before, ptBrDict.nav.topAria);
    await page.hover(BADGE);
    await page.waitForTimeout(80);
    assert.equal(await page.locator('#comic-nav-logo').getAttribute('aria-label'), before, 'the name stays while a sticker shows');
    const img = await page.locator('[data-nav-sticker]').evaluate((el) => [el.getAttribute('alt'), el.getAttribute('aria-hidden')]);
    assert.deepEqual(img, ['', 'true']);
  } finally {
    await context.close();
  }
});

test('C18: a failed sticker image keeps the avatar badge', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    await page.route('**/stickers/*.svg', (route) => route.abort());
    await page.addInitScript(() => window.localStorage.setItem('brinu_locale', 'pt-br'));
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await dismissIntroIfPresent(page);
    await page.waitForTimeout(900);
    await page.hover(BADGE);
    await page.waitForTimeout(150);
    const state = await stickerState(page);
    assert.equal(state.active, false);
    assert.equal(state.avatarVisible, true);
  } finally {
    await context.close();
  }
});

test('C19: rapid enter and leave ends on the avatar with no stuck sticker', async () => {
  const { context, page } = await openSwap();
  try {
    await page.evaluate(() => {
      const logo = document.getElementById('comic-nav-logo');
      for (let i = 0; i < 40; i++) {
        logo.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
        logo.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
      }
    });
    await page.waitForTimeout(150);
    const state = await stickerState(page);
    assert.equal(state.active, false);
    assert.equal(state.avatarVisible, true);
    await page.evaluate(() => {
      const logo = document.getElementById('comic-nav-logo');
      for (let i = 0; i < 25; i++) {
        logo.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
        logo.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
      }
      logo.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    });
    assert.equal((await stickerState(page)).active, true, 'a final enter still shows a sticker');
  } finally {
    await context.close();
  }
});

test('C20: a second tap restarts the 1.2 s timer', async () => {
  const { context, page } = await openSwap({ hasTouch: true, viewport: { width: 390, height: 800 } });
  try {
    const box = await page.locator(BADGE).boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.touchscreen.tap(x, y);
    await page.waitForTimeout(800);
    await page.touchscreen.tap(x, y);
    await page.waitForTimeout(800);
    assert.equal((await stickerState(page)).active, true, 'still showing 800 ms after the second tap (1.6 s after the first)');
    await page.waitForTimeout(700);
    assert.equal((await stickerState(page)).active, false, 'the avatar returns 1.2 s after the last tap');
  } finally {
    await context.close();
  }
});

import zlib from 'node:zlib';
import { getLocalizedStickers } from '../src/data/stickers.ts';
import { DICTIONARIES } from '../src/i18n/dictionaries.ts';

async function openStickers(locale = 'pt-br', contextOptions = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...contextOptions });
  const page = await context.newPage();
  await page.addInitScript((loc) => window.localStorage.setItem('brinu_locale', loc), locale);
  await page.goto(`${baseUrl}/stickers`, { waitUntil: 'networkidle' });
  await dismissIntroIfPresent(page);
  await page.waitForTimeout(800);
  return { context, page };
}

const toggleLocale = async (page) => {
  await page.locator('#nav-lang-toggle-btn').dispatchEvent('click');
  await page.waitForTimeout(600);
};

test('C11: /stickers renders the twelve stickers in manifest order with localized alt', async () => {
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openStickers(locale, { reducedMotion: 'reduce' });
    try {
      const expected = getLocalizedStickers(locale);
      const items = await page.locator('[data-stickers-grid] [data-sticker-download]').evaluateAll((els) => els.map((el) => ({ id: el.id, href: el.getAttribute('href'), alt: el.querySelector('img').getAttribute('alt'), loaded: el.querySelector('img').complete })));
      assert.equal(items.length, 12);
      assert.deepEqual(items.map((i) => i.id), expected.map((e) => `sticker-${e.id}`));
      assert.deepEqual(items.map((i) => i.href), expected.map((e) => e.file));
      assert.deepEqual(items.map((i) => i.alt), expected.map((e) => e.alt));
    } finally {
      await context.close();
    }
  }
});

test('C12: activating a sticker downloads its svg with the same content', async () => {
  const { context, page } = await openStickers('pt-br', { reducedMotion: 'reduce' });
  try {
    for (const index of [0, 3, 11]) {
      const link = page.locator('[data-stickers-grid] [data-sticker-download]').nth(index);
      const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
      const n = String(index + 1).padStart(2, '0');
      assert.equal(download.suggestedFilename(), `brinu-sticker-${n}.svg`);
      const saved = fs.readFileSync(await download.path(), 'utf8');
      assert.equal(saved, fs.readFileSync(`public/stickers/sticker-${n}.svg`, 'utf8'), `sticker ${n} content differs from the file`);
    }
  } finally {
    await context.close();
  }
});

test('C13: the stickers page is localized, reuses the nav swap and updates in place', async () => {
  const { context, page } = await openStickers('pt-br');
  try {
    const read = () => page.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]').content,
      h1: document.querySelector('h1').textContent.trim(),
      hint: document.querySelector('[data-i18n="stickers.hint"]').textContent.trim(),
      label: document.querySelector('[data-sticker-download] span').textContent.trim(),
    }));
    for (const locale of ['pt-br', 'en']) {
      if (locale === 'en') {
        await page.evaluate(() => { document.querySelectorAll('h1, [data-sticker-download]').forEach((el, i) => { el.__marker = `n${i}`; }); });
        await toggleLocale(page);
      }
      const dict = DICTIONARIES[locale];
      assert.deepEqual(await read(), { title: dict.meta.stickersTitle, description: dict.meta.stickersDescription, h1: dict.stickers.title, hint: dict.stickers.hint, label: dict.stickers.downloadLabel });
    }
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('h1, [data-sticker-download]')].every((el) => typeof el.__marker === 'string')), true, 'the grid and heading nodes must survive a locale change');
    const first = getLocalizedStickers('en')[0];
    assert.equal(await page.locator(`#sticker-${first.id}`).getAttribute('aria-label'), `${DICTIONARIES.en.stickers.downloadAria} ${first.alt}`);
    await page.waitForTimeout(900);
    await page.hover('#comic-nav-logo [data-nav-avatar]');
    await page.waitForTimeout(100);
    assert.equal((await stickerState(page)).active, true, 'the logo swap works on /stickers too');
  } finally {
    await context.close();
  }
});

test('C14: footer links to /stickers while the menu keeps six items', async () => {
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openHome(locale, { reducedMotion: 'reduce' });
    try {
      const link = page.locator('[data-footer-stickers-link]');
      assert.equal(await link.getAttribute('href'), '/stickers');
      assert.match((await link.textContent()).trim(), /^STICKERS$/);
      await page.locator('#cockpit-trigger-btn').dispatchEvent('click');
      await page.locator('#cockpit-menu-overlay a[href="#lab"]').waitFor({ state: 'visible', timeout: 8000 });
      const hrefs = await page.locator('#cockpit-menu-overlay nav a').evaluateAll((els) => els.map((el) => el.getAttribute('href')));
      assert.deepEqual(hrefs, ['#hero', '#works', '#about', '#lab', '#contact', '/whoami']);
    } finally {
      await context.close();
    }
  }
});

test('C15: with JavaScript disabled the grid and download links work', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/stickers`, { waitUntil: 'domcontentloaded' });
    const links = await page.locator('[data-stickers-grid] [data-sticker-download]').evaluateAll((els) => els.map((el) => ({ href: el.getAttribute('href'), download: el.getAttribute('download'), visible: el.getClientRects().length > 0 })));
    assert.equal(links.length, 12);
    links.forEach((l, i) => {
      const n = String(i + 1).padStart(2, '0');
      assert.equal(l.href, `/stickers/sticker-${n}.svg`);
      assert.equal(l.download, `brinu-sticker-${n}.svg`);
      assert.equal(l.visible, true);
    });
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-sticker-download]').first().click()]);
    assert.equal(download.suggestedFilename(), 'brinu-sticker-01.svg');
  } finally {
    await context.close();
  }
});

const auditText = (page) =>
  page.evaluate(() => {
    const parse = (v) => {
      const m = v.match(/rgba?\(([^)]+)\)/);
      if (m) { const [r, g, b, a = 1] = m[1].split(/[,/ ]+/).filter(Boolean).map(Number); return { r, g, b, a }; }
      const c = v.match(/color\(srgb ([^)]+)\)/);
      if (c) { const [r, g, b, a = 1] = c[1].split(/[ /]+/).filter(Boolean).map(Number); return { r: r * 255, g: g * 255, b: b * 255, a }; }
      return null;
    };
    const lum = ({ r, g, b }) => { const f = (x) => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const bg = parse(getComputedStyle(n).backgroundColor); if (bg && bg.a >= 1) return bg; } return { r: 8, g: 8, b: 8, a: 1 }; };
    const out = [];
    const walker = document.createTreeWalker(document.getElementById('main-content'), NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent.trim()) continue;
      const el = node.parentElement;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const size = parseFloat(cs.fontSize);
      if (size >= 24) continue;
      const fg = parse(cs.color);
      const bg = bgOf(el);
      const l1 = lum(fg);
      const l2 = lum(bg);
      out.push({ text: node.textContent.trim().slice(0, 30), contrast: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) });
    }
    return out;
  });

test('C16: /stickers has zero overflow and contrast at least 4.5:1', async () => {
  for (const locale of ['pt-br', 'en']) {
    for (const width of [320, 375, 768, 1440]) {
      const { context, page } = await openStickers(locale, { reducedMotion: 'reduce', viewport: { width, height: 900 } });
      try {
        const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth }));
        assert.ok(m.sw <= m.cw && m.bw <= m.cw, `Overflow at ${width}px (${locale}): ${m.sw}/${m.bw} > ${m.cw}`);
        const audit = await auditText(page);
        assert.ok(audit.length >= 14, 'expected to audit the page text');
        assert.deepEqual(audit.filter((r) => r.contrast < 4.5).map((r) => `${r.text} (${r.contrast.toFixed(2)})`), [], `low contrast at ${width}px (${locale})`);
      } finally {
        await context.close();
      }
    }
  }
});

test('C17: built js stays within 190 kB gzip', () => {
  let total = 0;
  for (const f of fs.readdirSync('dist/_astro').filter((n) => n.endsWith('.js'))) total += zlib.gzipSync(fs.readFileSync(`dist/_astro/${f}`)).length;
  assert.ok(total <= 190 * 1000, `client js gzip total is ${(total / 1000).toFixed(1)} kB, budget is 190 kB`);
});
