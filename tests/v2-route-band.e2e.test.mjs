import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
};
let server;
let baseUrl = '';
let browser;

before(async () => {
  const distDir = path.resolve('dist');
  server = http.createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url || '/', 'http://127.0.0.1').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    else if (!path.extname(pathname)) pathname += '/index.html';
    let filePath = path.join(distDir, pathname);
    let status = 200;
    if (!filePath.startsWith(distDir) || !fs.existsSync(filePath)) {
      filePath = path.join(distDir, '404.html');
      status = 404;
    }
    res.writeHead(status, { 'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
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

async function open(route, { viewport = { width: 1440, height: 900 }, locale, ...contextOptions } = {}) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  if (locale) await context.addInitScript((value) => window.localStorage.setItem('brinu_locale', value), locale);
  const page = await context.newPage();
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  if (contextOptions.javaScriptEnabled !== false) {
    await page.evaluate(() => {
      const intro = document.getElementById('intro-preloader');
      if (intro) {
        intro.click();
        intro.remove();
      }
      window.dispatchEvent(new CustomEvent('intro-complete'));
    });
  }
  return { context, page };
}

const watchBand = (page) =>
  page.evaluate(() => {
    const record = { phases: [], names: [], labels: 0, coveredAtSwap: null, swaps: 0 };
    window.__band = record;
    const watch = () => {
      const band = document.getElementById('route-band');
      new MutationObserver(() => {
        const phase = band.className.match(/is-(in|covered|out)/)?.[1];
        if (phase && record.phases.at(-1) !== phase) record.phases.push(phase);
        if (phase) {
          record.names.push(band.querySelector('[data-route-band-name]').textContent);
          record.labels = Math.max(record.labels, band.querySelectorAll('.t').length);
        }
      }).observe(band, { attributes: true, attributeFilter: ['class'] });
    };
    watch();
    document.addEventListener('astro:after-swap', () => {
      record.swaps += 1;
      const band = document.getElementById('route-band');
      const style = getComputedStyle(band.querySelector('.r'));
      record.coveredAtSwap = band.classList.contains('is-covered') && getComputedStyle(band).display === 'block' && style.clipPath.includes('120%');
      if (band.classList.contains('is-covered')) record.phases.push('covered');
      watch();
    });
  });

const follow = (page, href) =>
  page.evaluate((target) => {
    const link = document.createElement('a');
    link.href = target;
    link.textContent = target;
    document.body.append(link);
    link.click();
  }, href);

const bandState = (page) =>
  page.evaluate(() => {
    const band = document.getElementById('route-band');
    return { className: band.className, display: getComputedStyle(band).display, name: band.querySelector('[data-route-band-name]').textContent };
  });

const bandGone = (page) =>
  page.waitForFunction(() => !/is-(in|covered|out)/.test(document.getElementById('route-band').className), null, { timeout: 2500 });

test('following a link sweeps the band over the swap', async () => {
  const { context, page } = await open('/');
  try {
    await watchBand(page);
    const started = Date.now();
    await follow(page, '/stickers');
    await page.waitForTimeout(200);
    const early = await bandState(page);
    assert.match(early.className, /is-in/, 'the band sweeps in before the swap');
    assert.equal(early.name, 'STICKERS');
    await page.waitForFunction(() => location.pathname === '/stickers' && window.__band.swaps === 1);
    await bandGone(page);
    const record = await page.evaluate(() => window.__band);
    assert.deepEqual(record.phases, ['in', 'covered', 'out'], 'cover, swap while covered, exit');
    assert.equal(record.coveredAtSwap, true, 'the new page was swapped in under the red band');
    assert.ok(Date.now() - started < 2600, 'the band is gone shortly after 1.25 s');
    assert.equal(record.labels, 0, 'the page band shows only the title, no label above it');
    assert.equal(await page.evaluate(() => /VOCÊ ESCOLHEU|YOU CHOSE/.test(document.getElementById('route-band').textContent)), false);
  } finally {
    await context.close();
  }
});

test('every destination and the back button name the page', async () => {
  const { context, page } = await open('/');
  try {
    const trips = [
      ['/cases/magalu-cloud', 'CASES'],
      ['/stickers', 'STICKERS'],
      ['/cases/aurastream', 'CASES'],
      ['/nada-aqui', '404'],
      ['/', 'INÍCIO'],
    ];
    for (const [href, title] of trips) {
      await watchBand(page);
      await follow(page, href);
      await page.waitForFunction((target) => location.pathname === target && window.__band.swaps === 1, href);
      await bandGone(page);
      const record = await page.evaluate(() => window.__band);
      assert.deepEqual(record.phases, ['in', 'covered', 'out'], `${href} plays the band`);
      assert.ok(record.names.length > 0 && record.names.every((name) => name === title), `${href} names ${title}: ${record.names}`);
    }
    assert.equal(await page.evaluate(() => document.querySelector('[data-not-found]') === null), true, 'the home is back');

    await watchBand(page);
    await page.goBack();
    await page.waitForFunction(() => location.pathname === '/nada-aqui' && window.__band.swaps === 1);
    await bandGone(page);
    const back = await page.evaluate(() => window.__band);
    assert.deepEqual(back.phases, ['in', 'covered', 'out'], 'going back plays the band');
    assert.ok(back.names.every((name) => name === '404'), `back names 404: ${back.names}`);
    assert.equal(await page.locator('[data-not-found]').count(), 1, 'the 404 page is shown');
  } finally {
    await context.close();
  }
});

test('the band speaks english after the switch', async () => {
  const { context, page } = await open('/stickers', { locale: 'en' });
  try {
    await bandGone(page);
    await watchBand(page);
    await follow(page, '/');
    await page.waitForFunction(() => location.pathname === '/' && window.__band.swaps === 1);
    await bandGone(page);
    const record = await page.evaluate(() => window.__band);
    assert.ok(record.names.every((name) => name === 'HOME'), `english home title: ${record.names}`);
    assert.equal(record.labels, 0, 'no label in english either');
  } finally {
    await context.close();
  }
});

test('reduced motion changes pages with no band', async () => {
  const { context, page } = await open('/', { reducedMotion: 'reduce' });
  try {
    await watchBand(page);
    await follow(page, '/cases/uriana');
    await page.waitForFunction(() => location.pathname === '/cases/uriana' && window.__band.swaps === 1);
    await page.waitForTimeout(300);
    const record = await page.evaluate(() => window.__band);
    assert.deepEqual(record.phases, [], 'no band phase ran');
    assert.equal((await bandState(page)).display, 'none');
  } finally {
    await context.close();
  }
  const direct = await open('/stickers', { reducedMotion: 'reduce' });
  try {
    assert.equal((await bandState(direct.page)).display, 'none', 'no band on a direct load either');
  } finally {
    await direct.context.close();
  }
});

test('a same-page hash link plays no band', async () => {
  const { context, page } = await open('/');
  try {
    await watchBand(page);
    await follow(page, '/#contact');
    await page.waitForFunction(() => location.hash === '#contact');
    await page.waitForTimeout(400);
    assert.deepEqual(await page.evaluate(() => window.__band.phases), []);
  } finally {
    await context.close();
  }
});

test('opening a page directly plays only the exit', async () => {
  for (const [route, title] of [['/stickers', 'STICKERS'], ['/cases/uriana', 'CASES'], ['/nada-aqui', '404']]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
    const page = await context.newPage();
    try {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'commit' });
      await page.waitForSelector('#route-band', { state: 'attached' });
      const first = await bandState(page);
      assert.match(first.className, /is-out/, `${route} opens with the exit half`);
      assert.doesNotMatch(first.className, /is-in/, `${route} has no cover half`);
      assert.equal(first.name, title);
      await bandGone(page);
      assert.equal((await bandState(page)).display, 'none', `${route} band leaves`);
    } finally {
      await context.close();
    }
  }
  const english = await browser.newContext({ viewport: { width: 390, height: 800 } });
  try {
    await english.addInitScript(() => window.localStorage.setItem('brinu_locale', 'en'));
    const page = await english.newPage();
    await page.goto(`${baseUrl}/`, { waitUntil: 'commit' });
    await page.waitForSelector('#route-band', { state: 'attached' });
    assert.doesNotMatch((await bandState(page)).className, /is-(in|covered|out)/, 'the home opens without the band');
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await page.goto(`${baseUrl}/cases/efood`, { waitUntil: 'commit' });
    await page.waitForSelector('#route-band', { state: 'attached' });
    assert.equal((await bandState(page)).name, 'CASES');
  } finally {
    await english.close();
  }
  const noScript = await open('/stickers', { javaScriptEnabled: false });
  try {
    assert.equal((await bandState(noScript.page)).display, 'none', 'no JavaScript, no band');
  } finally {
    await noScript.context.close();
  }
});

test('the band never locks scroll or widens the page', async () => {
  for (const width of [320, 768, 2560]) {
    const { context, page } = await open('/', { viewport: { width, height: 900 } });
    try {
      assert.equal(await page.locator('#route-band').getAttribute('aria-hidden'), 'true');
      await follow(page, '/cases/magalu-cloud');
      await page.waitForTimeout(450);
      const mid = await page.evaluate(() => {
        const band = document.getElementById('route-band');
        const name = band.querySelector('[data-route-band-name]');
        return {
          pointer: getComputedStyle(band).pointerEvents,
          nameFits: name.scrollWidth <= name.clientWidth + 1,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      assert.equal(mid.pointer, 'none', `${width}px band takes no pointer input`);
      assert.equal(mid.nameFits, true, `${width}px CASES fits the band`);
      assert.ok(mid.overflow <= 0, `${width}px no horizontal overflow (${mid.overflow})`);
      await follow(page, '/stickers');
      await page.waitForFunction(() => location.pathname === '/stickers');
      await bandGone(page);
      const after = await page.evaluate(async () => {
        window.scrollTo(0, 400);
        await new Promise((resolve) => setTimeout(resolve, 200));
        return {
          locked: document.documentElement.classList.contains('lenis-stopped'),
          scrollY: window.scrollY,
          focusInBand: !!document.activeElement?.closest('#route-band'),
        };
      });
      assert.equal(after.locked, false, `${width}px scroll unlocked`);
      assert.ok(after.scrollY > 0, `${width}px the page scrolls`);
      assert.equal(after.focusInBand, false);
    } finally {
      await context.close();
    }
  }
});
