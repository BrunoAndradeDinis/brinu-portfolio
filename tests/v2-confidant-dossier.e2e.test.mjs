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

test('C9: arsenal lives in its own section after about with three domains and fifteen skills', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    const info = await page.evaluate(() => {
      const about = document.getElementById('about');
      const arsenal = document.getElementById('arsenal');
      return {
        exists: !!arsenal,
        nested: !!arsenal && about.contains(arsenal),
        aboutHasSkills: !!about.querySelector('[data-skill-vignette], [data-skills-matrix]'),
        follows: !!arsenal && (() => { const order = [...document.querySelectorAll('#main-content > section')].map((el) => el.id); return order.indexOf('arsenal') === order.indexOf('about') + 1; })(),
        domains: arsenal ? arsenal.querySelectorAll('[data-skill-vignette]').length : 0,
        skills: arsenal ? arsenal.querySelectorAll('[data-skill-badge]').length : 0,
        counter: arsenal?.querySelector('[data-arsenal-counter]')?.textContent.trim(),
      };
    });
    assert.equal(info.exists, true);
    assert.equal(info.nested, false);
    assert.equal(info.aboutHasSkills, false);
    assert.equal(info.follows, true, '#arsenal must directly follow #about');
    assert.equal(info.domains, 3);
    assert.equal(info.skills, 15);
    assert.match(info.counter, /3 .*15/);
  } finally {
    await context.close();
  }
});

test('C10: menu keeps six items without the arsenal', async () => {
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    await page.locator('#cockpit-trigger-btn').dispatchEvent('click');
    await page.locator('#cockpit-menu-overlay a[href="#lab"]').waitFor({ state: 'visible', timeout: 8000 });
    const hrefs = await page.locator('#cockpit-menu-overlay nav a').evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    assert.deepEqual(hrefs, ['#hero', '#works', '#about', '#lab', '#contact', '/whoami']);
    assert.equal(hrefs.includes('#arsenal'), false);
  } finally {
    await context.close();
  }
});

test('C11: arsenal evidence chip scrolls to the case below the nav', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    const chip = page.locator('#arsenal a[href="#case-uriana"]').first();
    await chip.scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await chip.dispatchEvent('click');
    await page.waitForTimeout(2200);
    const m = await page.evaluate(() => {
      const target = document.getElementById('case-uriana').getBoundingClientRect().top;
      const avatar = document.querySelector('#comic-nav-logo [data-nav-avatar]');
      const trigger = document.getElementById('cockpit-trigger-btn');
      return { target, navBottom: Math.max(avatar.getBoundingClientRect().bottom, trigger.getBoundingClientRect().bottom) };
    });
    assert.ok(m.target >= m.navBottom && m.target <= m.navBottom + 90, `case top ${m.target} vs nav bottom ${m.navBottom}`);
  } finally {
    await context.close();
  }
});

const sampleInit = () => {
  window.__clip = [];
  window.__period = [];
  window.__org = [];
  window.__aria = [];
  const start = performance.now();
  const loop = () => {
    const cards = [...document.querySelectorAll('#about [data-about-card]')];
    if (cards.length) {
      window.__clip.push({ t: performance.now() - start, clips: cards.map((c) => getComputedStyle(c).clipPath), inline: cards.map((c) => c.style.clipPath), opacity: cards.map((c) => getComputedStyle(c).opacity) });
    }
    const period = document.querySelector('#career-magalu-cloud [data-career-period]');
    const org = document.querySelector('#career-magalu-cloud [data-career-org]');
    if (period) {
      const last = window.__period[window.__period.length - 1];
      if (!last || last.text !== period.textContent) {
        window.__period.push({ t: performance.now() - start, text: period.textContent, role: period.getAttribute('role'), label: period.getAttribute('aria-label') });
      }
    }
    if (org) {
      const last = window.__org[window.__org.length - 1];
      if (!last || last.text !== org.textContent) window.__org.push({ t: performance.now() - start, text: org.textContent });
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};

const gotoAbout = async (page) => {
  await page.evaluate(() => {
    const el = document.querySelector('#about');
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY + 250);
  });
};

test('C12: dossier cards enter once with a staggered diagonal clip-path wipe', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    await page.addInitScript(sampleInit);
    await page.reload({ waitUntil: 'networkidle' });
    await dismissIntroIfPresent(page);
    await gotoAbout(page);
    await page.waitForTimeout(3200);
    const { clip } = await page.evaluate(() => ({ clip: window.__clip }));
    const last = clip[clip.length - 1];
    last.clips.forEach((c, i) => {
      assert.match(c, /^polygon\(/, `card ${i} resting clip-path`);
      assert.equal(last.inline[i], '', `card ${i} must not keep an inline clip-path`);
      assert.equal(last.opacity[i], '1', `card ${i} full opacity`);
    });
    const finalClips = last.clips;
    const settled = [0, 1, 2].map((i) => clip.find((s) => s.t > 0 && s.clips[i] === finalClips[i] && clip.slice(clip.indexOf(s)).every((x) => x.clips[i] === finalClips[i]))?.t);
    for (let i = 0; i < 3; i++) assert.ok(settled[i] !== undefined, `card ${i} must settle`);
    assert.ok(clip.some((s) => s.clips.some((c, i) => c !== finalClips[i])), 'cards must animate from a different polygon');
    assert.ok(clip.some((s) => s.clips[1].includes('-14%')), 'the wipe must start from the collapsed diagonal polygon');
    assert.ok(settled[1] - settled[0] >= 100 && settled[2] - settled[1] >= 100, `cards must settle staggered, got ${settled}`);

    const before = clip.length;
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
    await gotoAbout(page);
    await page.waitForTimeout(1200);
    const after = (await page.evaluate(() => window.__clip)).slice(before);
    assert.ok(after.every((s) => s.clips.every((c, i) => c === finalClips[i])), 'the wipe must not replay');
  } finally {
    await context.close();
  }
});

test('C13: career fields decode once within 1.2 s ending on the exact text', async () => {
  const { getLocalizedCareer } = await import('../src/data/career.ts');
  const expected = getLocalizedCareer('pt-br').find((e) => e.id === 'magalu-cloud');
  const { context, page } = await openHome('pt-br');
  try {
    await page.addInitScript(sampleInit);
    await page.reload({ waitUntil: 'networkidle' });
    await dismissIntroIfPresent(page);
    await gotoAbout(page);
    await page.waitForTimeout(3500);
    const { period, org } = await page.evaluate(() => ({ period: window.__period, org: window.__org }));
    for (const [name, series, final] of [['period', period, expected.period], ['org', org, expected.org]]) {
      assert.equal(series[series.length - 1].text, final, `${name} must end on the exact text`);
      const intermediates = series.filter((s) => s.text !== final);
      assert.ok(intermediates.length >= 3, `${name} must show scrambled steps, saw ${intermediates.length}`);
      const decodeStart = series.find((s) => s.text !== final && s !== series[0])?.t ?? series[1].t;
      const decodeEnd = series[series.length - 1].t;
      assert.ok(decodeEnd - decodeStart <= 1500, `${name} decode took ${decodeEnd - decodeStart}ms`);
    }
    const count = period.length;
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await gotoAbout(page);
    await page.waitForTimeout(1800);
    assert.equal((await page.evaluate(() => window.__period)).length, count, 'the decode must not replay');
  } finally {
    await context.close();
  }
});

test('C14: locale change during decode ends on the new locale text', async () => {
  const { getLocalizedCareer } = await import('../src/data/career.ts');
  const en = getLocalizedCareer('en').find((e) => e.id === 'magalu-cloud');
  const { context, page } = await openHome('pt-br');
  try {
    await page.addInitScript(sampleInit);
    await page.reload({ waitUntil: 'networkidle' });
    await dismissIntroIfPresent(page);
    await gotoAbout(page);
    await page.waitForFunction(() => window.__period.length > 1, null, { timeout: 8000 });
    await page.locator('#nav-lang-toggle-btn').dispatchEvent('click');
    await page.waitForTimeout(3000);
    assert.equal((await page.locator('#career-magalu-cloud [data-career-period]').textContent()).trim(), en.period);
    assert.equal((await page.locator('#career-magalu-cloud [data-career-org]').textContent()).trim(), en.org);
    const tail = (await page.evaluate(() => window.__period)).filter((s) => s.t > 0).slice(-3).map((s) => s.text);
    assert.equal(tail[tail.length - 1], en.period);
    assert.equal(await page.locator('#career-magalu-cloud [data-career-period]').getAttribute('aria-label'), null, 'the decode label is cleared');
  } finally {
    await context.close();
  }
});

test('C15: reduced motion renders cards and fields in their final state', async () => {
  const { getLocalizedCareer } = await import('../src/data/career.ts');
  const expected = getLocalizedCareer('pt-br').find((e) => e.id === 'magalu-cloud');
  const { context, page } = await openHome('pt-br', { reducedMotion: 'reduce' });
  try {
    await page.addInitScript(sampleInit);
    await page.reload({ waitUntil: 'networkidle' });
    await dismissIntroIfPresent(page);
    await gotoAbout(page);
    await page.waitForTimeout(1800);
    const { clip, period, org } = await page.evaluate(() => ({ clip: window.__clip, period: window.__period, org: window.__org }));
    for (const s of clip) {
      s.clips.forEach((c, i) => {
        assert.match(c, /^polygon\(/);
        assert.equal(s.inline[i], '', 'no inline clip-path in reduced motion');
        assert.equal(s.opacity[i], '1');
        assert.ok(!c.includes('-14%'), 'no collapsed wipe polygon');
      });
    }
    assert.equal(period.length, 1, 'the period must never change after first paint');
    assert.equal(period[0].text, expected.period);
    assert.equal(org.length, 1);
    assert.equal(org[0].text, expected.org);
  } finally {
    await context.close();
  }
});

test('C18: scrambled characters are not exposed to assistive technology', async () => {
  const { getLocalizedCareer } = await import('../src/data/career.ts');
  const expected = getLocalizedCareer('pt-br').find((e) => e.id === 'magalu-cloud');
  const { context, page } = await openHome('pt-br');
  try {
    await page.addInitScript(sampleInit);
    await page.reload({ waitUntil: 'networkidle' });
    await dismissIntroIfPresent(page);
    await gotoAbout(page);
    await page.waitForTimeout(3500);
    const period = await page.evaluate(() => window.__period);
    const scrambled = period.filter((s) => s.text !== expected.period);
    assert.ok(scrambled.length >= 3, 'precondition: scrambled steps were observed');
    for (const step of scrambled) {
      assert.equal(step.role, 'img', 'a scrambling field exposes one labelled image role');
      assert.equal(step.label, expected.period, 'the accessible name is the final text');
    }
    const live = await page.locator('#career-magalu-cloud [data-career-period]').evaluate((el) => [el.getAttribute('role'), el.getAttribute('aria-label')]);
    assert.deepEqual(live, [null, null], 'the decode role and label are cleared once finished');
  } finally {
    await context.close();
  }
});
