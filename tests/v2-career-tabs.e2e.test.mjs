import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';
import { getLocalizedCareer } from '../src/data/career.ts';
import { DICTIONARIES } from '../src/i18n/dictionaries.ts';

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
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const options = { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  if (fs.existsSync('/usr/bin/google-chrome')) options.executablePath = '/usr/bin/google-chrome';
  browser = await chromium.launch(options);
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function openAbout(locale, contextOptions = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...contextOptions });
  const page = await context.newPage();
  await page.addInitScript((loc) => window.localStorage.setItem('brinu_locale', loc), locale);
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.getElementById('intro-preloader')?.remove();
    window.dispatchEvent(new CustomEvent('intro-complete'));
  });
  await page.evaluate(() => {
    const el = document.querySelector('#about');
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY + 200);
  });
  await page.waitForTimeout(600);
  return { context, page };
}

const withAbout = async (locale, options, run) => {
  const { context, page } = await openAbout(locale, options);
  try {
    await run(page);
  } finally {
    await context.close();
  }
};

const tab = (page, id, key) => page.locator(`#career-${id}-tab-${key}`);
const panel = (page, id, key) => page.locator(`#career-${id}-panel-${key}`);
const detailTexts = (page, id) => page.locator(`#career-${id}-panel-details [data-career-detail]`).evaluateAll((els) => els.map((el) => el.textContent));
const expected = (locale, id) => getLocalizedCareer(locale).find((entry) => entry.id === id);
const IDS = ['magalu-cloud', 'luizalabs', 'magazine-luiza'];
const REDUCED = { reducedMotion: 'reduce' };

test('TAB-01: each career card shows an icon and three tabs labelled in both locales', async () => {
  for (const locale of ['pt-br', 'en']) {
    await withAbout(locale, REDUCED, async (page) => {
      const about = DICTIONARIES[locale].about;
      for (const id of IDS) {
        assert.equal(await page.locator(`#career-${id} [data-career-icon="${id}"]`).count(), 1, `${locale} ${id} icon`);
        const labels = await page.locator(`#career-${id} [role="tab"]`).evaluateAll((els) => els.map((el) => el.textContent.trim()));
        assert.deepEqual(labels, [about.tabInfo, about.tabDetails, about.tabLearned], `${locale} ${id}`);
      }
    });
  }
  assert.deepEqual(
    ['pt-br', 'en'].map((l) => [DICTIONARIES[l].about.tabInfo, DICTIONARIES[l].about.tabDetails, DICTIONARIES[l].about.tabLearned]),
    [['INFO', 'FUNÇÕES', 'APRENDIZADOS'], ['INFO', 'DUTIES', 'LEARNED']]
  );
});

test('TAB-02: on load every card shows the INFO panel only', async () => {
  await withAbout('pt-br', REDUCED, async (page) => {
    for (const id of IDS) {
      assert.equal(await panel(page, id, 'info').isVisible(), true, `${id} info`);
      assert.equal(await panel(page, id, 'details').isVisible(), false, `${id} details`);
      assert.equal(await panel(page, id, 'learned').isVisible(), false, `${id} learned`);
    }
  });
});

test('TAB-03: activating a tab shows only its panel and selects it alone', async () => {
  await withAbout('pt-br', REDUCED, async (page) => {
    await tab(page, 'luizalabs', 'learned').click();
    assert.equal(await panel(page, 'luizalabs', 'learned').isVisible(), true);
    assert.equal(await panel(page, 'luizalabs', 'info').isVisible(), false);
    assert.equal(await panel(page, 'luizalabs', 'details').isVisible(), false);
    const selected = await page.locator('#career-luizalabs [role="tab"]').evaluateAll((els) => els.map((el) => el.getAttribute('aria-selected')));
    assert.deepEqual(selected, ['false', 'false', 'true']);
    assert.equal(await panel(page, 'magalu-cloud', 'info').isVisible(), true, 'other cards are untouched');
  });
});

test('TAB-04: arrow keys move between tabs and wrap', async () => {
  await withAbout('pt-br', REDUCED, async (page) => {
    await tab(page, 'luizalabs', 'info').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await tab(page, 'luizalabs', 'details').getAttribute('aria-selected'), 'true');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'career-luizalabs-tab-details');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'career-luizalabs-tab-info', 'wraps from the last to the first');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'career-luizalabs-tab-learned', 'wraps from the first to the last');
    assert.equal(await tab(page, 'luizalabs', 'learned').getAttribute('aria-selected'), 'true');
  });
});

test('TAB-05: first view types each line in order and ends on the approved text', async () => {
  await withAbout('pt-br', {}, async (page) => {
    const want = expected('pt-br', 'luizalabs').details;
    await tab(page, 'luizalabs', 'details').click();
    const first = await detailTexts(page, 'luizalabs');
    assert.ok(first.some((text) => text.length < want.join('').length), 'text is still being typed right after the click');
    let sawPartial = false;
    for (let i = 0; i < 80; i += 1) {
      await page.waitForTimeout(100);
      const now = await detailTexts(page, 'luizalabs');
      now.forEach((text, index) => {
        assert.ok(want[index].startsWith(text), `line ${index} only ever shows a prefix of its text`);
        if (index > 0 && text.length > 0) assert.equal(now[index - 1], want[index - 1], `line ${index} starts after line ${index - 1} is complete`);
      });
      sawPartial ||= now.some((text, index) => text.length > 0 && text.length < want[index].length);
      if (now.every((text, index) => text === want[index])) break;
    }
    assert.equal(sawPartial, true, 'a partial line was observed');
    assert.deepEqual(await detailTexts(page, 'luizalabs'), want);
  });
});

test('TAB-06: reduced motion shows the full text without typing', async () => {
  await withAbout('pt-br', REDUCED, async (page) => {
    await tab(page, 'luizalabs', 'details').click();
    assert.deepEqual(await detailTexts(page, 'luizalabs'), expected('pt-br', 'luizalabs').details);
  });
});

test('TAB-07: a locale change stops typing and shows the new text in full', async () => {
  await withAbout('pt-br', {}, async (page) => {
    await tab(page, 'luizalabs', 'details').click();
    await page.waitForTimeout(300);
    await page.locator('#nav-lang-toggle-btn').dispatchEvent('click');
    await page.waitForTimeout(400);
    assert.deepEqual(await detailTexts(page, 'luizalabs'), expected('en', 'luizalabs').details);
    await page.waitForTimeout(1500);
    assert.deepEqual(await detailTexts(page, 'luizalabs'), expected('en', 'luizalabs').details, 'stays stable afterwards');
  });
});

test('TAB-08: without javascript all three panels are readable', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${baseUrl}/`, { waitUntil: 'load' });
    for (const id of IDS) {
      const want = expected('pt-br', id);
      for (const key of ['info', 'details', 'learned']) assert.equal(await panel(page, id, key).evaluate((el) => !el.hidden && getComputedStyle(el).display !== 'none'), true, `${id} ${key}`);
      const text = await page.locator(`#career-${id}`).innerText();
      for (const line of [...want.details, ...want.hardSkills, ...want.softSkills]) assert.ok(text.includes(line), `${id}: "${line}"`);
    }
  } finally {
    await context.close();
  }
});

test('TAB-09: an entry without soft skills omits the soft-skills block', async () => {
  await withAbout('pt-br', REDUCED, async (page) => {
    assert.equal(expected('pt-br', 'magalu-cloud').softSkills.length, 0);
    assert.equal(await page.locator('#career-magalu-cloud [data-career-soft]').count(), 0);
    assert.equal(await page.locator('#career-magalu-cloud [data-i18n="about.softSkillsLabel"]').count(), 0);
    assert.ok(await page.locator('#career-magalu-cloud [data-i18n="about.hardSkillsLabel"]').count() > 0);
    assert.ok(await page.locator('#career-luizalabs [data-career-soft]').count() > 0);
  });
});

test('TAB-E1: a locale change leaves no half-typed line', async () => {
  await withAbout('pt-br', {}, async (page) => {
    await tab(page, 'luizalabs', 'details').click();
    await page.waitForTimeout(500);
    await page.locator('#nav-lang-toggle-btn').dispatchEvent('click');
    await page.waitForTimeout(2500);
    assert.equal(await page.locator('#career-luizalabs .is-typing').count(), 0);
    assert.equal(await page.locator('#career-luizalabs [aria-busy="true"]').count(), 0);
    assert.deepEqual(await detailTexts(page, 'luizalabs'), expected('en', 'luizalabs').details);
  });
});

test('TAB-E2: leaving a tab mid-typing shows the finished text on return', async () => {
  await withAbout('pt-br', {}, async (page) => {
    await tab(page, 'luizalabs', 'details').click();
    await page.waitForTimeout(400);
    await tab(page, 'luizalabs', 'info').click();
    await tab(page, 'luizalabs', 'details').click();
    assert.deepEqual(await detailTexts(page, 'luizalabs'), expected('pt-br', 'luizalabs').details);
  });
});

test('TAB-E3: an entry without automations shows the summary only', async () => {
  await withAbout('pt-br', REDUCED, async (page) => {
    assert.equal(await page.locator('#career-magalu-cloud [data-automation-link]').count(), 0);
    assert.equal((await page.locator('#career-magalu-cloud [data-career-summary]').textContent()).trim(), expected('pt-br', 'magalu-cloud').summary);
    assert.equal(await page.locator('#career-luizalabs [data-automation-link]').count(), 3);
  });
});
