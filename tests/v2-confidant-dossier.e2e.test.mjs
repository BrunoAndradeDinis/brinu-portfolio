import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';
import { DECK } from './fixtures/dossier/deck.mjs';

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


const openAbout = async (locale = 'pt-br', contextOptions = {}) => {
  const { context, page } = await openHome(locale, contextOptions);
  await page.evaluate(() => {
    const el = document.querySelector('#about');
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY + 200);
  });
  await page.waitForTimeout(1800);
  return { context, page };
};

test('C1: portrait sits left of the cards in a polygon rotated at least 3 deg', async () => {
  const { context, page } = await openAbout('pt-br', { reducedMotion: 'reduce' });
  try {
    const r = await page.evaluate(() => {
      const frame = document.querySelector('[data-about-portrait-frame]');
      const cs = getComputedStyle(frame);
      const m = new DOMMatrixReadOnly(cs.transform === 'none' ? undefined : cs.transform);
      const rotateProp = cs.rotate && cs.rotate !== 'none' ? parseFloat(cs.rotate) : 0;
      const portrait = frame.getBoundingClientRect();
      const card = document.querySelector('[data-about-card]').getBoundingClientRect();
      return { clip: cs.clipPath, angle: Math.abs(Math.atan2(m.b, m.a) * 180 / Math.PI + rotateProp), portraitRight: portrait.right, cardLeft: card.left };
    });
    assert.match(r.clip, /^polygon\(/);
    assert.notDeepEqual(r.clip.replace(/^polygon\(|\)$/g, '').split(',').map((p) => p.trim()), ['0% 0%', '100% 0%', '100% 100%', '0% 100%'], 'polygon must not be a rectangle');
    assert.ok(r.angle >= 3, `rotation ${r.angle}`);
    assert.ok(r.portraitRight <= r.cardLeft + 2, `portrait (${r.portraitRight}) must sit left of the cards (${r.cardLeft})`);
  } finally {
    await context.close();
  }
});

test('C2: right column renders bio, career and education panels in order', async () => {
  const { context, page } = await openAbout('pt-br', { reducedMotion: 'reduce' });
  try {
    const cards = await page.locator('#about [data-about-card]').evaluateAll((els) => els.map((el) => ({ kind: el.dataset.aboutCard, panel: el.hasAttribute('data-p5-panel') && el.classList.contains('p5-panel'), clip: getComputedStyle(el).clipPath, top: el.getBoundingClientRect().top })));
    assert.deepEqual(cards.map((c) => c.kind), ['bio', 'career', 'education']);
    for (const c of cards) {
      assert.equal(c.panel, true);
      assert.match(c.clip, /^polygon\(/);
    }
    assert.ok(cards[0].top < cards[1].top && cards[1].top < cards[2].top, 'cards must stack top to bottom');
  } finally {
    await context.close();
  }
});

test('C3: bio card shows two bio lines and one base line from the copy deck', async () => {
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openAbout(locale, { reducedMotion: 'reduce' });
    try {
      const lines = await page.locator('#about [data-about-card="bio"] [data-about-bio-line]').evaluateAll((els) => els.map((el) => el.textContent));
      assert.deepEqual(lines.map((l) => l.trim()), [DECK[locale].bioLine1, DECK[locale].bioLine2]);
      const base = await page.locator('#about [data-about-card="bio"] [data-about-base-line]').evaluateAll((els) => els.map((el) => el.textContent));
      assert.deepEqual(base.map((l) => l.trim()), [DECK[locale].baseLine]);
    } finally {
      await context.close();
    }
  }
});

test('C4: about has no role heading, statistics block or bioP elements', async () => {
  const { context, page } = await openAbout('pt-br', { reducedMotion: 'reduce' });
  try {
    assert.equal(await page.locator('#about [data-i18n^="about.bioP"], #about [data-i18n="about.roleHeading"], #about [data-i18n^="about.stats"]').count(), 0);
    const text = await page.locator('#about').innerText();
    assert.doesNotMatch(text, /DESENVOLVEDOR FRONTEND & CRIADOR|PAPEL ATUAL|NÚCLEO HUMANO|ARSENAL PRINCIPAL/i);
  } finally {
    await context.close();
  }
});

test('C5: career ladder shows ranks 3 to 1 with only the current role marked', async () => {
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openAbout(locale, { reducedMotion: 'reduce' });
    try {
      const steps = await page.locator('#about [data-career-entry]').evaluateAll((els) => els.map((el) => ({ id: el.id, rank: el.querySelector('[data-career-rank]').textContent.replace(/\s+/g, ' ').trim(), current: el.querySelector('[data-career-current]')?.textContent.trim() ?? null })));
      assert.deepEqual(steps.map((s) => s.id), ['career-magalu-cloud', 'career-luizalabs', 'career-magazine-luiza']);
      assert.deepEqual(steps.map((s) => s.rank), ['RANK 3', 'RANK 2', 'RANK 1']);
      assert.deepEqual(steps.map((s) => s.current), [DECK[locale].currentMarker, null, null]);
    } finally {
      await context.close();
    }
  }
});

test('C6: career steps keep the approved text and the automation links', async () => {
  const { getLocalizedCareer } = await import('../src/data/career.ts');
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openAbout(locale, { reducedMotion: 'reduce' });
    try {
      for (const entry of getLocalizedCareer(locale)) {
        const step = page.locator(`#career-${entry.id}`);
        assert.equal((await step.locator('[data-career-period]').textContent()).trim(), entry.period);
        assert.equal((await step.locator('[data-career-role]').textContent()).trim(), entry.role);
        assert.equal((await step.locator('[data-career-org]').textContent()).trim(), entry.org);
        assert.equal((await step.locator('[data-career-summary]').textContent()).trim(), entry.summary);
        const hrefs = await step.locator('[data-automation-link]').evaluateAll((els) => els.map((el) => el.getAttribute('href')));
        assert.deepEqual(hrefs, entry.automations.map((a) => a.repoUrl));
      }
    } finally {
      await context.close();
    }
  }
});

test('C7: education ladder keeps its four approved entries', async () => {
  const { getLocalizedEducation } = await import('../src/data/career.ts');
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openAbout(locale, { reducedMotion: 'reduce' });
    try {
      const expected = getLocalizedEducation(locale);
      assert.deepEqual(await page.locator('#about [data-education-entry]').evaluateAll((els) => els.map((el) => el.id)), expected.map((e) => `education-${e.id}`));
      for (const entry of expected) {
        const item = page.locator(`#education-${entry.id}`);
        assert.equal((await item.locator('[data-education-course]').textContent()).trim(), entry.course);
        assert.equal((await item.locator('[data-education-period]').textContent()).trim(), entry.period);
        assert.equal((await item.locator('[data-education-status]').textContent()).trim(), entry.status);
      }
    } finally {
      await context.close();
    }
  }
});

test('C8: locale change updates ladder text in place', async () => {
  const { getLocalizedCareer, getLocalizedEducation } = await import('../src/data/career.ts');
  const { context, page } = await openAbout('pt-br', { reducedMotion: 'reduce' });
  try {
    await page.evaluate(() => document.querySelectorAll('#about [data-career-entry], #about [data-education-entry], #about [data-career-rank]').forEach((el, i) => { el.__marker = `n${i}`; }));
    await toggleLocale(page);
    for (const entry of getLocalizedCareer('en')) {
      assert.equal((await page.locator(`#career-${entry.id} [data-career-role]`).textContent()).trim(), entry.role);
      assert.equal((await page.locator(`#career-${entry.id} [data-career-summary]`).textContent()).trim(), entry.summary);
      assert.equal((await page.locator(`#career-${entry.id} [data-career-period]`).textContent()).trim(), entry.period);
    }
    for (const entry of getLocalizedEducation('en')) {
      assert.equal((await page.locator(`#education-${entry.id} [data-education-status]`).textContent()).trim(), entry.status);
    }
    assert.equal((await page.locator('#career-magalu-cloud [data-career-current]').textContent()).trim(), DECK.en.currentMarker);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('#about [data-career-entry], #about [data-education-entry], #about [data-career-rank]')].every((el) => typeof el.__marker === 'string')), true, 'ladder nodes must survive');
  } finally {
    await context.close();
  }
});
