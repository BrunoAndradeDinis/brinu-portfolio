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

const CASE_IDS = ['magalu-cloud', 'uriana', 'efood', 'aurastream'];
const CASE_TITLES = {
  'pt-br': ['Site Institucional Magalu Cloud', 'Uriana', 'eFood', 'AuraStream Engine & Painel-Stream'],
  en: ['Magalu Cloud Corporate Website', 'Uriana', 'eFood', 'AuraStream Engine & Painel-Stream'],
};
const OPEN_CASE_LABEL = { 'pt-br': 'ABRIR CASE', en: 'OPEN CASE' };
const LOCALES = ['pt-br', 'en'];

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

async function openHome({ locale = 'pt-br', viewport = { width: 1440, height: 900 }, prepare, ...contextOptions } = {}) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  const page = await context.newPage();
  await page.addInitScript((loc) => {
    window.localStorage.setItem('brinu_locale', loc);
  }, locale);
  if (prepare) await prepare(page);
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const el = document.getElementById('intro-preloader');
    if (el) {
      el.click();
      el.remove();
    }
    window.dispatchEvent(new CustomEvent('intro-complete'));
  });
  await page.waitForFunction(() => !document.documentElement.classList.contains('lenis-stopped'));
  return { context, page };
}

const readCases = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('#works [data-reveal-case]')].map((card) => {
      const rect = card.getBoundingClientRect();
      const shown = (el) => {
        for (let node = el; node && node !== document.body; node = node.parentElement) {
          const style = getComputedStyle(node);
          if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) < 1) return false;
        }
        return el.getClientRects().length > 0;
      };
      const open = card.querySelector('a[data-case-open]');
      return {
        id: card.id,
        title: card.querySelector('[data-case-title]').textContent.trim(),
        description: card.querySelector('[data-case-description]').textContent.trim(),
        href: open.getAttribute('href'),
        openLabel: open.querySelector('[data-i18n="works.openCase"]').textContent.trim(),
        shown: ['title', 'meta', 'media', 'summary', 'link'].every((name) => shown(card.querySelector(`[data-case-el="${name}"]`))),
        box: { top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY, left: rect.left, right: rect.right },
      };
    })
  );

const stageState = (page) =>
  page.evaluate(() => {
    const section = document.getElementById('works');
    const rect = section.querySelector('[data-cases-stage]').getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      scrollY: window.scrollY,
      pinned: section.getAttribute('data-cases-pinned') === 'true',
      mode: section.getAttribute('data-cases-mode'),
      locked: document.documentElement.classList.contains('lenis-stopped'),
      spacers: section.querySelectorAll('.pin-spacer').length,
    };
  });

async function wheelOnce(page, deltaY) {
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, deltaY);
  return before;
}

async function assertStaticList(page, locale) {
  const cases = await readCases(page);
  assert.deepEqual(cases.map((entry) => entry.id), CASE_IDS.map((id) => `case-${id}`), `${locale}: every case is listed in order`);
  assert.deepEqual(cases.map((entry) => entry.title), CASE_TITLES[locale], `${locale}: case titles`);
  assert.deepEqual(cases.map((entry) => entry.href), CASE_IDS.map((id) => `/cases/${id}`), `${locale}: each case links to its page`);
  assert.deepEqual(cases.map((entry) => entry.openLabel), CASE_IDS.map(() => OPEN_CASE_LABEL[locale]));
  assert.deepEqual(cases.map((entry) => entry.shown), CASE_IDS.map(() => true), `${locale}: every case shows all of its elements at once`);
  for (let a = 0; a < cases.length; a += 1) {
    for (let b = a + 1; b < cases.length; b += 1) {
      const first = cases[a].box;
      const second = cases[b].box;
      const overlap = first.left < second.right - 1 && second.left < first.right - 1 && first.top < second.bottom - 1 && second.top < first.bottom - 1;
      assert.equal(overlap, false, `${locale}: ${cases[a].id} and ${cases[b].id} sit side by side or stacked, never on top of each other`);
    }
  }
}

async function assertScrollsWithoutPin(page, label) {
  await page.evaluate(() => {
    const stage = document.querySelector('#works [data-cases-stage]');
    window.scrollTo(0, Math.max(0, stage.getBoundingClientRect().top + window.scrollY - 300));
  });
  await page.mouse.move(700, 450);
  const initial = await stageState(page);
  const documentTop = initial.top + initial.scrollY;
  let state = initial;
  for (let gesture = 0; gesture < 60 && state.bottom > 0; gesture += 1) {
    const previous = await wheelOnce(page, 400);
    await page.waitForFunction((y) => window.scrollY > y, previous);
    state = await stageState(page);
    assert.equal(state.pinned, false, `${label}: the section is never pinned`);
    assert.equal(state.locked, false, `${label}: scroll is never locked`);
    assert.ok(Math.abs(state.top + state.scrollY - documentTop) <= 2, `${label}: the cases move with the page (${state.top + state.scrollY} vs ${documentTop})`);
  }
  assert.ok(state.bottom <= 0, `${label}: plain scrolling passes the whole cases list`);
  assert.equal(state.spacers, 0, `${label}: no pin spacer wraps the cases`);
  assert.equal(state.mode, 'static', `${label}: static mode`);
}

test('reduced motion shows a static cases list', async () => {
  for (const locale of LOCALES) {
    const { context, page } = await openHome({ locale, reducedMotion: 'reduce' });
    try {
      await assertStaticList(page, locale);
      await assertScrollsWithoutPin(page, `reduced motion ${locale}`);
      await assertStaticList(page, locale);
    } finally {
      await context.close();
    }
  }
});

test('static cases list follows the language toggle', async () => {
  const { getLocalizedCases } = await import('../src/data/cases.ts');
  const { context, page } = await openHome({ locale: 'pt-br', reducedMotion: 'reduce' });
  try {
    await assertStaticList(page, 'pt-br');
    assert.deepEqual((await readCases(page)).map((entry) => entry.description), getLocalizedCases('pt-br').map((entry) => entry.description));
    await page.locator('[data-lang-toggle]').first().click();
    await page.waitForFunction(() => document.documentElement.getAttribute('data-locale') === 'en');
    await page.waitForFunction((title) => document.querySelector('#case-magalu-cloud [data-case-title]').textContent.trim() === title, CASE_TITLES.en[0]);
    await assertStaticList(page, 'en');
    assert.deepEqual((await readCases(page)).map((entry) => entry.description), getLocalizedCases('en').map((entry) => entry.description));
  } finally {
    await context.close();
  }
});

// A pause is what separates two wheel gestures, so it is part of the input, not a wait for a result.
const GESTURE_PAUSE_MS = 400;
const betweenGestures = (page) => page.waitForTimeout(GESTURE_PAUSE_MS);

const visibleCases = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('#works [data-reveal-case]')]
      .filter((card) => getComputedStyle(card).visibility !== 'hidden' && card.getClientRects().length > 0)
      .map((card) => card.id.replace('case-', ''))
  );

const waitForOnlyCase = (page, id) =>
  page.waitForFunction((expected) => {
    const shown = [...document.querySelectorAll('#works [data-reveal-case]')].filter((card) => getComputedStyle(card).visibility !== 'hidden');
    return shown.length === 1 && shown[0].id === `case-${expected}`;
  }, id);

async function pinCases(page) {
  await page.waitForFunction(() => document.getElementById('works').getAttribute('data-cases-mode') === 'reveal');
  await page.mouse.move(700, 450);
  await page.evaluate(() => {
    const stage = document.querySelector('#works [data-cases-stage]');
    window.scrollTo(0, stage.getBoundingClientRect().top + window.scrollY - 250);
  });
  await page.waitForFunction(() => {
    const top = document.querySelector('#works [data-cases-stage]').getBoundingClientRect().top;
    return top > 200 && top < 300;
  });
  const approaching = await stageState(page);
  assert.equal(approaching.pinned, false, 'the section is not pinned before it reaches the top');
  assert.equal(approaching.locked, false);
  await betweenGestures(page);
  await page.mouse.wheel(0, 400);
  await page.waitForFunction(() => document.getElementById('works').getAttribute('data-cases-pinned') === 'true');
  await betweenGestures(page);
}

async function assertPinnedAtTop(page, label) {
  const samples = await page.evaluate(async () => {
    const stage = document.querySelector('#works [data-cases-stage]');
    const tops = [];
    for (let frame = 0; frame < 6; frame += 1) {
      tops.push(stage.getBoundingClientRect().top);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return tops;
  });
  for (const top of samples) assert.ok(Math.abs(top) <= 1, `${label}: the pinned section sits at the top of the viewport (${samples.join(', ')})`);
  const state = await stageState(page);
  assert.equal(state.pinned, true, `${label}: pinned`);
  assert.equal(state.locked, true, `${label}: page scroll is held while pinned`);
}

test('cases section pins and shows the first case', async () => {
  for (const locale of LOCALES) {
    const { context, page } = await openHome({ locale });
    try {
      await pinCases(page);
      await assertPinnedAtTop(page, locale);
      await waitForOnlyCase(page, CASE_IDS[0]);
      const first = await page.locator(`#case-${CASE_IDS[0]} [data-case-title]`).evaluate(async (title) => {
        const opaque = () => {
          for (let node = title; node && node !== document.body; node = node.parentElement) {
            if (Number(getComputedStyle(node).opacity) < 1) return false;
          }
          return true;
        };
        while (!opaque()) await new Promise((resolve) => requestAnimationFrame(resolve));
        const rect = title.getBoundingClientRect();
        return { text: title.textContent.trim(), inViewport: rect.top >= 0 && rect.bottom <= window.innerHeight && rect.left >= 0 && rect.right <= window.innerWidth };
      });
      assert.equal(first.text, CASE_TITLES[locale][0], `${locale}: the first case from the data is the one shown`);
      assert.equal(first.inViewport, true, `${locale}: the first case title is inside the viewport`);
      assert.deepEqual(await visibleCases(page), [CASE_IDS[0]], `${locale}: only the first case is shown`);
      const navBottom = await page.evaluate(() =>
        Math.max(...[document.querySelector('#comic-nav-logo [data-nav-avatar]'), document.getElementById('cockpit-trigger-btn')].map((el) => el.getBoundingClientRect().bottom))
      );
      const cardTop = await page.locator(`#case-${CASE_IDS[0]}`).evaluate((card) => card.getBoundingClientRect().top);
      assert.ok(cardTop >= navBottom, `${locale}: the pinned case clears the nav controls (${cardTop} vs ${navBottom})`);
    } finally {
      await context.close();
    }
  }
});

test('one wheel gesture advances one case', async () => {
  const { context, page } = await openHome();
  try {
    await pinCases(page);
    await waitForOnlyCase(page, CASE_IDS[0]);

    await page.mouse.wheel(0, 120);
    await waitForOnlyCase(page, CASE_IDS[1]);
    await betweenGestures(page);
    assert.deepEqual(await visibleCases(page), [CASE_IDS[1]], 'a single notch moves exactly one case');
    await assertPinnedAtTop(page, 'after the first gesture');

    for (let burst = 0; burst < 5; burst += 1) await page.mouse.wheel(0, 600);
    await waitForOnlyCase(page, CASE_IDS[2]);
    await betweenGestures(page);
    assert.deepEqual(await visibleCases(page), [CASE_IDS[2]], 'a long, strong gesture still moves exactly one case');
    await assertPinnedAtTop(page, 'after the strong gesture');

    await page.mouse.wheel(0, -120);
    await waitForOnlyCase(page, CASE_IDS[1]);
    await betweenGestures(page);
    assert.deepEqual(await visibleCases(page), [CASE_IDS[1]], 'a gesture upwards moves exactly one case back');
  } finally {
    await context.close();
  }
});

test('pin releases after the last case', async () => {
  const { context, page } = await openHome();
  try {
    await pinCases(page);
    await waitForOnlyCase(page, CASE_IDS[0]);
    for (const id of CASE_IDS.slice(1)) {
      await page.mouse.wheel(0, 120);
      await waitForOnlyCase(page, id);
      await betweenGestures(page);
      await assertPinnedAtTop(page, `on ${id}`);
    }

    await page.mouse.wheel(0, 120);
    await page.waitForFunction(() => document.getElementById('works').getAttribute('data-cases-pinned') === 'false');
    await betweenGestures(page);
    const released = await stageState(page);
    assert.equal(released.locked, false, 'page scroll is no longer held');
    assert.deepEqual(await visibleCases(page), [CASE_IDS.at(-1)], 'the last case stays on screen when the pin lets go');

    await page.mouse.wheel(0, 300);
    await page.waitForFunction((y) => window.scrollY >= y + 250, released.scrollY);
    const scrolled = await stageState(page);
    assert.equal(scrolled.pinned, false);
    assert.ok(scrolled.top <= released.top - 250, `the section scrolls away with the page (${released.top} -> ${scrolled.top})`);
    assert.ok(Math.abs(scrolled.top - released.top + (scrolled.scrollY - released.scrollY)) <= 2, 'the section moves exactly as far as the page scrolled');
  } finally {
    await context.close();
  }
});

test('failed motion load shows the static cases list', async () => {
  let aborted = 0;
  const { context, page } = await openHome({
    prepare: (target) =>
      target.route(/CasesReveal\.astro[^/]*\.js/, (route) => {
        aborted += 1;
        return route.abort();
      }),
  });
  try {
    assert.ok(aborted >= 1, 'the motion code was requested and failed to load');
    await assertStaticList(page, 'pt-br');
    await assertScrollsWithoutPin(page, 'failed motion load');
    await assertStaticList(page, 'pt-br');
  } finally {
    await context.close();
  }
});

const REVEAL_ORDER = ['title', 'meta', 'media', 'summary', 'link'];
const NEXT_CASE_LABEL = { 'pt-br': 'PRÓXIMO CASE →', en: 'NEXT CASE →' };

const waitForCaseFullyShown = (page, id) =>
  page.waitForFunction(
    ({ expected, names }) => {
      const card = document.getElementById(`case-${expected}`);
      if (getComputedStyle(card).visibility === 'hidden') return false;
      return names.every((name) => {
        const style = getComputedStyle(card.querySelector(`[data-case-el="${name}"]`));
        return style.visibility !== 'hidden' && Number(style.opacity) === 1;
      });
    },
    { expected: id, names: REVEAL_ORDER }
  );

const recordReveal = (page, id) =>
  page.evaluate(
    ({ expected, names }) => {
      const card = document.getElementById(`case-${expected}`);
      const record = { start: {}, end: {}, hiddenWhenFirstAppeared: {}, complete: false };
      window.__reveal = record;
      const opacityOf = (name) => {
        const style = getComputedStyle(card.querySelector(`[data-case-el="${name}"]`));
        return style.visibility === 'hidden' ? 0 : Number(style.opacity);
      };
      const sample = () => {
        if (getComputedStyle(card).visibility !== 'hidden') {
          const now = performance.now();
          const opacities = Object.fromEntries(names.map((name) => [name, opacityOf(name)]));
          for (const name of names) {
            if (opacities[name] > 0 && record.start[name] === undefined) {
              record.start[name] = now;
              record.hiddenWhenFirstAppeared[name] = names.filter((other) => opacities[other] === 0);
            }
            if (opacities[name] === 1 && record.start[name] !== undefined && record.end[name] === undefined) record.end[name] = now;
          }
        }
        record.complete = names.every((name) => record.end[name] !== undefined);
        if (!record.complete) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    },
    { expected: id, names: REVEAL_ORDER }
  );

async function readReveal(page) {
  await page.waitForFunction(() => window.__reveal.complete === true);
  return page.evaluate(() => window.__reveal);
}

function assertOverlappingOrder(reveal, label) {
  assert.deepEqual(reveal.hiddenWhenFirstAppeared[REVEAL_ORDER[0]], REVEAL_ORDER.slice(1), `${label}: the title appears alone, before every other element`);
  for (let position = 1; position < REVEAL_ORDER.length; position += 1) {
    const previous = REVEAL_ORDER[position - 1];
    const current = REVEAL_ORDER[position];
    assert.ok(reveal.start[current] > reveal.start[previous], `${label}: ${current} starts after ${previous} (${reveal.start[previous]} -> ${reveal.start[current]})`);
    assert.ok(reveal.start[current] < reveal.end[previous], `${label}: ${current} starts before ${previous} ends (${reveal.start[current]} vs ${reveal.end[previous]})`);
    assert.ok(reveal.end[current] > reveal.end[previous], `${label}: ${current} finishes after ${previous}`);
  }
}

test('case elements reveal in overlapping order', async () => {
  const { context, page } = await openHome();
  try {
    await pinCases(page);
    await waitForCaseFullyShown(page, CASE_IDS[0]);
    for (const id of CASE_IDS.slice(1, 3)) {
      await recordReveal(page, id);
      await page.mouse.wheel(0, 120);
      assertOverlappingOrder(await readReveal(page), id);
      await waitForCaseFullyShown(page, id);
      assert.deepEqual(await visibleCases(page), [id]);
    }
  } finally {
    await context.close();
  }
});

test('next button reveals the next case in sequence', async () => {
  for (const locale of LOCALES) {
    const { context, page } = await openHome({ locale });
    try {
      await pinCases(page);
      await waitForCaseFullyShown(page, CASE_IDS[0]);
      for (const id of CASE_IDS.slice(1)) {
        await recordReveal(page, id);
        await page.locator('#works').getByRole('button', { name: NEXT_CASE_LABEL[locale], exact: true }).click();
        assertOverlappingOrder(await readReveal(page), `${locale} ${id}`);
        await waitForCaseFullyShown(page, id);
        assert.deepEqual(await visibleCases(page), [id], `${locale}: one click moves exactly one case`);
        assert.equal((await page.locator(`#case-${id} [data-case-title]`).textContent()).trim(), CASE_TITLES[locale][CASE_IDS.indexOf(id)]);
        await assertPinnedAtTop(page, `${locale} after the button on ${id}`);
      }
    } finally {
      await context.close();
    }
  }
});

test('index shows the cases reveal in the projects position', async () => {
  const { context, page } = await openHome({ reducedMotion: 'reduce' });
  try {
    const layout = await page.evaluate(() => {
      const sections = [...document.querySelectorAll('#main-content > section')];
      const works = document.getElementById('works');
      const position = sections.indexOf(works);
      return {
        worksCount: document.querySelectorAll('#works').length,
        isCasesReveal: works.hasAttribute('data-cases-reveal'),
        previous: sections[position - 1]?.id,
        next: sections[position + 1]?.id,
        oldListParts: document.querySelectorAll('[data-reel-track], [data-technical-grid]').length,
        cases: [...works.querySelectorAll('[data-reveal-case]')].map((card) => card.id),
        background: getComputedStyle(works).backgroundColor,
      };
    });
    assert.equal(layout.worksCount, 1, 'one projects section');
    assert.equal(layout.isCasesReveal, true, 'the projects section is the cases reveal');
    assert.equal(layout.next, 'about', 'the cases reveal sits right before the about section');
    assert.ok(layout.previous && layout.previous !== 'hero', `the cases reveal follows the filmstrip (${layout.previous})`);
    assert.equal(layout.oldListParts, 0, 'the old projects list no longer renders');
    assert.deepEqual(layout.cases, CASE_IDS.map((id) => `case-${id}`));
    assert.equal(layout.background, 'rgb(251, 250, 244)', 'the section keeps the Paper White ground');

    await page.locator('#cockpit-trigger-btn').click();
    const link = page.locator('[data-cockpit-link="works"]');
    await link.waitFor({ state: 'visible' });
    await link.click();
    await page.waitForFunction(() => {
      const top = document.getElementById('works').getBoundingClientRect().top;
      return top >= 0 && top < window.innerHeight / 2;
    });
  } finally {
    await context.close();
  }
});

const startTypingRecorder = (page, key, selector) =>
  page.evaluate(
    ({ key, selector }) => {
      const element = document.querySelector(selector);
      const card = element.closest('[data-reveal-case]');
      const shownText = () => {
        let text = '';
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          let shown = true;
          for (let parent = node.parentElement; parent !== element; parent = parent.parentElement) {
            const style = getComputedStyle(parent);
            if (Number(style.opacity) === 0 || style.visibility === 'hidden' || style.display === 'none' || style.color === 'rgba(0, 0, 0, 0)') shown = false;
          }
          if (shown) text += node.data;
        }
        return text.trim();
      };
      const onScreen = () => {
        const rect = element.getBoundingClientRect();
        return element.checkVisibility({ visibilityProperty: true }) && rect.bottom > 0 && rect.top < window.innerHeight;
      };
      const record = { before: null, samples: [], complete: false };
      window.__typing = { ...(window.__typing || {}), [key]: record };
      const sample = () => {
        const frame = {
          at: performance.now(),
          shown: shownText(),
          full: element.textContent.trim(),
          height: element.offsetHeight,
          cardHeight: card.offsetHeight,
          onScreen: onScreen(),
        };
        const typing = frame.shown !== frame.full;
        if (record.samples.length === 0 && !typing) record.before = frame;
        else record.samples.push(frame);
        record.complete = record.samples.length > 0 && !typing;
        if (!record.complete) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    },
    { key, selector }
  );

async function readTyping(page, key) {
  await page.waitForFunction((name) => window.__typing[name].complete === true, key, { timeout: 15_000 });
  return page.evaluate((name) => window.__typing[name], key);
}

function assertTypedOnce(record, label) {
  const partial = record.samples.slice(0, -1);
  const done = record.samples.at(-1);
  assert.equal(partial[0].shown, '', `${label}: typing starts from an empty block`);
  assert.equal(done.shown, done.full, `${label}: typing ends on the whole text`);
  let previous = 0;
  for (const frame of record.samples) {
    assert.ok(frame.full.startsWith(frame.shown), `${label}: what is shown is always the start of the text ("${frame.shown}")`);
    assert.ok(frame.shown.length >= previous, `${label}: typed characters never go back`);
    previous = frame.shown.length;
  }
  assert.ok(new Set(partial.map((frame) => frame.shown.length)).size >= 5, `${label}: the text grows character by character, not in one flash`);
  const firstTyped = partial.find((frame) => frame.shown.length > 0);
  assert.equal(firstTyped.onScreen, true, `${label}: the block is on screen while it types`);
}

// Typing starts after `lastEmpty` and ends at or before `done`, so the real time lies between `shortest` and `longest`.
function typingWindow(record) {
  const partial = record.samples.slice(0, -1);
  const lastEmpty = partial.findLast((frame) => frame.shown.length === 0);
  const firstTyped = partial.find((frame) => frame.shown.length > 0);
  return { shortest: partial.at(-1).at - firstTyped.at, longest: record.samples.at(-1).at - lastEmpty.at };
}

const LABEL_SELECTORS = ['[data-case-reel]', '[data-case-subtitle]'];

function assertLabelTiming(record, label) {
  assertTypedOnce(record, label);
  const { shortest, longest } = typingWindow(record);
  assert.ok(longest >= 400, `${label}: typing takes at least 400 ms (at most ${longest} ms measured)`);
  assert.ok(shortest <= 600, `${label}: typing takes at most 600 ms (at least ${shortest} ms measured)`);
}

test('a label types within 400 to 600 ms on screen', async () => {
  for (const locale of LOCALES) {
    const { context, page } = await openHome({ locale });
    try {
      await pinCases(page);
      await waitForCaseFullyShown(page, CASE_IDS[0]);
      for (const selector of LABEL_SELECTORS) await startTypingRecorder(page, selector, `#case-${CASE_IDS[1]} ${selector}`);
      await page.mouse.wheel(0, 120);
      for (const selector of LABEL_SELECTORS) assertLabelTiming(await readTyping(page, selector), `${locale} ${selector}`);
    } finally {
      await context.close();
    }
  }

  const { context, page } = await openHome({ viewport: { width: 360, height: 640 } });
  try {
    assert.equal((await stageState(page)).mode, 'static', 'a small phone shows the plain list');
    const selector = `#case-${CASE_IDS[2]} [data-case-subtitle]`;
    await startTypingRecorder(page, 'scrolled', selector);
    await page.locator(selector).scrollIntoViewIfNeeded();
    assertLabelTiming(await readTyping(page, 'scrolled'), 'label scrolled into the viewport');
  } finally {
    await context.close();
  }
});

test('typing reserves the final height', async () => {
  const { context, page } = await openHome();
  try {
    await pinCases(page);
    await waitForCaseFullyShown(page, CASE_IDS[0]);
    for (const selector of LABEL_SELECTORS) await startTypingRecorder(page, selector, `#case-${CASE_IDS[1]} ${selector}`);
    await page.mouse.wheel(0, 120);
    for (const selector of LABEL_SELECTORS) {
      const record = await readTyping(page, selector);
      assertTypedOnce(record, selector);
      const settled = record.samples.at(-1);
      assert.ok(settled.height > 0, `${selector}: the settled block has a height`);
      assert.equal(record.before.height, settled.height, `${selector}: the height is reserved before typing starts`);
      assert.equal(record.before.cardHeight, settled.cardHeight, `${selector}: the case card is at its final height before typing starts`);
      for (const frame of record.samples) {
        assert.equal(frame.height, settled.height, `${selector}: the block keeps its final height with "${frame.shown}" typed`);
        assert.equal(frame.cardHeight, settled.cardHeight, `${selector}: the case card never moves while "${frame.shown}" is typed`);
        assert.equal(frame.full, settled.full, `${selector}: the whole text stays in the DOM while typing`);
      }
    }
  } finally {
    await context.close();
  }
});

test('reduced motion shows typed text in full at once', async () => {
  for (const locale of LOCALES) {
    const { context, page } = await openHome({ locale, reducedMotion: 'reduce' });
    try {
      for (const selector of LABEL_SELECTORS) {
        const target = `#case-${CASE_IDS[2]} ${selector}`;
        await startTypingRecorder(page, selector, target);
        await page.locator(target).scrollIntoViewIfNeeded();
        const frames = await page.evaluate(
          async ({ key, windowMs }) => {
            const until = performance.now() + windowMs;
            while (performance.now() < until) await new Promise((resolve) => requestAnimationFrame(resolve));
            return { typed: window.__typing[key].samples.length, text: window.__typing[key].before.full, onScreen: window.__typing[key].before !== null };
          },
          { key: selector, windowMs: 700 }
        );
        assert.equal(frames.typed, 0, `${locale} ${selector}: no frame ever shows a partly typed text`);
        assert.ok(frames.text.length > 0, `${locale} ${selector}: the whole text is shown`);
        const visible = await page.locator(target).evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return element.checkVisibility({ visibilityProperty: true, opacityProperty: true }) && rect.bottom > 0 && rect.top < window.innerHeight;
        });
        assert.equal(visible, true, `${locale} ${selector}: the label is on screen in full`);
      }
    } finally {
      await context.close();
    }
  }
});
