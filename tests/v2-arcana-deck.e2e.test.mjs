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




const toggleLocale = async (page) => {
  await page.locator('#nav-lang-toggle-btn').dispatchEvent('click');
  await page.waitForTimeout(500);
};

const CODES = ['ARCANA // EMPRESS', 'ARCANA // HIEROPHANT', 'ARCANA // TEMPERANCE', 'ARCANA // CHARIOT'];

test('C4: lab renders four cards in works order with their arcana codes', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    const cards = await page.locator('#lab [data-arcana-card]').evaluateAll((els) => els.map((el) => ({ id: el.id, code: el.querySelector('[data-arcana-code]').textContent.trim() })));
    assert.equal(cards.length, 4);
    const worksOrder = await page.locator('#works [id^="case-"]').evaluateAll((els) => els.map((el) => el.id.replace('case-', '')));
    const deckOrder = cards.map((c) => c.id.replace('arcana-', ''));
    assert.deepEqual(deckOrder, worksOrder.filter((id) => deckOrder.includes(id)), 'deck order must follow the works section');
    assert.deepEqual(cards.map((c) => c.code), CODES);
  } finally {
    await context.close();
  }
});

test('C5: card front and back match the works section text', async () => {
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openHome(locale, { reducedMotion: 'reduce' });
    try {
      const data = await page.evaluate(() => {
        const text = (root, sel) => root.querySelector(sel)?.textContent.replace(/\s+/g, ' ').trim();
        return [...document.querySelectorAll('#lab [data-arcana-card]')].map((card) => {
          const id = card.id.replace('arcana-', '');
          const work = document.getElementById(`case-${id}`);
          return {
            id,
            title: [text(card, '[data-arcana-title]'), text(work, '[data-case-title]')],
            challenge: [text(card, '[data-arcana-challenge]'), text(work, '[data-case-challenge]')],
            solution: [text(card, '[data-arcana-solution]'), text(work, '[data-case-solution]')],
            categoryInReel: text(work, '[data-case-reel]').endsWith(` // ${text(card, '[data-arcana-category]')}`),
            linkLabels: [[...card.querySelectorAll('[data-arcana-link-label]')].map((el) => el.textContent.trim()), [...work.querySelectorAll('[data-case-link-label]')].map((el) => el.textContent.trim())],
            stack: [[...card.querySelectorAll('[data-arcana-stack-item]')].map((el) => el.textContent.trim()), [...work.querySelectorAll('[data-case-stack-item]')].map((el) => el.textContent.trim())],
            links: [[...card.querySelectorAll('[data-arcana-link]')].map((el) => el.getAttribute('href')), [...work.querySelectorAll('[data-case-link]')].map((el) => el.getAttribute('href'))],
          };
        });
      });
      assert.equal(data.length, 4);
      for (const c of data) {
        for (const field of ['title', 'challenge', 'solution', 'stack', 'links', 'linkLabels']) {
          assert.ok(c[field][0] && c[field][0].length > 0, `${locale} ${c.id} ${field} is empty`);
          assert.deepEqual(c[field][0], c[field][1], `${locale} ${c.id} ${field} differs from the works section`);
        }
        assert.equal(c.categoryInReel, true, `${locale} ${c.id} category must come from the same data`);
      }
    } finally {
      await context.close();
    }
  }
});

test('C13: lab title anchor and menu label read ARCANA DECK', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    for (const locale of ['pt-br', 'en']) {
      if (locale === 'en') await toggleLocale(page);
      assert.equal(await page.locator('#lab').count(), 1);
      assert.equal(await page.locator('#lab [data-lab-title]').getAttribute('aria-label'), 'ARCANA DECK', `${locale} title`);
      await page.locator('#cockpit-trigger-btn').dispatchEvent('click');
      const label = page.locator('#cockpit-menu-overlay a[href="#lab"]');
      await label.waitFor({ state: 'visible', timeout: 8000 });
      assert.match((await label.textContent()).replace(/\s+/g, ' '), /04 \/\/ ARCANA DECK/, `${locale} menu label`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(900);
    }
  } finally {
    await context.close();
  }
});

test('C15: with JavaScript disabled the four cases stay readable in the lab', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    const cards = page.locator('#lab [data-arcana-card]');
    assert.equal(await cards.count(), 4);
    for (let i = 0; i < 4; i++) {
      const card = cards.nth(i);
      assert.ok((await card.locator('[data-arcana-stack-item]').count()) >= 5, `card ${i + 1} must list its stack`);
      assert.ok((await card.locator('[data-arcana-link]').count()) >= 1, `card ${i + 1} must list its links`);
      for (const link of await card.locator('[data-arcana-link], [data-arcana-open]').all()) {
        assert.equal(await link.isVisible(), true, `card ${i + 1} link must be visible without JS`);
      }
      for (const sel of ['[data-arcana-code]', '[data-arcana-title]', '[data-arcana-category]', '[data-arcana-challenge]', '[data-arcana-solution]', '[data-arcana-stack-item]']) {
        assert.equal(await card.locator(sel).first().isVisible(), true, `card ${i + 1} ${sel} must be visible without JS`);
        assert.ok((await card.locator(sel).first().textContent()).trim().length > 0, `card ${i + 1} ${sel} must have text`);
      }
    }
  } finally {
    await context.close();
  }
});

import zlib from 'node:zlib';

const distJs = () => fs.readdirSync('dist/_astro').filter((f) => f.endsWith('.js')).map((f) => `dist/_astro/${f}`);

test('C2: lab experiment files and anchors are gone', () => {
  for (const name of ['CrtTuner', 'SonarRadar', 'CyberDeck']) {
    assert.equal(fs.existsSync(`src/components/lab/${name}.tsx`), false, `${name}.tsx must not exist`);
  }
  const html = fs.readFileSync('dist/index.html', 'utf8');
  for (const anchor of ['lab-crt-tuner', 'lab-sonar-radar', 'lab-cyber-deck']) {
    assert.ok(!html.includes(anchor), `built home still has ${anchor}`);
  }
  assert.ok(html.includes('id="lab"'), 'the #lab section must remain');
  assert.equal(distJs().filter((f) => /three/i.test(f) || /CyberDeck|CrtTuner|SonarRadar/.test(f)).length, 0, 'no three or experiment chunk may be built');
});

test('C3: built js has no WebGLRenderer and stays within 200 kB gzip', () => {
  const files = distJs();
  assert.ok(files.length > 5, 'expected built chunks');
  let total = 0;
  for (const file of files) {
    const body = fs.readFileSync(file);
    assert.ok(!body.includes('WebGLRenderer'), `${file} still contains WebGLRenderer`);
    total += zlib.gzipSync(body).length;
  }
  assert.ok(total <= 200 * 1000, `client js gzip total is ${(total / 1000).toFixed(1)} kB, budget is 200 kB`);
});

test('C14: no THREE.JS, WEBGL or SHADERS text in dictionaries or the built page', async () => {
  const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
  const forbidden = /three\.js|webgl|shaders?\b/i;
  for (const locale of ['pt-br', 'en']) {
    assert.doesNotMatch(JSON.stringify(DICTIONARIES[locale]), forbidden, `${locale} dictionary still mentions a removed technology`);
  }
  const html = fs.readFileSync('dist/index.html', 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  assert.doesNotMatch(html, forbidden, 'built home still mentions a removed technology');
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    await toggleLocale(page);
    assert.doesNotMatch(await page.evaluate(() => document.body.innerText), forbidden, 'the English page still mentions a removed technology');
  } finally {
    await context.close();
  }
});

async function openDeck(contextOptions = {}, locale = 'pt-br') {
  const { context, page } = await openHome(locale, contextOptions);
  await page.evaluate(() => {
    const el = document.querySelector('#lab [data-arcana-viewport]');
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 160);
  });
  await page.waitForTimeout(700);
  await page.waitForFunction(() => document.querySelector('[data-arcana-deck]')?.classList.contains('is-enhanced'), null, { timeout: 8000 });
  return { context, page };
}

const deckState = (page) =>
  page.evaluate(() => {
    const viewport = document.querySelector('#lab [data-arcana-viewport]').getBoundingClientRect();
    const cards = [...document.querySelectorAll('#lab [data-arcana-card]')];
    const selectedIndex = cards.findIndex((c) => c.classList.contains('is-selected'));
    const sel = cards[selectedIndex];
    const r = sel.getBoundingClientRect();
    return {
      selectedIndex,
      centerOffset: Math.abs(r.left + r.width / 2 - (viewport.left + viewport.width / 2)),
      flipped: cards.map((c) => c.classList.contains('is-flipped')),
      pressed: cards.map((c) => c.querySelector('[data-arcana-toggle]').getAttribute('aria-pressed')),
      tabStops: cards.filter((c) => c.querySelector('[data-arcana-toggle]').tabIndex === 0).map((c) => c.id),
    };
  });

const toggleOf = (page, i) => page.locator('#lab [data-arcana-card]').nth(i).locator('[data-arcana-toggle]');

async function dragTrack(page, dx) {
  const box = await page.locator('#lab [data-arcana-card].is-selected').boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height * 0.3;
  await page.mouse.move(x, y);
  await page.mouse.down();
  const steps = 12;
  for (let i = 1; i <= steps; i++) await page.mouse.move(x + (dx * i) / steps, y);
  const xNow = () => page.locator('#lab [data-arcana-track]').evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
  await page.mouse.up();
  const atRelease = await xNow();
  await page.waitForTimeout(1600);
  return { atRelease, settled: await xNow() };
}

test('C6: click, Enter or Space flips the selected card and flips it back', async () => {
  const { context, page } = await openDeck();
  try {
    const challenge = page.locator('#lab [data-arcana-card]').first().locator('[data-arcana-challenge]');
    assert.equal(await challenge.isVisible(), false, 'the back starts hidden');
    await toggleOf(page, 0).click();
    await page.waitForTimeout(750);
    let state = await deckState(page);
    assert.deepEqual([state.flipped[0], state.pressed[0]], [true, 'true'], 'click flips');
    assert.equal(await challenge.isVisible(), true, 'the back is exposed after flipping');
    await toggleOf(page, 0).click();
    await page.waitForTimeout(750);
    state = await deckState(page);
    assert.deepEqual([state.flipped[0], state.pressed[0]], [false, 'false'], 'click again flips back');

    for (const key of ['Enter', 'Space']) {
      await toggleOf(page, 0).focus();
      await page.keyboard.press(key);
      await page.waitForTimeout(300);
      assert.equal((await deckState(page)).flipped[0], true, `${key} flips`);
      await page.keyboard.press(key);
      await page.waitForTimeout(300);
      assert.equal((await deckState(page)).flipped[0], false, `${key} flips back`);
    }

    await page.locator('#lab [data-arcana-card]').first().locator('[data-arcana-front]').click({ position: { x: 40, y: 120 } });
    await page.waitForTimeout(300);
    assert.equal((await deckState(page)).flipped[0], true, 'clicking the front face flips the selected card');
  } finally {
    await context.close();
  }
});

test('C7: arrows and drag change the selected card with snapping', async () => {
  const { context, page } = await openDeck();
  try {
    assert.ok((await deckState(page)).centerOffset < 3, `the first card must be centered on a fresh load, offset ${(await deckState(page)).centerOffset}`);
    await toggleOf(page, 0).focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(700);
    let state = await deckState(page);
    assert.equal(state.selectedIndex, 1, 'ArrowRight selects the next card');
    assert.ok(state.centerOffset < 3, `the selected card must be centered, offset ${state.centerOffset}`);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(700);
    assert.equal((await deckState(page)).selectedIndex, 0, 'ArrowLeft selects the previous card');
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(400);
    assert.equal((await deckState(page)).selectedIndex, 0, 'the deck stops at the first card');

    await dragTrack(page, -300);
    state = await deckState(page);
    assert.equal(state.selectedIndex, 1, 'dragging left by more than half a card selects the next card');
    assert.ok(state.centerOffset < 3, `drag must snap to the card, offset ${state.centerOffset}`);
    const back = await dragTrack(page, 300);
    state = await deckState(page);
    assert.equal(state.selectedIndex, 0, 'dragging right selects the previous card');
    assert.ok(state.centerOffset < 3, `drag must snap back, offset ${state.centerOffset}`);
    assert.notEqual(Math.round(back.atRelease), Math.round(back.settled), 'the deck must glide to the snap point after release (inertia)');

    await dragTrack(page, -880);
    state = await deckState(page);
    assert.equal(state.selectedIndex, 2, 'a 2.3 card drag lands on the nearest card, not just the next one');
    assert.ok(state.centerOffset < 3);

    await toggleOf(page, 2).focus();
    await page.keyboard.press('Home');
    await page.waitForTimeout(700);
    assert.equal((await deckState(page)).selectedIndex, 0, 'Home selects the first card');
    await page.keyboard.press('End');
    await page.waitForTimeout(700);
    assert.equal((await deckState(page)).selectedIndex, 3, 'End selects the last card');
    assert.equal(await page.locator('#lab [data-arcana-next]').isDisabled(), true, 'next is disabled on the last card');
    await page.locator('#lab [data-arcana-prev]').click();
    await page.waitForTimeout(700);
    assert.equal((await deckState(page)).selectedIndex, 2, 'the previous button selects the previous card');
    await page.locator('#lab [data-arcana-next]').click();
    await page.waitForTimeout(700);
    assert.equal((await deckState(page)).selectedIndex, 3, 'the next button selects the next card');
  } finally {
    await context.close();
  }
});

test('C8: activating an unselected card selects it without flipping', async () => {
  const { context, page } = await openDeck();
  try {
    await page.locator('#lab [data-arcana-card]').nth(2).locator('[data-arcana-front]').click({ position: { x: 40, y: 100 } });
    await page.waitForTimeout(800);
    const state = await deckState(page);
    assert.equal(state.selectedIndex, 2);
    assert.deepEqual(state.flipped, [false, false, false, false]);
    assert.ok(state.centerOffset < 3);
  } finally {
    await context.close();
  }
});

test('C9: deck keeps one tab stop and aria-pressed tracks the flip', async () => {
  const { context, page } = await openDeck();
  try {
    let state = await deckState(page);
    assert.deepEqual(state.tabStops, ['arcana-magalu-cloud']);
    assert.equal(await page.locator('#lab [data-arcana-card].is-selected').getAttribute('aria-current'), 'true');
    assert.equal(await page.locator('#lab [aria-current="true"]').count(), 1);
    await toggleOf(page, 0).focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(700);
    state = await deckState(page);
    assert.deepEqual(state.tabStops, ['arcana-uriana'], 'the tab stop follows the selection');
    assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-arcana-toggle') && document.activeElement.closest('[data-arcana-card]').id), 'arcana-uriana', 'focus follows the selection');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    assert.deepEqual((await deckState(page)).pressed, ['false', 'true', 'false', 'false']);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-arcana-link') && document.activeElement.closest('[data-arcana-card]').id), 'arcana-uriana', 'Tab from the toggle must reach the first link on the back');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-arcana-open') && document.activeElement.closest('[data-arcana-card]').id), 'arcana-uriana', 'Tab must walk the back links in order and end on the open-case link');
    assert.equal(await page.locator('#lab [data-arcana-prev]').getAttribute('aria-label'), 'Carta anterior');
    assert.equal(await page.locator('#lab [data-arcana-next]').getAttribute('aria-label'), 'Próxima carta');
    const hiddenFrontFocusable = await page.locator('#lab [data-arcana-card]').nth(1).locator('[data-arcana-front]').evaluate((el) => el.hasAttribute('inert'));
    assert.equal(hiddenFrontFocusable, true, 'the hidden face must be inert');
  } finally {
    await context.close();
  }
});

test('C10: locale change updates card text in place keeping selection and flip', async () => {
  const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
  const { getLocalizedCases } = await import('../src/data/cases.ts');
  const { context, page } = await openDeck();
  try {
    await toggleOf(page, 0).focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(700);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.evaluate(() => document.querySelectorAll('#lab [data-arcana-card], #lab [data-arcana-title], #lab [data-arcana-toggle]').forEach((el, i) => { el.__marker = `n${i}`; }));
    const before = await page.locator('#arcana-uriana [data-arcana-challenge]').textContent();
    await toggleLocale(page);
    const state = await deckState(page);
    assert.equal(state.selectedIndex, 1);
    assert.deepEqual(state.flipped, [false, true, false, false]);
    const en = getLocalizedCases('en').find((c) => c.id === 'uriana');
    assert.equal((await page.locator('#arcana-uriana [data-arcana-challenge]').textContent()).trim(), en.challenge);
    assert.notEqual(before.trim(), en.challenge);
    assert.equal((await page.locator('#arcana-uriana [data-arcana-open]').textContent()).trim(), DICTIONARIES.en.lab.openCase);
    assert.equal(await page.locator('#arcana-uriana [data-arcana-toggle]').getAttribute('aria-label'), `${en.arcanaCode}: ${en.title}`);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('#lab [data-arcana-card], #lab [data-arcana-title], #lab [data-arcana-toggle]')].every((el) => typeof el.__marker === 'string')), true, 'card nodes must survive');
  } finally {
    await context.close();
  }
});

test('C11: reduced motion selects and flips instantly', async () => {
  const { context, page } = await openDeck({ reducedMotion: 'reduce' });
  try {
    const result = await page.evaluate(() => {
      const deck = document.querySelector('#lab [data-arcana-deck]');
      const viewport = deck.querySelector('[data-arcana-viewport]').getBoundingClientRect();
      const toggle = deck.querySelector('[data-arcana-card]').querySelector('[data-arcana-toggle]');
      toggle.focus();
      toggle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const cards = [...deck.querySelectorAll('[data-arcana-card]')];
      const second = cards[1].getBoundingClientRect();
      const offset = Math.abs(second.left + second.width / 2 - (viewport.left + viewport.width / 2));
      cards[1].querySelector('[data-arcana-toggle]').click();
      const flip = cards[1].querySelector('[data-arcana-flip]');
      const m = new DOMMatrixReadOnly(getComputedStyle(flip).transform);
      return { selected: cards[1].classList.contains('is-selected'), offset, flipped: cards[1].classList.contains('is-flipped'), flipDuration: getComputedStyle(flip).transitionDuration, flipAngle: Math.round(Math.abs(Math.atan2(m.m13 || 0, m.m11) * 180 / Math.PI)) };
    });
    assert.equal(result.selected, true);
    assert.ok(result.offset < 3, `selection must move instantly, offset ${result.offset}`);
    assert.equal(result.flipped, true);
    assert.equal(result.flipDuration, '0s', 'no flip animation');
    assert.equal(result.flipAngle, 180, 'the flip must already be at its end state');
    await page.evaluate(() => document.querySelector('#lab [data-arcana-card]').querySelector('[data-arcana-toggle]').click());
    const before = (await deckState(page)).selectedIndex;
    assert.equal(before, 0);
    const box = await page.locator('#lab [data-arcana-card].is-selected').boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height * 0.3;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(x - (300 * i) / 10, y);
    await page.mouse.up();
    const trackX = () => page.locator('#lab [data-arcana-track]').evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
    const atRelease = await trackX();
    await page.waitForTimeout(500);
    const later = await trackX();
    const state = await deckState(page);
    assert.equal(state.selectedIndex, 1, 'dragging still changes the card in reduced motion');
    assert.ok(state.centerOffset < 3, 'the drag snaps to the card');
    assert.ok(Math.abs(atRelease - later) < 2, `there must be no inertia glide after release (${atRelease} -> ${later})`);
  } finally {
    await context.close();
  }
});

test('C12: back link scrolls to the works card below the nav', async () => {
  const { context, page } = await openDeck();
  try {
    await toggleOf(page, 0).focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(700);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
    assert.equal(await page.locator('#arcana-uriana [data-arcana-open]').getAttribute('href'), '#case-uriana');
    await page.locator('#arcana-uriana [data-arcana-open]').dispatchEvent('click');
    await page.waitForTimeout(2200);
    const metrics = await page.evaluate(() => {
      const target = document.getElementById('case-uriana').getBoundingClientRect().top;
      const avatar = document.querySelector('#comic-nav-logo [data-nav-avatar]');
      const trigger = document.getElementById('cockpit-trigger-btn');
      const navBottom = Math.max(avatar.getBoundingClientRect().bottom, trigger.getBoundingClientRect().bottom);
      return { target, navBottom };
    });
    assert.ok(metrics.target >= metrics.navBottom + 8 && metrics.target <= metrics.navBottom + 90, `case top ${metrics.target} vs nav bottom ${metrics.navBottom}`);
  } finally {
    await context.close();
  }
});

test('C17: a short drag returns to the current card', async () => {
  const { context, page } = await openDeck();
  try {
    await dragTrack(page, -100);
    let state = await deckState(page);
    assert.equal(state.selectedIndex, 0);
    assert.ok(state.centerOffset < 3, `the deck must return to the card, offset ${state.centerOffset}`);
    await dragTrack(page, -150);
    state = await deckState(page);
    assert.equal(state.selectedIndex, 0, 'a drag of about 40% of a card must return');
    assert.ok(state.centerOffset < 3);
    await dragTrack(page, -226);
    state = await deckState(page);
    assert.equal(state.selectedIndex, 1, 'a drag of about 60% of a card must advance');
  } finally {
    await context.close();
  }
});

test('C18: selecting another card flips the previous one back', async () => {
  const { context, page } = await openDeck();
  try {
    await toggleOf(page, 0).click();
    await page.waitForTimeout(700);
    assert.equal((await deckState(page)).flipped[0], true);
    await toggleOf(page, 0).focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(700);
    const state = await deckState(page);
    assert.deepEqual(state.flipped, [false, false, false, false]);
    assert.deepEqual(state.pressed, ['false', 'false', 'false', 'false']);
  } finally {
    await context.close();
  }
});

const faceReport = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('#lab [data-arcana-card]')].flatMap((card) =>
      ['[data-arcana-front]', '[data-arcana-back]'].map((sel) => {
        const face = card.querySelector(sel);
        const cs = getComputedStyle(face);
        const scrollable = ['auto', 'scroll'].includes(cs.overflowY);
        return { id: card.id, face: sel, fits: face.scrollHeight <= face.clientHeight + 1, scrollable, widthOk: face.scrollWidth <= face.clientWidth + 1 };
      }),
    ),
  );

test('C16: zero overflow and card back never clipped at 320, 375, 768 and 1440px', async () => {
  for (const locale of ['pt-br', 'en']) {
    for (const width of [320, 375, 768, 1440]) {
      const { context, page } = await openDeck({ reducedMotion: 'reduce', viewport: { width, height: 900 } }, locale);
      try {
        const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth }));
        assert.ok(m.sw <= m.cw && m.bw <= m.cw, `Overflow at ${width}px (${locale}): ${m.sw}/${m.bw} > ${m.cw}`);
        for (const face of await faceReport(page)) {
          assert.ok(face.fits || face.scrollable, `${face.id} ${face.face} is clipped at ${width}px (${locale})`);
          assert.equal(face.widthOk, true, `${face.id} ${face.face} overflows sideways at ${width}px (${locale})`);
        }
      } finally {
        await context.close();
      }
    }
  }
});

test('C19: long card back scrolls inside the card', async () => {
  const { context, page } = await openDeck({ viewport: { width: 1440, height: 900 } });
  try {
    const before = await page.locator('#lab [data-arcana-card].is-selected').boundingBox();
    await page.evaluate(() => {
      const challenge = document.querySelector('#lab [data-arcana-card].is-selected [data-arcana-challenge]');
      challenge.textContent = Array(40).fill('Texto longo do desafio técnico que precisa rolar dentro da carta.').join(' ');
    });
    await toggleOf(page, 0).click();
    await page.waitForTimeout(800);
    const back = await page.evaluate(() => {
      const card = document.querySelector('#lab [data-arcana-card].is-selected');
      const face = card.querySelector('[data-arcana-back]');
      return { overflowY: getComputedStyle(face).overflowY, scrolls: face.scrollHeight > face.clientHeight + 20, cardHeight: card.getBoundingClientRect().height, docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
    });
    assert.equal(back.scrolls, true, 'precondition: the text is longer than the card');
    assert.ok(['auto', 'scroll'].includes(back.overflowY), 'the back must scroll inside itself');
    assert.ok(Math.abs(back.cardHeight - before.height) < 2, `the card must keep its height, was ${before.height} now ${back.cardHeight}`);
    assert.equal(back.docOverflow, false);
    await page.locator('#lab [data-arcana-card].is-selected [data-arcana-back]').evaluate((el) => { el.scrollTop = el.scrollHeight; });
    const bottom = await page.evaluate(() => {
      const face = document.querySelector('#lab [data-arcana-card].is-selected [data-arcana-back]');
      return face.scrollTop + face.clientHeight >= face.scrollHeight - 2;
    });
    assert.equal(bottom, true, 'the end of the text must be reachable by scrolling the card');
  } finally {
    await context.close();
  }
});

test('C20: front text wraps inside the card at 320px', async () => {
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openDeck({ viewport: { width: 320, height: 640 } }, locale);
    try {
      const rows = await page.evaluate(() =>
        [...document.querySelectorAll('#lab [data-arcana-card]')].map((card) => {
          const cr = card.getBoundingClientRect();
          const inside = ['[data-arcana-code]', '[data-arcana-title]', '[data-arcana-category]'].map((sel) => {
            const el = card.querySelector(sel);
            const range = document.createRange();
            range.selectNodeContents(el);
            const r = range.getBoundingClientRect();
            return { sel, ok: r.left >= cr.left - 1 && r.right <= cr.right + 1, scrollOk: el.scrollWidth <= el.clientWidth + 1 };
          });
          return { id: card.id, inside };
        }),
      );
      for (const row of rows) for (const item of row.inside) {
        assert.equal(item.ok, true, `${locale} ${row.id} ${item.sel} leaves the card at 320px`);
        assert.equal(item.scrollOk, true, `${locale} ${row.id} ${item.sel} overflows its box at 320px`);
      }
    } finally {
      await context.close();
    }
  }
});
