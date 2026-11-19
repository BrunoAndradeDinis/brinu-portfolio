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

const { getLocalizedHobbies } = await import('../src/data/hobbies.ts');
const PT = getLocalizedHobbies('pt-br');
const EN = getLocalizedHobbies('en');

async function openHome({ viewport = { width: 1440, height: 900 }, locale, ...contextOptions } = {}) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  if (locale) await context.addInitScript((value) => window.localStorage.setItem('brinu_locale', value), locale);
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const intro = document.getElementById('intro-preloader');
    if (intro) {
      intro.click();
      intro.remove();
    }
    window.dispatchEvent(new CustomEvent('intro-complete'));
  });
  await page.locator('[data-hobbies]').scrollIntoViewIfNeeded();
  return { context, page };
}

const card = (page, id) => page.locator(`[data-hobby-card="${id}"]`);
const panel = (page) => page.locator('[data-hobby-panel]');
const panelOpen = (page) => panel(page).evaluate((node) => node.open);
const waitClosed = (page) => page.waitForFunction(() => !document.querySelector('[data-hobby-panel]').open, null, { timeout: 2000 });

test('the dossier shows six hobby cards under the portrait', async () => {
  const { context, page } = await openHome();
  try {
    const names = await page.locator('#about [data-hobby-card] [data-hobby-card-name]').allTextContents();
    assert.deepEqual(names, PT.map((hobby) => hobby.name));
    for (const [index, hobby] of PT.entries()) {
      const card = page.locator('#about [data-hobby-card]').nth(index);
      assert.equal(await card.locator('[data-hobby-rating]').textContent(), String(hobby.rating), `${hobby.id} rating`);
      assert.equal(await card.locator('[data-hobby-position]').textContent(), hobby.position.code, `${hobby.id} position`);
      const stats = await card.locator('.hobby-card-stat').allInnerTexts();
      assert.deepEqual(stats.map((text) => text.replace(/\s+/g, ' ').trim()), hobby.stats.map((entry) => `${entry.value} ${entry.code}`), `${hobby.id} six stats`);
    }
    const columns = async () => page.evaluate(() => new Set([...document.querySelectorAll('[data-hobby-item]')].map((item) => Math.round(item.getBoundingClientRect().left))).size);
    assert.equal(await columns(), 3, 'three cards per row on desktop');
    assert.equal(await page.locator('#about [data-hobby-card]').first().getAttribute('aria-haspopup'), 'dialog');
    assert.equal(await page.evaluate(() => document.querySelector('[data-hobby-card="animes"]').getAttribute('aria-labelledby').split(' ').map((id) => document.getElementById(id).textContent).join(' ')), '96 ANIMES');
    const icons = await page.locator('#about [data-hobby-card] img').evaluateAll((nodes) => nodes.map((node) => new URL(node.src).pathname));
    assert.deepEqual(icons, PT.map((hobby) => hobby.sticker));
    const layout = await page.evaluate(() => {
      const portrait = document.querySelector('[data-about-portrait]').getBoundingClientRect();
      const list = document.querySelector('[data-hobby-list]').getBoundingClientRect();
      return { below: list.top >= portrait.bottom, sameColumn: !!document.querySelector('[data-about-avatar-panel] [data-hobby-list]') };
    });
    assert.equal(layout.below, true, 'the badges sit below the portrait card');
    assert.equal(layout.sameColumn, true, 'the badges live in the portrait column');
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileOrder = await page.evaluate(() => {
      const career = document.querySelector('[data-about-card="career"]').getBoundingClientRect();
      const hobbies = document.querySelector('[data-hobbies]').getBoundingClientRect();
      return hobbies.top >= career.bottom - 1;
    });
    assert.equal(mobileOrder, true, 'on mobile viewports hobbies appear after the career trajectory');
    await page.setViewportSize({ width: 1440, height: 900 });
    assert.equal(await page.locator('#hobbies').count(), 0, 'the fighter-select section is gone');
    const order = await page.$$eval('main > section[id]', (sections) => sections.map((section) => section.id));
    assert.equal(order[order.indexOf('about') + 1], 'arsenal');
    await page.locator('#about [data-hobby-card]').first().focus();
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-hobby-card')), 'animes');
  } finally {
    await context.close();
  }
});

test('a card opens the side panel from the right', async () => {
  for (const key of ['click', 'Enter', ' ']) {
    const { context, page } = await openHome();
    try {
      if (key === 'click') await card(page, 'musica').click();
      else {
        await card(page, 'musica').focus();
        await page.keyboard.press(key === ' ' ? 'Space' : key);
      }
      await page.waitForTimeout(650);
      assert.equal(await panelOpen(page), true, `${key} opens the panel`);
      assert.equal(await panel(page).locator('[data-hobby-panel-title]').textContent(), PT[1].name);
      assert.equal(await panel(page).locator('[data-hobby-panel-text]').textContent(), PT[1].text);
      assert.equal(new URL(await panel(page).locator('[data-hobby-panel-sticker]').evaluate((img) => img.src)).pathname, PT[1].sticker);
      assert.equal(await panel(page).locator('[data-hobby-panel-rating]').textContent(), '94');
      assert.equal(await panel(page).locator('[data-hobby-panel-position]').textContent(), 'OUV · Ouvinte');
      const rows = await panel(page).locator('[data-hobby-panel-stats] li').allTextContents();
      assert.deepEqual(rows, PT[1].stats.map((entry) => `${entry.value}${entry.code}${entry.label}`), 'the panel lists the six stats with their full names');
      const geometry = await page.evaluate(() => {
        const box = document.querySelector('[data-hobby-panel]').getBoundingClientRect();
        const close = document.querySelector('[data-hobby-panel] [data-panel-close]').getBoundingClientRect();
        return { right: Math.round(box.right), width: Math.min(document.documentElement.clientWidth, document.body.clientWidth), closeTop: close.top - box.top, closeRight: box.right - close.right, closeLeftHalf: close.left > box.left + box.width / 2 };
      });
      assert.ok(geometry.right >= geometry.width - 1, `the panel is docked to the right edge (${geometry.right} of ${geometry.width})`);
      assert.ok(geometry.closeTop < 40 && geometry.closeRight < 40 && geometry.closeLeftHalf, 'the X sits in the top-right corner');
      assert.equal(await page.locator('[data-hobby-panel] [data-panel-close]').getAttribute('aria-label'), 'Fechar');
      assert.equal(await page.evaluate(() => !!document.activeElement?.closest('[data-hobby-panel]')), true, 'focus moves into the panel');
    } finally {
      await context.close();
    }
  }
});

test('the x, escape and a click outside close the panel', async () => {
  const { context, page } = await openHome();
  try {
    const opener = () => page.evaluate(() => document.activeElement?.getAttribute('data-hobby-card'));
    await card(page, 'skate').click();
    await page.waitForTimeout(650);
    await page.locator('[data-hobby-panel] [data-panel-close]').click();
    await waitClosed(page);
    assert.equal(await opener(), 'skate', 'X returns focus to the card');

    await card(page, 'natureza').click();
    await page.waitForTimeout(650);
    await page.keyboard.press('Escape');
    await waitClosed(page);
    assert.equal(await opener(), 'natureza', 'Escape returns focus to the card');

    await card(page, 'jogos').click();
    await page.waitForTimeout(650);
    await page.locator('[data-hobby-panel-text]').click();
    await page.waitForTimeout(300);
    assert.equal(await panelOpen(page), true, 'a click inside keeps the panel open');
    await page.mouse.click(40, 450);
    await waitClosed(page);
    assert.equal(await opener(), 'jogos', 'an outside click returns focus to the card');
  } finally {
    await context.close();
  }
});

test('reduced motion opens the panel without a slide', async () => {
  const { context, page } = await openHome({ reducedMotion: 'reduce' });
  try {
    await card(page, 'animes').click();
    assert.equal(await panelOpen(page), true);
    const state = await page.evaluate(() => ({
      transform: getComputedStyle(document.querySelector('[data-hobby-panel]')).transform,
      blur: getComputedStyle(document.querySelector('[data-hobby-list]')).filter,
    }));
    assert.ok(state.transform === 'none' || state.transform === 'matrix(1, 0, 0, 1, 0, 0)', `no slide (${state.transform})`);
    assert.equal(state.blur, 'none');
    await page.keyboard.press('Escape');
    assert.equal(await panelOpen(page), false, 'closes at once');
  } finally {
    await context.close();
  }
});

test('switching language re-renders cards and the panel', async () => {
  const { context, page } = await openHome({ reducedMotion: 'reduce' });
  try {
    await card(page, 'violao').click();
    await page.evaluate(() => {
      document.querySelector('[data-hobby-panel]').close();
      document.querySelector('[data-lang-toggle]').click();
    });
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    assert.deepEqual(await page.locator('[data-hobby-card-name]').allTextContents(), EN.map((hobby) => hobby.name));
    await card(page, 'violao').click();
    assert.equal(await panel(page).locator('[data-hobby-panel-title]').textContent(), EN[2].name);
    assert.equal(await panel(page).locator('[data-hobby-panel-text]').textContent(), EN[2].text);
    assert.equal(await page.locator('[data-hobby-panel] [data-panel-close]').getAttribute('aria-label'), 'Close');
    assert.equal(await panel(page).locator('[data-hobby-panel-position]').textContent(), 'LUA · Luau');
    assert.deepEqual(await panel(page).locator('[data-hobby-panel-stats] li span:first-of-type').allTextContents(), EN[2].stats.map((entry) => entry.code));
    assert.deepEqual(await page.locator('[data-hobby-card="natureza"] [data-hobby-stat-code]').allTextContents(), EN[5].stats.map((entry) => entry.code));
    assert.equal(await page.locator('[data-hobby-card="musica"] [data-hobby-position]').textContent(), 'LIS');
  } finally {
    await context.close();
  }
  const stored = await openHome({ locale: 'en', reducedMotion: 'reduce' });
  try {
    assert.deepEqual(await stored.page.locator('[data-hobby-card-name]').allTextContents(), EN.map((hobby) => hobby.name));
  } finally {
    await stored.context.close();
  }
});

test('career and education show the approved entries', async () => {
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openHome({ locale, reducedMotion: 'reduce' });
    try {
      const career = await page.locator('#about [data-career-entry]').evaluateAll((items) => items.map((item) => item.id));
      assert.deepEqual(career, ['career-magalu-cloud', 'career-luizalabs']);
      assert.doesNotMatch(await page.locator('#about').innerText(), /SAC|Customer Service|Magazine Luiza/i);
      const ranks = await page.locator('#about [data-career-rank]').allInnerTexts();
      assert.deepEqual(ranks.map((rank) => rank.replace(/\s+/g, ' ').trim()), ['RANK 2', 'RANK 1']);
      const education = await page.locator('#about [data-education-entry]').evaluateAll((items) => items.map((item) => item.id));
      assert.deepEqual(education, ['education-ebac', 'education-ampli', 'education-full-stack-club', 'education-alura']);
      const ampli = await page.locator('#education-ampli').innerText();
      assert.match(ampli.toUpperCase(), /AMPLI - ANHANGUERA/);
      const alura = await page.locator('#education-alura').innerText();
      assert.match(alura.toUpperCase(), locale === 'en' ? /COMPLETED/ : /CONCLUÍDO/);
      assert.doesNotMatch(alura.toLowerCase(), /atual|present/, 'Alura has no running end');
      assert.equal((await page.locator('#education-alura [data-education-period]').innerText()).trim().toLowerCase(), locale === 'en' ? 'may 2022' : 'mai/2022');
    } finally {
      await context.close();
    }
  }
});

test('cards and panel never widen the page and meet aa contrast', async () => {
  for (const locale of ['pt-br', 'en']) {
    for (const width of [320, 390, 768, 1024, 1440, 2560]) {
      const { context, page } = await openHome({ viewport: { width, height: 900 }, locale, reducedMotion: 'reduce' });
      try {
        const audit = () =>
          page.evaluate(() => {
            const parse = (value) => value.match(/[\d.]+/g).map(Number);
            const channel = (c) => {
              const s = c / 255;
              return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
            };
            const lum = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
            const plate = (node) => {
              for (let el = node; el; el = el.parentElement) {
                const bg = parse(getComputedStyle(el).backgroundColor);
                if (bg.length < 4 || bg[3] > 0.99) return bg.slice(0, 3);
              }
              return [8, 8, 8];
            };
            const failures = [];
            const clipped = [];
            for (const el of document.querySelectorAll('[data-hobbies] h3:not([data-hobby-panel-title]), [data-hobby-card-name], [data-hobby-rating], [data-hobby-position], .hobby-card-stat, [data-hobby-panel] h3, [data-hobby-panel] li, [data-hobby-panel] p')) {
              if (el.getClientRects().length === 0 || !el.textContent.trim()) continue;
              const style = getComputedStyle(el);
              const fg = lum(parse(style.color));
              const bg = lum(plate(el));
              const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
              if (ratio < (parseFloat(style.fontSize) >= 24 ? 3 : 4.5)) failures.push(`${el.textContent.slice(0, 20)} ${ratio.toFixed(2)}`);
              const rect = el.getBoundingClientRect();
              if (el.scrollWidth > el.clientWidth + 1 || rect.right > document.documentElement.clientWidth + 1) clipped.push(el.textContent.slice(0, 20));
            }
            return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, failures, clipped };
          });
        const closed = await audit();
        const columns = await page.evaluate(() => new Set([...document.querySelectorAll('[data-hobby-item]')].map((item) => Math.round(item.getBoundingClientRect().left))).size);
        assert.equal(columns, width < 640 ? 2 : 3, `${width}px cards per row`);
        const overlap = await page.evaluate(() => {
          const boxes = [...document.querySelectorAll('[data-hobby-item]')].map((item) => item.getBoundingClientRect());
          return boxes.some((a, i) => boxes.some((b, j) => i < j && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1));
        });
        assert.equal(overlap, false, `${width}px cards never overlap`);
        assert.ok(closed.overflow <= 0, `${locale} ${width}px overflow ${closed.overflow}`);
        assert.deepEqual(closed.failures, [], `${locale} ${width}px card contrast`);
        assert.deepEqual(closed.clipped, [], `${locale} ${width}px card text fits`);
        await card(page, 'musica').click();
        const open = await audit();
        assert.deepEqual(open.failures, [], `${locale} ${width}px panel contrast`);
        assert.deepEqual(open.clipped, [], `${locale} ${width}px panel text fits`);
      } finally {
        await context.close();
      }
    }
  }
});
