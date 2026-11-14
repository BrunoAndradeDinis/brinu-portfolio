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

const { ptBrDict, enDict } = await import('../src/i18n/dictionaries.ts');
const COPY = { 'pt-br': ptBrDict.notFound, en: enDict.notFound };

async function openNotFound({ locale = 'pt-br', viewport = { width: 1440, height: 900 }, ...contextOptions } = {}) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  await context.addInitScript((value) => window.localStorage.setItem('brinu_locale', value), locale);
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/404.html`, { waitUntil: 'networkidle' });
  return { context, page, response };
}

// Reads the drawn sky: bright pixels, their centroid, and connected bright shapes longer than any star.
const readSky = (page) =>
  page.evaluate(() => {
    const canvas = document.querySelector('[data-not-found-sky]');
    const context = canvas.getContext('2d');
    const { width, height } = canvas;
    const data = context.getImageData(0, 0, width, height).data;
    const ratio = width / canvas.clientWidth;
    const bright = new Uint8Array(width * height);
    let count = 0;
    let sumX = 0;
    let red = 0;
    let checksum = 0;
    for (let index = 0; index < width * height; index += 1) {
      const r = data[index * 4];
      const g = data[index * 4 + 1];
      const b = data[index * 4 + 2];
      const a = data[index * 4 + 3];
      checksum = (checksum + r * 3 + g * 5 + b * 7 + a * 11 + index) % 2147483647;
      if (a > 60 && (r + g + b) / 3 > 40) {
        bright[index] = 1;
        count += 1;
        sumX += index % width;
      }
      if (a > 60 && r > 150 && g < 60 && b < 60) red += 1;
    }
    const seen = new Uint8Array(width * height);
    let longest = 0;
    const blobs = [];
    const members = [];
    const stack = [];
    for (let start = 0; start < width * height; start += 1) {
      if (!bright[start] || seen[start]) continue;
      let minX = width, maxX = 0, minY = height, maxY = 0;
      members.length = 0;
      stack.push(start);
      seen[start] = 1;
      while (stack.length) {
        const at = stack.pop();
        const x = at % width;
        const y = (at - x) / width;
        members.push(x, y);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        for (const next of [at - 1, at + 1, at - width, at + width, at - width - 1, at - width + 1, at + width - 1, at + width + 1]) {
          if (next >= 0 && next < width * height && bright[next] && !seen[next] && Math.abs((next % width) - x) <= 1) {
            seen[next] = 1;
            stack.push(next);
          }
        }
      }
      const span = Math.hypot(maxX - minX, maxY - minY) / ratio;
      longest = Math.max(longest, span);
      if (span <= 12 && members.length >= 8) {
        let cx = 0;
        let cy = 0;
        for (let index = 0; index < members.length; index += 2) {
          cx += members[index];
          cy += members[index + 1];
        }
        const pixels = members.length / 2;
        blobs.push({ x: cx / pixels / ratio, y: cy / pixels / ratio, pixels });
      }
    }
    return { count, red, blobs, longest, checksum, state: canvas.dataset.skyReady };
  });

test('the 404 keeps its copy and link in both locales', async () => {
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openNotFound({ locale });
    try {
      const copy = await page.evaluate(() => ({
        actTag: document.querySelector('[data-i18n="notFound.actTag"]').textContent.trim(),
        title: document.querySelector('h1').textContent.trim(),
        hint: document.querySelector('[data-i18n="notFound.hint"]').textContent.trim(),
        back: document.querySelector('[data-not-found-home]').textContent.trim(),
        href: document.querySelector('[data-not-found-home]').getAttribute('href'),
      }));
      assert.deepEqual(copy, { actTag: COPY[locale].actTag, title: COPY[locale].title, hint: COPY[locale].hint, back: COPY[locale].back, href: '/' }, `${locale}: the prototype's copy`);
    } finally {
      await context.close();
    }
  }
});

test('a breathing star sky is drawn behind the copy', async () => {
  const { context, page } = await openNotFound();
  try {
    await page.waitForFunction(() => document.querySelector('[data-not-found-sky]')?.dataset.skyReady === 'moving');
    await page.waitForTimeout(600);
    const first = await readSky(page);
    await page.waitForTimeout(700);
    const second = await readSky(page);
    assert.ok(first.count > 400, `stars are drawn (${first.count} bright pixels)`);
    assert.ok(first.red > 0, 'some stars are red');
    assert.notEqual(first.checksum, second.checksum, 'the sky moves from frame to frame');
    const layering = await page.evaluate(() => {
      const canvas = document.querySelector('[data-not-found-sky]');
      const main = document.getElementById('main-content');
      const title = main.querySelector('h1').getBoundingClientRect();
      const top = document.elementFromPoint(title.left + 20, title.top + title.height / 2);
      return { hidden: canvas.getAttribute('aria-hidden'), copyOnTop: main.contains(top), pointerEvents: getComputedStyle(canvas).pointerEvents };
    });
    assert.deepEqual(layering, { hidden: 'true', copyOnTop: true, pointerEvents: 'none' }, 'the sky is decorative and sits behind the copy');
  } finally {
    await context.close();
  }
});

test('shooting stars streak across the sky', async () => {
  const { context, page } = await openNotFound();
  try {
    await page.waitForFunction(() => document.querySelector('[data-not-found-sky]')?.dataset.skyReady === 'moving');
    let longest = 0;
    for (let sample = 0; sample < 8 && longest <= 40; sample += 1) {
      await page.waitForTimeout(500);
      longest = Math.max(longest, (await readSky(page)).longest);
    }
    assert.ok(longest > 40, `a streak longer than any star is drawn (${Math.round(longest)} px)`);
  } finally {
    await context.close();
  }
});

test('the sky drifts with the pointer', async () => {
  const { context, page } = await openNotFound();
  try {
    await page.waitForFunction(() => document.querySelector('[data-not-found-sky]')?.dataset.skyReady === 'moving');
    await page.mouse.move(10, 450);
    await page.waitForTimeout(3000);
    const left = await readSky(page);
    await page.mouse.move(1430, 450);
    await page.waitForTimeout(3000);
    const right = await readSky(page);
    // The pointer stays on the centre line, so stars keep their row: pair each large star with the nearest one of like size on its row.
    const shifts = [];
    for (const star of left.blobs.filter((blob) => blob.pixels >= 10)) {
      const match = right.blobs
        .filter((blob) => Math.abs(blob.y - star.y) < 1.5 && Math.abs(blob.pixels - star.pixels) <= star.pixels * 0.35 && Math.abs(blob.x - star.x) < 400)
        .sort((a, b) => Math.abs(a.x - star.x) - Math.abs(b.x - star.x))[0];
      if (match) shifts.push(match.x - star.x);
    }
    shifts.sort((a, b) => a - b);
    const median = shifts[Math.floor(shifts.length / 2)];
    assert.ok(shifts.length >= 10, `enough near stars are tracked (${shifts.length})`);
    assert.ok(median < -3, `pointing right drifts the near stars left (median ${median?.toFixed(1)} px)`);
    assert.ok(median > -400, 'the drift stays within the parallax bound');
  } finally {
    await context.close();
  }
});

test('the sign reads SEE YOU GITHUB COWBOY in the bottom-right corner', async () => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const { context, page } = await openNotFound({ viewport });
    try {
      const sign = await page.evaluate(() => {
        const element = document.querySelector('[data-not-found-sign]');
        const root = document.querySelector('[data-not-found]').getBoundingClientRect();
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          text: element.textContent.replace(/\s+/g, ' ').trim(),
          accent: getComputedStyle(element.querySelector('[data-i18n="notFound.seeYouAccent"]')).color,
          colour: style.color,
          font: style.fontFamily,
          weight: style.fontWeight,
          italic: style.fontStyle,
          rightGap: Math.round(root.right - box.right),
          bottomGap: Math.round(root.bottom - box.bottom),
          blink: getComputedStyle(element.querySelector('.not-found-dots')).animationName,
        };
      });
      assert.equal(sign.text, 'SEE YOU GITHUB COWBOY...');
      assert.equal(sign.accent, 'rgb(254, 0, 0)', 'GITHUB is red');
      assert.equal(sign.colour, 'rgb(251, 250, 244)');
      assert.match(sign.font, /Syne/);
      assert.deepEqual([sign.weight, sign.italic], ['800', 'italic']);
      const gap = (share, min, max) => Math.min(max, Math.max(min, viewport.width * share));
      assert.ok(Math.abs(sign.rightGap - gap(0.04, 16, 64)) <= 2, `${viewport.width}px: right gap ${sign.rightGap} is clamp(1rem, 4vw, 4rem)`);
      assert.ok(Math.abs(sign.bottomGap - gap(0.04, 20, 48)) <= 2, `${viewport.width}px: bottom gap ${sign.bottomGap} is clamp(1.25rem, 4vw, 3rem)`);
      assert.notEqual(sign.blink, 'none', 'the dots blink');
    } finally {
      await context.close();
    }
  }
});

test('reduced motion draws the sky once, still', async () => {
  const { context, page } = await openNotFound({ reducedMotion: 'reduce' });
  try {
    await page.waitForFunction(() => document.querySelector('[data-not-found-sky]')?.dataset.skyReady === 'still');
    const first = await readSky(page);
    await page.mouse.move(1400, 100);
    await page.waitForTimeout(1500);
    const second = await readSky(page);
    assert.ok(first.count > 400, 'the still sky has stars');
    assert.equal(second.checksum, first.checksum, 'nothing moves: no twinkle, no shooting star, no parallax');
    assert.ok(first.longest <= 40, 'no shooting star is drawn');
    assert.equal(await page.locator('.not-found-dots').evaluate((dots) => getComputedStyle(dots).animationName), 'none', 'the dots do not blink');
  } finally {
    await context.close();
  }
});

test('the 404 never widens the page, keeps the copy readable and ships no Three.js', async () => {
  for (const width of [320, 768, 1440, 2560]) {
    const { context, page } = await openNotFound({ viewport: { width, height: 900 } });
    try {
      await page.waitForTimeout(500);
      const result = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        three: performance.getEntriesByType('resource').some((entry) => /three/i.test(entry.name)),
        title: getComputedStyle(document.querySelector('h1')).color,
        hint: getComputedStyle(document.querySelector('[data-i18n="notFound.hint"]')).color,
        ground: getComputedStyle(document.querySelector('[data-not-found]')).backgroundColor,
      }));
      assert.ok(result.overflow <= 0, `${width}px: no horizontal overflow`);
      assert.equal(result.three, false, `${width}px: no Three.js is loaded`);
      assert.deepEqual([result.title, result.hint, result.ground], ['rgb(251, 250, 244)', 'rgb(251, 250, 244)', 'rgb(8, 8, 8)'], `${width}px: paper-white copy on the black ground (about 19:1)`);
    } finally {
      await context.close();
    }
  }
});
