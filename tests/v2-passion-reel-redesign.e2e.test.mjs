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



const ACCENTS = ['#EBA602', '#30B5BB', '#2B3A8C', '#30B5BB', '#EBA602', '#EBA602'];
const BRAND = ['#FE0000', '#080808', '#FBFAF4'];

test('C3: each background keeps to the brand palette plus its accent at most 15%', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    for (let i = 1; i <= 6; i++) {
      const stats = await page.evaluate(async ({ url, brand, accent }) => {
        const img = new Image();
        img.src = url;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 1120;
        canvas.height = 728;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 1120, 728);
        const data = ctx.getImageData(0, 0, 1120, 728).data;
        const toRgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
        const near = (r, g, b, c) => Math.hypot(r - c[0], g - c[1], b - c[2]) <= 60;
        const brandRgb = brand.map(toRgb);
        const accentRgb = toRgb(accent);
        let inPalette = 0;
        let accentPixels = 0;
        const total = 1120 * 728;
        for (let p = 0; p < data.length; p += 4) {
          const r = data[p], g = data[p + 1], b = data[p + 2];
          if (near(r, g, b, accentRgb)) { accentPixels++; inPalette++; }
          else if (brandRgb.some((c) => near(r, g, b, c))) inPalette++;
        }
        return { inPalette: inPalette / total, accent: accentPixels / total };
      }, { url: `${baseUrl}/assets/filmstrip/passion-bg-${i}.svg`, brand: BRAND, accent: ACCENTS[i - 1] });
      assert.ok(stats.inPalette >= 0.9, `bg ${i}: only ${(stats.inPalette * 100).toFixed(1)}% of pixels in palette`);
      assert.ok(stats.accent <= 0.15, `bg ${i}: accent covers ${(stats.accent * 100).toFixed(1)}%`);
      assert.ok(stats.accent > 0.005, `bg ${i}: accent should be visible (${(stats.accent * 100).toFixed(2)}%)`);
    }
  } finally {
    await context.close();
  }
});

test('C4: rendered frames show the six backgrounds in order', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    const srcs = await page.locator('[data-passion-slide] img').evaluateAll((els) => els.map((el) => new URL(el.src).pathname));
    assert.deepEqual(srcs, [1, 2, 3, 4, 5, 6].map((n) => `/assets/filmstrip/passion-bg-${n}.svg`));
    const loaded = await page.locator('[data-passion-slide] img').evaluateAll((els) => els.map((el) => el.complete && el.naturalWidth > 0));
    assert.deepEqual(loaded, [true, true, true, true, true, true], 'every background must load');
  } finally {
    await context.close();
  }
});

import { PASSION_DECK, FORBIDDEN_PHRASES } from './fixtures/passion-reel/deck.mjs';

const TAGS = {
  'pt-br': ['FRAME 01 // BANDA MEDULLA', 'FRAME 02 // ONE PIECE', 'FRAME 03 // COWBOY BEBOP', 'FRAME 04 // AKIRA 1988', 'FRAME 05 // CAFÉ ESPECIAL', 'FRAME 06 // CULINÁRIA & STREET FOOD'],
  en: ['FRAME 01 // MEDULLA BAND', 'FRAME 02 // ONE PIECE', 'FRAME 03 // COWBOY BEBOP', 'FRAME 04 // AKIRA 1988', 'FRAME 05 // SPECIALTY COFFEE', 'FRAME 06 // GASTRONOMY & STREET FOOD'],
};

const readFrames = (page) =>
  page.locator('[data-passion-slide]').evaluateAll((slides) =>
    slides.map((slide) => {
      const t = (sel) => slide.querySelector(sel).textContent.replace(/\s+/g, ' ').trim();
      const card = slide.querySelectorAll('[data-passion-card] > span');
      return {
        tag: t('[data-passion-tag]'),
        headline: t('[data-passion-headline]'),
        credits: t('[data-passion-credits]'),
        highlight: t('[data-passion-highlight]'),
        cardTitle: card[0].textContent.trim(),
        cardSub: card[1].textContent.trim(),
        alt: slide.querySelector('img').getAttribute('alt'),
      };
    }),
  );

const toggleLocale = async (page) => {
  await page.locator('#nav-lang-toggle-btn').dispatchEvent('click');
  await page.waitForTimeout(400);
};

test('C5: each frame renders the pt-br copy deck as HTML text', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    const frames = await readFrames(page);
    assert.equal(frames.length, 6);
    frames.forEach((frame, i) => {
      assert.equal(frame.tag, TAGS['pt-br'][i], `tag ${i + 1}`);
      for (const field of ['headline', 'credits', 'highlight', 'cardTitle', 'cardSub']) {
        assert.equal(frame[field], PASSION_DECK['pt-br'][i][field], `frame ${i + 1} ${field}`);
      }
    });
  } finally {
    await context.close();
  }
});

test('C6: switching to en renders the English copy deck', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    await toggleLocale(page);
    assert.equal(await page.evaluate(() => localStorage.getItem('brinu_locale')), 'en');
    const frames = await readFrames(page);
    frames.forEach((frame, i) => {
      assert.equal(frame.tag, TAGS.en[i], `tag ${i + 1}`);
      for (const field of ['headline', 'credits', 'highlight', 'cardTitle', 'cardSub']) {
        assert.equal(frame[field], PASSION_DECK.en[i][field], `frame ${i + 1} ${field}`);
      }
    });
  } finally {
    await context.close();
  }
});

test('C7: headline uses the display font and other lines the mono font', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    const result = await page.evaluate(() => {
      const first = (v) => v.split(',')[0].trim().replace(/^["']|["']$/g, '').toLowerCase();
      const root = getComputedStyle(document.documentElement);
      const display = first(root.getPropertyValue('--font-display'));
      const mono = first(root.getPropertyValue('--font-mono'));
      const families = (sel) => [...document.querySelectorAll(`[data-passion-slide] ${sel}`)].map((el) => first(getComputedStyle(el).fontFamily));
      return {
        display, mono,
        headline: families('[data-passion-headline]'),
        credits: families('[data-passion-credits]'),
        highlight: families('[data-passion-highlight]'),
        card: families('[data-passion-card] > span'),
      };
    });
    assert.ok(result.display && result.display !== 'sans-serif', `display font token was "${result.display}"`);
    assert.ok(result.mono && result.mono !== 'sans-serif' && result.mono !== 'monospace', `mono font token was "${result.mono}"`);
    assert.deepEqual(result.headline, Array(6).fill(result.display));
    assert.deepEqual(result.credits, Array(6).fill(result.mono));
    assert.deepEqual(result.highlight, Array(6).fill(result.mono));
    assert.deepEqual(result.card, Array(12).fill(result.mono));
    const loaded = await page.evaluate(() =>
      [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/^["']|["']$/g, '').toLowerCase()),
    );
    assert.ok(loaded.includes(result.display), `display font "${result.display}" must be loaded, loaded: ${loaded.join(', ')}`);
    assert.ok(loaded.includes(result.mono), `mono font "${result.mono}" must be loaded, loaded: ${loaded.join(', ')}`);
  } finally {
    await context.close();
  }
});

test('C8: removed third-party phrases do not appear in the passion frames', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    for (const locale of ['pt-br', 'en']) {
      if (locale === 'en') await toggleLocale(page);
      const text = (await page.locator('[data-passion-slide]').evaluateAll((els) => els.map((el) => el.textContent + ' ' + el.querySelector('img').alt).join(' '))).toLowerCase();
      for (const phrase of FORBIDDEN_PHRASES) assert.ok(!text.includes(phrase), `${locale}: frames still show "${phrase}"`);
    }
    const html = fs.readFileSync('dist/index.html', 'utf8').toLowerCase();
    for (const phrase of FORBIDDEN_PHRASES) {
      const inFrames = html.split('data-passion-slide').slice(1).join(' ').includes(phrase);
      assert.equal(inFrames, false, `built HTML frames still contain "${phrase}"`);
    }
  } finally {
    await context.close();
  }
});

test('C14: each frame image keeps a translated non-empty alt', async () => {
  const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    const pt = (await readFrames(page)).map((f) => f.alt);
    await toggleLocale(page);
    const en = (await readFrames(page)).map((f) => f.alt);
    pt.forEach((alt, i) => {
      assert.equal(alt, DICTIONARIES['pt-br'].filmstrip.passionSlides[`p${i + 1}Alt`], `pt alt ${i + 1}`);
      assert.equal(en[i], DICTIONARIES.en.filmstrip.passionSlides[`p${i + 1}Alt`], `en alt ${i + 1}`);
      assert.ok(alt.trim().length > 10 && en[i].trim().length > 10, `alt ${i + 1} must be non-empty`);
      assert.notEqual(alt, en[i], `alt ${i + 1} must be translated`);
    });
  } finally {
    await context.close();
  }
});

test('C17: locale change keeps the passion frame nodes', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    await page.evaluate(() => {
      document.querySelectorAll('[data-passion-slide], [data-passion-slide] [data-passion-headline], [data-passion-slide] img').forEach((el, i) => { el.__marker = `n${i}`; });
    });
    const before = await readFrames(page);
    await toggleLocale(page);
    const after = await readFrames(page);
    assert.notEqual(before[4].headline, after[4].headline, 'precondition: the text did change');
    const kept = await page.evaluate(() =>
      [...document.querySelectorAll('[data-passion-slide], [data-passion-slide] [data-passion-headline], [data-passion-slide] img')].every((el) => typeof el.__marker === 'string'));
    assert.equal(kept, true, 'frame nodes must survive a locale change');
  } finally {
    await context.close();
  }
});

const auditFrames = (page) =>
  page.locator('[data-passion-slide]').evaluateAll((slides) => {
    const parse = (value) => {
      const m = value.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const [r, g, b, a = 1] = m[1].split(/[,/ ]+/).filter(Boolean).map(Number);
        return { r, g, b, a };
      }
      const c = value.match(/color\(srgb ([^)]+)\)/);
      if (c) {
        const [r, g, b, a = 1] = c[1].split(/[ /]+/).filter(Boolean).map(Number);
        return { r: r * 255, g: g * 255, b: b * 255, a };
      }
      return null;
    };
    const lum = ({ r, g, b }) => {
      const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
    return slides.map((slide, index) => {
      const figure = slide.querySelector('figure');
      const entries = [
        ['tag', slide.querySelector('figcaption')],
        ['cardTitle', slide.querySelector('[data-passion-card] > span:nth-child(1)')],
        ['cardSub', slide.querySelector('[data-passion-card] > span:nth-child(2)')],
        ['headline', slide.querySelector('[data-passion-headline]')],
        ['credits', slide.querySelector('[data-passion-credits]')],
        ['highlight', slide.querySelector('[data-passion-highlight]')],
      ];
      const lines = entries.filter(([, el]) => visible(el)).map(([name, el]) => {
        let plate = el;
        let bg = parse(getComputedStyle(plate).backgroundColor);
        while ((!bg || bg.a < 1) && plate !== figure) {
          plate = plate.parentElement;
          bg = parse(getComputedStyle(plate).backgroundColor);
        }
        let opacity = 1;
        for (let n = el; n && n !== figure.parentElement; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity);
        const fg = parse(getComputedStyle(el).color);
        const l1 = lum(fg);
        const l2 = lum(bg);
        const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const target = name === 'cardTitle' || name === 'cardSub' ? plate : el;
        let x = 0;
        let y = 0;
        for (let n = target; n && n !== figure; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
        const box = { left: x, top: y, right: x + target.offsetWidth, bottom: y + target.offsetHeight };
        return {
          name, plateOpaque: plate !== figure && bg.a === 1 && opacity >= 0.99, contrast,
          box,
          inside: box.left >= -1 && box.right <= figure.offsetWidth + 1 && box.top >= -1 && box.bottom <= figure.offsetHeight + 1,
          overflows: el.scrollWidth > el.clientWidth + 1,
        };
      });
      return { index: index + 1, lines };
    });
  });

test('C9: every frame text line sits on an opaque plate with contrast at least 4.5:1', async () => {
  for (const [width, minLines] of [[375, 3], [1440, 6]]) {
    const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce', viewport: { width, height: 900 } });
    try {
      for (const locale of ['pt-br', 'en']) {
        if (locale === 'en') await toggleLocale(page);
        for (const frame of await auditFrames(page)) {
          assert.equal(frame.lines.length, minLines, `frame ${frame.index} (${locale}, ${width}px) shows ${frame.lines.length} lines`);
          for (const line of frame.lines) {
            assert.equal(line.plateOpaque, true, `frame ${frame.index} ${line.name} (${locale}, ${width}px) has no opaque plate`);
            assert.ok(line.contrast >= 4.5, `frame ${frame.index} ${line.name} (${locale}, ${width}px) contrast ${line.contrast.toFixed(2)}`);
          }
        }
      }
    } finally {
      await context.close();
    }
  }
});

test('C10: frame text boxes do not overlap at 320, 375, 768 and 1440px', async () => {
  for (const width of [320, 375, 768, 1440]) {
    const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce', viewport: { width, height: 900 } });
    try {
      for (const locale of ['pt-br', 'en']) {
        if (locale === 'en') await toggleLocale(page);
        for (const frame of await auditFrames(page)) {
          const lines = frame.lines;
          for (let i = 0; i < lines.length; i++) {
            for (let j = i + 1; j < lines.length; j++) {
              if (lines[i].name.startsWith('card') && lines[j].name.startsWith('card')) continue;
              const a = lines[i].box;
              const b = lines[j].box;
              const overlap = a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
              assert.equal(overlap, false, `${width}px ${locale} frame ${frame.index}: ${lines[i].name} overlaps ${lines[j].name}`);
            }
          }
        }
      }
    } finally {
      await context.close();
    }
  }
});

test('C11: credits and side card hide at 640px or less while tag, headline and highlight stay', async () => {
  for (const [width, expectHidden] of [[320, true], [375, true], [640, true], [641, false], [1440, false]]) {
    const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce', viewport: { width, height: 900 } });
    try {
      const state = await page.locator('[data-passion-slide]').evaluateAll((slides) =>
        slides.map((s) => {
          const shown = (sel) => s.querySelector(sel).getClientRects().length > 0 && getComputedStyle(s.querySelector(sel)).display !== 'none';
          return { credits: shown('[data-passion-credits]'), card: shown('[data-passion-card]'), tag: shown('figcaption'), headline: shown('[data-passion-headline]'), highlight: shown('[data-passion-highlight]') };
        }),
      );
      for (const s of state) {
        assert.equal(s.credits, !expectHidden, `${width}px credits visibility`);
        assert.equal(s.card, !expectHidden, `${width}px card visibility`);
        assert.deepEqual([s.tag, s.headline, s.highlight], [true, true, true], `${width}px tag, headline and highlight must stay`);
      }
    } finally {
      await context.close();
    }
  }
});

test('C12: reel keeps six frames with inverted tilt and parallax', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    assert.equal(await page.locator('[data-passion-slide]').count(), 6);
    const tilt = await page.locator('[data-film-wrapper-reverse]').evaluate((el) => {
      const cs = getComputedStyle(el);
      const m = new DOMMatrixReadOnly(cs.transform === 'none' ? undefined : cs.transform);
      const rotateProp = cs.rotate && cs.rotate !== 'none' ? parseFloat(cs.rotate) : 0;
      return Math.atan2(m.b, m.a) * 180 / Math.PI + rotateProp;
    });
    assert.ok(tilt < -1.5 && tilt > -3.5, `expected an inverted tilt near -2.5deg, got ${tilt}`);
    const xOf = (sel) => page.locator(sel).evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
    const sample = async () => ({ forward: await xOf('[data-filmstrip-parallax]'), reverse: await xOf('[data-filmstrip-parallax-reverse]') });
    const scrollInSection = async (fraction) => {
      await page.evaluate((f) => {
        const sec = document.querySelector('[data-filmstrip-section]');
        const top = sec.getBoundingClientRect().top + scrollY;
        window.scrollTo(0, top - innerHeight + (innerHeight + sec.offsetHeight) * f);
      }, fraction);
      await page.waitForTimeout(1100);
    };
    await scrollInSection(0.25);
    const first = await sample();
    await scrollInSection(0.75);
    const second = await sample();
    const dForward = second.forward - first.forward;
    const dReverse = second.reverse - first.reverse;
    assert.ok(Math.abs(dReverse) > 20, `the passion reel must move with scroll, moved ${dReverse}px`);
    assert.ok(Math.abs(dForward) > 20, `the first reel must move with scroll, moved ${dForward}px`);
    assert.ok(Math.sign(dForward) !== Math.sign(dReverse), `the passion reel must run opposite to the first reel (${dForward} vs ${dReverse})`);
  } finally {
    await context.close();
  }
});

test('C13: zero horizontal overflow at 320, 375, 768 and 1440px in pt-br and en', async () => {
  for (const locale of ['pt-br', 'en']) {
    for (const width of [320, 375, 768, 1440]) {
      const { context, page } = await openHome(locale, { reducedMotion: 'reduce', viewport: { width, height: 900 } });
      try {
        const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth }));
        assert.ok(m.sw <= m.cw && m.bw <= m.cw, `Overflow at ${width}px (${locale}): ${m.sw}/${m.bw} > ${m.cw}`);
      } finally {
        await context.close();
      }
    }
  }
});

test('C15: long headlines wrap inside their plate', async () => {
  for (const width of [320, 1440]) {
    const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce', viewport: { width, height: 900 } });
    try {
      await toggleLocale(page);
      for (const frame of await auditFrames(page)) {
        const headline = frame.lines.find((l) => l.name === 'headline');
        assert.equal(headline.inside, true, `${width}px frame ${frame.index} headline leaves the frame`);
        assert.equal(headline.overflows, false, `${width}px frame ${frame.index} headline overflows its plate`);
      }
    } finally {
      await context.close();
    }
  }
});

test('C16: failed background keeps the solid color and legible text', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await page.route('**/assets/filmstrip/passion-bg-*.svg', (route) => route.abort());
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await dismissIntroIfPresent(page);
    const solid = await page.locator('[data-passion-slide] [data-passion-bg]').evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    assert.equal(solid.length, 6);
    assert.deepEqual(solid, ['rgb(254, 0, 0)', 'rgb(8, 8, 8)', 'rgb(254, 0, 0)', 'rgb(8, 8, 8)', 'rgb(254, 0, 0)', 'rgb(8, 8, 8)'], 'each frame keeps its own solid color');
    const broken = await page.locator('[data-passion-slide] img').evaluateAll((els) => els.filter((el) => el.complete && el.naturalWidth === 0).length);
    assert.equal(broken, 6, 'precondition: all backgrounds failed');
    for (const frame of await auditFrames(page)) {
      assert.equal(frame.lines.length, 6, `frame ${frame.index} must still show all its text`);
      for (const line of frame.lines) assert.ok(line.plateOpaque && line.contrast >= 4.5, `frame ${frame.index} ${line.name} lost legibility`);
    }
  } finally {
    await context.close();
  }
});
