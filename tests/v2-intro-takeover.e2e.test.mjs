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
