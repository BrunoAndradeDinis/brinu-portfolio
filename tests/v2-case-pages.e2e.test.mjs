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

const IDS = ['magalu-cloud', 'uriana', 'efood', 'aurastream'];
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

async function openPath(route, { locale = 'pt-br', viewport = { width: 1440, height: 900 }, ...contextOptions } = {}) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  const page = await context.newPage();
  await page.addInitScript((loc) => {
    window.localStorage.setItem('brinu_locale', loc);
  }, locale);
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const el = document.getElementById('intro-preloader');
    if (el) {
      el.click();
      el.remove();
    }
    window.dispatchEvent(new CustomEvent('intro-complete'));
  });
  return { context, page };
}

async function expectedCases() {
  const { getLocalizedCases } = await import('../src/data/cases.ts');
  return Object.fromEntries(LOCALES.map((locale) => [locale, getLocalizedCases(locale)]));
}

test('C1b: the build generates exactly four case pages and unknown ids return 404', async () => {
  const dirs = fs.readdirSync(path.resolve('dist/cases')).sort();
  assert.deepEqual(dirs, [...IDS].sort());
  const { context, page } = await openPath('/');
  try {
    const response = await page.goto(`${baseUrl}/cases/does-not-exist`);
    assert.equal(response.status(), 404);
  } finally {
    await context.close();
  }
});

test('C2: each case page shows the full card content in both locales', async () => {
  const cases = await expectedCases();
  for (const locale of LOCALES) {
    for (const expected of cases[locale]) {
      const { context, page } = await openPath(`/cases/${expected.id}`, { locale, reducedMotion: 'reduce' });
      try {
        const text = (selector) => page.locator(selector).first().textContent().then((value) => value.trim());
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await text('h1'), expected.title, `${locale} ${expected.id} h1`);
        assert.equal(await text('[data-case-reel]'), `[ ${expected.reelNumber} ] // ${expected.category}`);
        assert.equal(await text('[data-case-badge]'), expected.badge);
        assert.equal(await text('[data-case-subtitle]'), expected.subtitle);
        assert.equal(await text('[data-case-description]'), expected.description);
        assert.equal(await text('[data-case-challenge]'), expected.challenge);
        assert.equal(await text('[data-case-solution]'), expected.solution);
        assert.equal(await text('[data-case-metric]'), expected.metric);
        const stack = await page.locator('[data-case-stack-item]').allTextContents();
        assert.deepEqual(stack.map((item) => item.trim()), expected.stack);
        const links = await page.locator('[data-case-link]').evaluateAll((nodes) =>
          nodes.map((node) => ({ href: node.getAttribute('href'), label: node.querySelector('[data-case-link-label]').textContent.trim(), aria: node.getAttribute('aria-label') }))
        );
        assert.deepEqual(links, expected.links.map((link) => ({ href: link.url, label: link.label, aria: link.ariaLabel })));
      } finally {
        await context.close();
      }
    }
  }
});

test('C3: each case page sets its own meta and updates it on locale change', async () => {
  const cases = await expectedCases();
  const { getDictionary } = await import('../src/i18n/index.ts');
  const { caseMeta } = await import('../src/utils/case-pages.ts');
  const titles = new Set();
  for (const id of IDS) {
    const { context, page } = await openPath(`/cases/${id}`, { locale: 'pt-br', reducedMotion: 'reduce' });
    try {
      for (const locale of LOCALES) {
        if (locale === 'en') await page.locator('[data-lang-toggle]').first().click();
        await page.waitForFunction((loc) => document.documentElement.getAttribute('data-locale') === loc, locale);
        const expected = caseMeta(cases[locale].find((entry) => entry.id === id), getDictionary(locale).casePage.titleSuffix);
        const meta = await page.evaluate(() => ({
          title: document.title,
          description: document.querySelector('meta[name="description"]').content,
          ogTitle: document.querySelector('meta[property="og:title"]').content,
          ogDescription: document.querySelector('meta[property="og:description"]').content,
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
        }));
        assert.equal(meta.title, expected.title, `${id} ${locale} title`);
        assert.equal(meta.description, expected.description);
        assert.equal(meta.ogTitle, expected.title);
        assert.equal(meta.ogDescription, expected.description);
        assert.equal(meta.canonical, `/cases/${id}`);
        if (locale === 'pt-br') titles.add(meta.title);
      }
    } finally {
      await context.close();
    }
  }
  assert.equal(titles.size, IDS.length, 'titles are distinct per case');
});

test('C4b: each case page links back to its home card and to the next case', async () => {
  const { nextCaseId } = await import('../src/utils/case-pages.ts');
  for (const id of IDS) {
    const { context, page } = await openPath(`/cases/${id}`, { reducedMotion: 'reduce' });
    try {
      assert.equal(await page.locator('[data-case-back]').getAttribute('href'), `/#case-${id}`);
      assert.equal(await page.locator('[data-case-next]').getAttribute('href'), `/cases/${nextCaseId(id)}`);
    } finally {
      await context.close();
    }
  }
});

test('C6: case page text updates in place on locale change', async () => {
  const cases = await expectedCases();
  const { context, page } = await openPath('/cases/uriana', { locale: 'pt-br', reducedMotion: 'reduce' });
  try {
    await page.evaluate(() => { window.__marker = 'kept'; });
    const before = await page.locator('[data-case-description]').textContent();
    await page.locator('[data-lang-toggle]').first().click();
    const english = cases.en.find((c) => c.id === 'uriana');
    await page.waitForFunction((text) => document.querySelector('[data-case-description]').textContent.trim() === text, english.description);
    assert.notEqual(english.description, before.trim());
    assert.equal((await page.locator('h1').textContent()).trim(), english.title);
    assert.equal(await page.evaluate(() => window.__marker), 'kept', 'no reload happened');
    assert.equal((await page.locator('[data-case-description]').textContent()).trim(), cases.en.find((c) => c.id === 'uriana').description);
    assert.equal((await page.locator('[data-case-back]').textContent()).trim(), '← BACK TO PROJECTS');
    assert.equal((await page.locator('[data-case-next]').textContent()).trim(), 'NEXT CASE →');
  } finally {
    await context.close();
  }
});

test('C5: every home card links to its case page in both locales', async () => {
  for (const locale of LOCALES) {
    const { context, page } = await openPath('/', { locale, reducedMotion: 'reduce' });
    try {
      const label = locale === 'pt-br' ? 'ABRIR CASE' : 'OPEN CASE';
      for (const id of IDS) {
        const link = page.locator(`#case-${id} a[data-case-open]`);
        assert.equal(await link.count(), 1, `${id} has one open-case link`);
        assert.equal(await link.getAttribute('href'), `/cases/${id}`);
        assert.equal((await link.textContent()).replace(/\s+/g, ' ').trim().replace(/\s*→$/, ''), label);
      }
    } finally {
      await context.close();
    }
  }
});

test('C13: card title and page h1 share the view transition name', async () => {
  const { context, page } = await openPath('/', { reducedMotion: 'reduce' });
  try {
    for (const id of IDS) {
      const homeName = await page.locator(`#case-${id} [data-case-title]`).evaluate((el) => getComputedStyle(el).viewTransitionName);
      assert.equal(homeName, `case-title-${id}`);
      const detail = await context.newPage();
      await detail.goto(`${baseUrl}/cases/${id}`, { waitUntil: 'networkidle' });
      const pageName = await detail.locator('h1').evaluate((el) => getComputedStyle(el).viewTransitionName);
      assert.equal(pageName, `case-title-${id}`);
      await detail.close();
    }
  } finally {
    await context.close();
  }
});

async function freshHome(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', ...options });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  return { context, page };
}

async function clickAndWaitFor(page, locator, pathname) {
  await locator.click();
  await page.waitForFunction((target) => window.location.pathname === target, pathname);
  await page.waitForLoadState('networkidle');
}

async function openMenuLink(page, id) {
  await page.locator('#cockpit-trigger-btn').click();
  const link = page.locator(`[data-cockpit-link="${id}"]`);
  await link.waitFor({ state: 'visible' });
  return link;
}

test('C7: navigation between pages keeps the window marker', async () => {
  const { context, page } = await freshHome();
  try {
    await page.evaluate(() => { window.__marker = 'alive'; });
    await clickAndWaitFor(page, page.locator('#case-uriana a[data-case-open]'), '/cases/uriana');
    await clickAndWaitFor(page, page.locator('[data-case-next]'), '/cases/efood');
    await page.locator('[data-case-back]').click();
    await page.waitForFunction(() => window.location.pathname === '/' && window.location.hash === '#case-efood');
    await clickAndWaitFor(page, page.locator('[data-footer-stickers-link]'), '/stickers');
    await clickAndWaitFor(page, await openMenuLink(page, 'whoami'), '/whoami');
    assert.equal(await page.evaluate(() => window.__marker), 'alive', 'the document was never reloaded');
  } finally {
    await context.close();
  }
});

test('C9: nav, menu and alert persist and the active blade updates', async () => {
  const { context, page } = await freshHome();
  try {
    await page.evaluate(() => {
      document.getElementById('comic-nav-header').__kept = true;
      document.querySelector('astro-island[component-url*="CockpitMenu"]').__kept = true;
      document.querySelector('astro-island[component-url*="CiladaAlert"]').__kept = true;
    });
    const kept = () => page.evaluate(() => ({
      nav: document.getElementById('comic-nav-header').__kept === true,
      menu: document.querySelector('astro-island[component-url*="CockpitMenu"]').__kept === true,
      alert: document.querySelector('astro-island[component-url*="CiladaAlert"]').__kept === true,
    }));
    await clickAndWaitFor(page, page.locator('#case-uriana a[data-case-open]'), '/cases/uriana');
    assert.deepEqual(await kept(), { nav: true, menu: true, alert: true });
    let link = await openMenuLink(page, 'works');
    assert.equal(await link.getAttribute('data-active-blade'), 'true', 'case pages mark the works blade');
    await page.keyboard.press('Escape');
    await clickAndWaitFor(page, await openMenuLink(page, 'whoami'), '/whoami');
    assert.deepEqual(await kept(), { nav: true, menu: true, alert: true });
    link = await openMenuLink(page, 'whoami');
    assert.equal(await link.getAttribute('data-active-blade'), 'true');
    assert.equal(await page.locator('[data-cockpit-link="works"]').getAttribute('data-active-blade'), 'false');
  } finally {
    await context.close();
  }
});

test('C10: the intro runs only on the first load of the home', async () => {
  const introState = (page) => page.evaluate(() => ({
    preloader: document.getElementById('intro-preloader') !== null,
    marks: performance.getEntriesByName('intro:start').length,
    locked: document.documentElement.classList.contains('lenis-stopped'),
  }));

  for (const route of ['/cases/uriana', '/stickers', '/whoami']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    try {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
      assert.deepEqual(await introState(page), { preloader: false, marks: 0, locked: false }, `${route} skips the intro`);
    } finally {
      await context.close();
    }
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => performance.getEntriesByName('intro:start').length === 1);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('intro-preloader') && !document.documentElement.classList.contains('lenis-stopped'), null, { timeout: 8000 });
    await page.waitForLoadState('networkidle');
    await clickAndWaitFor(page, page.locator('#case-uriana a[data-case-open]'), '/cases/uriana');
    assert.deepEqual(await introState(page), { preloader: false, marks: 1, locked: false });
    await clickAndWaitFor(page, page.locator('[data-case-back]'), '/');
    assert.deepEqual(await introState(page), { preloader: false, marks: 1, locked: false }, 'returning home does not replay the intro');
  } finally {
    await context.close();
  }

  const stickersFirst = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const stickersPage = await stickersFirst.newPage();
  try {
    await stickersPage.goto(`${baseUrl}/stickers`, { waitUntil: 'networkidle' });
    await stickersPage.evaluate(() => {
      const link = document.createElement('a');
      link.href = '/';
      link.textContent = 'home';
      document.body.append(link);
      link.click();
    });
    await stickersPage.waitForFunction(() => window.location.pathname === '/');
    await stickersPage.waitForLoadState('networkidle');
    assert.deepEqual(await introState(stickersPage), { preloader: false, marks: 0, locked: false }, 'home reached by navigation skips the intro');
  } finally {
    await stickersFirst.close();
  }
});

async function expectInitialized(page, locale) {
  const label = await page.evaluate(() => document.querySelector('[data-lang-toggle] [data-lang-toggle-label]')?.textContent?.trim());
  assert.equal(label, locale === 'en' ? 'EN' : 'PT-BR', 'the stored locale is applied to the toggle');
  assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-locale')), locale);
  const badTitles = await page.evaluate(() => [...document.querySelectorAll('[data-p5-title]')].filter((el) => el.querySelectorAll('[data-p5-char]').length === 0).length);
  assert.equal(badTitles, 0, 'ransom titles are rendered');
  await page.locator('#comic-nav-logo').hover();
  await page.waitForFunction(() => document.querySelector('[data-nav-avatar]').dataset.stickerActive === 'true');
  await page.mouse.move(700, 500);
  await page.locator('#cockpit-trigger-btn').click();
  await page.locator('[data-cockpit-link="works"]').waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  await page.locator('[data-cockpit-link="works"]').waitFor({ state: 'hidden' });
}

test('C11: the page is fully initialized after navigation', async () => {
  const { context, page } = await freshHome({ locale: 'en-US' });
  try {
    await page.evaluate(() => window.localStorage.setItem('brinu_locale', 'en'));
    await page.reload({ waitUntil: 'networkidle' });
    await clickAndWaitFor(page, page.locator('#case-uriana a[data-case-open]'), '/cases/uriana');
    await expectInitialized(page, 'en');
    assert.equal(await page.evaluate(() => window.scrollY), 0);
    assert.equal((await page.locator('[data-case-back]').textContent()).trim(), '← BACK TO PROJECTS');

    await page.locator('[data-case-back]').click();
    await page.waitForFunction(() => window.location.pathname === '/' && window.location.hash === '#case-uriana');
    await page.waitForLoadState('networkidle');
    await expectInitialized(page, 'en');
    const gap = await page.evaluate(() => {
      const card = document.getElementById('case-uriana').getBoundingClientRect().top;
      const avatar = document.querySelector('#comic-nav-logo [data-nav-avatar]').getBoundingClientRect().bottom;
      const trigger = document.getElementById('cockpit-trigger-btn').getBoundingClientRect().bottom;
      return card - Math.max(avatar, trigger);
    });
    assert.ok(gap >= 8, `the target stops at least 8px below the nav controls (gap ${gap})`);
  } finally {
    await context.close();
  }

  const stickers = await freshHome();
  try {
    await clickAndWaitFor(stickers.page, await openMenuLink(stickers.page, 'whoami'), '/whoami');
    await stickers.page.keyboard.press('Escape');
    await stickers.page.locator('#comic-nav-logo').hover();
    await stickers.page.waitForFunction(() => document.querySelector('[data-nav-avatar]').dataset.stickerActive === 'true');
    const terminal = await stickers.page.locator('#terminal-output').textContent();
    assert.ok(terminal.trim().length > 0, 'the whoami terminal runs after navigation');
  } finally {
    await stickers.context.close();
  }
});

test('C12: back and forward swap pages and stay initialized', async () => {
  const { context, page } = await freshHome();
  try {
    await page.evaluate(() => { window.__marker = 'alive'; });
    await clickAndWaitFor(page, page.locator('#case-efood a[data-case-open]'), '/cases/efood');
    await clickAndWaitFor(page, page.locator('[data-case-next]'), '/cases/aurastream');
    await page.goBack();
    await page.waitForFunction(() => window.location.pathname === '/cases/efood' && document.querySelector('h1')?.textContent.trim() === 'eFood');
    await page.goBack();
    await page.waitForFunction(() => window.location.pathname === '/' && document.getElementById('case-efood') !== null);
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('#case-efood [data-case-title]').count(), 1);
    await page.goForward();
    await page.waitForFunction(() => window.location.pathname === '/cases/efood' && document.querySelector('h1')?.textContent.trim() === 'eFood');
    await expectInitialized(page, 'pt-br');
    assert.equal(await page.evaluate(() => window.__marker), 'alive', 'history traversal never reloaded the document');
  } finally {
    await context.close();
  }
});

test('C15: with JavaScript disabled links navigate and pages are readable', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/`);
    await Promise.all([page.waitForURL(/\/cases\/uriana$/), page.locator('#case-uriana a[data-case-open]').click()]);
    assert.equal((await page.locator('h1').textContent()).trim(), 'Uriana');
    await Promise.all([page.waitForURL(/\/cases\/efood$/), page.locator('[data-case-next]').click()]);
    assert.ok((await page.locator('[data-case-description]').textContent()).trim().length > 40);
    for (const route of ['/stickers', '/whoami', '/cases/magalu-cloud']) {
      await page.goto(`${baseUrl}${route}`);
      assert.ok((await page.locator('main').innerText()).trim().length > 40, `${route} is readable`);
    }
    assert.equal(await page.evaluate(() => document.getElementById('intro-preloader') === null), true);
  } finally {
    await context.close();
  }
});

test('C21: a navigation during another one ends on the latest page', async () => {
  const { context, page } = await freshHome();
  try {
    await page.locator('#case-uriana a[data-case-open]').click();
    await page.evaluate(() => {
      const link = document.createElement('a');
      link.href = '/cases/efood';
      link.textContent = 'efood';
      document.body.append(link);
      link.click();
    });
    await page.waitForFunction(() => window.location.pathname === '/cases/efood');
    await page.waitForLoadState('networkidle');
    assert.equal((await page.locator('h1').textContent()).trim(), 'eFood');
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => /is-(covering|leaving|wiping)/.test(document.getElementById('p5-wipe-overlay').className)), false);
  } finally {
    await context.close();
  }
});

test('C22: a direct case load with a hash skips the intro and clears the nav', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/cases/uriana#case-uriana`, { waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => document.getElementById('intro-preloader') === null), true);
    const gap = await page.evaluate(() => {
      const target = document.getElementById('case-uriana').getBoundingClientRect().top;
      const bottoms = [document.querySelector('#comic-nav-logo [data-nav-avatar]'), document.getElementById('cockpit-trigger-btn')].map((el) => el.getBoundingClientRect().bottom);
      return target - Math.max(...bottoms);
    });
    assert.ok(gap >= 8, `the target stops at least 8px below the nav controls (gap ${gap})`);
  } finally {
    await context.close();
  }
});

test('C23: home sections initialize once after home to case to home', async () => {
  const { context, page } = await freshHome();
  try {
    await clickAndWaitFor(page, page.locator('#case-uriana a[data-case-open]'), '/cases/uriana');
    await clickAndWaitFor(page, page.locator('[data-case-back]'), '/');
    await page.waitForLoadState('networkidle');
    const state = await page.evaluate(() => ({
      navScrollBound: document.getElementById('comic-nav-header').dataset.scrollBound,
      logoBound: document.getElementById('comic-nav-logo').dataset.stickerBound,
      stickers: document.querySelectorAll('#comic-nav-logo [data-nav-sticker]').length,
      p5Bound: [...document.querySelectorAll('[data-p5-title]')].every((el) => el.dataset.p5Bound === 'true'),
      chars: [...document.querySelectorAll('[data-p5-title]')].map((el) => el.querySelectorAll('[data-p5-char]').length),
      arcanaBound: document.querySelectorAll('[data-arcana-deck]').length,
    }));
    assert.equal(state.stickers, 1, 'one sticker image in the logo');
    assert.equal(state.p5Bound, true);
    assert.ok(state.chars.every((count) => count > 0));
    const scrollTriggers = await page.evaluate(() => window.ScrollTrigger?.getAll?.().length ?? -1);
    assert.ok(scrollTriggers === -1 || scrollTriggers < 40, `no runaway ScrollTrigger count (${scrollTriggers})`);
    const hits = await page.evaluate(async () => {
      let toggles = 0;
      window.addEventListener('cockpit:open', () => { toggles += 1; });
      document.getElementById('cockpit-trigger-btn').click();
      await new Promise((resolve) => setTimeout(resolve, 100));
      return toggles;
    });
    assert.equal(hits, 1, 'one click opens the menu once');
  } finally {
    await context.close();
  }
});

test('C8: the red and black wipe crosses during navigation', async () => {
  const { context, page } = await freshHome({ reducedMotion: 'no-preference' });
  try {
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('intro-preloader'), null, { timeout: 8000 });
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      const overlay = document.getElementById('p5-wipe-overlay');
      const blade = overlay.querySelector('.p5-wipe-blade-red');
      const probe = { wiping: false, coveredAtSwap: false, positions: [], swapped: false };
      window.__wipe = probe;
      new MutationObserver(() => {
        if (overlay.classList.contains('is-covering') || overlay.classList.contains('is-wiping')) probe.wiping = true;
      }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
      document.addEventListener('astro:after-swap', () => {
        probe.swapped = true;
        const rect = document.getElementById('p5-wipe-overlay').querySelector('.p5-wipe-blade-red').getBoundingClientRect();
        probe.coveredAtSwap = rect.left < window.innerWidth / 2 && rect.right > window.innerWidth / 2;
      });
      const sample = () => {
        const rect = blade.getBoundingClientRect();
        probe.positions.push(Math.round(rect.left));
        if (!probe.swapped || probe.positions.length < 400) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.locator('#case-uriana a[data-case-open]').click();
    await page.waitForFunction(() => window.location.pathname === '/cases/uriana' && window.__wipe.swapped);
    await page.waitForTimeout(600);
    const probe = await page.evaluate(() => window.__wipe);
    assert.equal(probe.wiping, true, 'the wipe overlay was activated');
    assert.equal(probe.coveredAtSwap, true, 'the blade covered the screen center when the new page was swapped in');
    assert.ok(Math.min(...probe.positions) < Math.max(...probe.positions) - 300, `the blade moved across the screen (${probe.positions.slice(0, 20).join(',')})`);
    assert.equal(await page.evaluate(() => /is-(covering|leaving|wiping)/.test(document.getElementById('p5-wipe-overlay').className)), false);
    assert.equal((await page.locator('h1').textContent()).trim(), 'Uriana');
  } finally {
    await context.close();
  }
});

test('C14: reduced motion swaps pages with no wipe', async () => {
  const { context, page } = await freshHome({ reducedMotion: 'reduce' });
  try {
    await page.evaluate(() => {
      const overlay = document.getElementById('p5-wipe-overlay');
      const probe = { wiping: false, animations: 0, clickAt: 0, swapAt: 0 };
      window.__reduced = probe;
      new MutationObserver(() => {
        if (/is-(covering|leaving|wiping)/.test(overlay.className)) probe.wiping = true;
      }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
      document.addEventListener('click', () => { probe.clickAt = performance.now(); }, { capture: true });
      document.addEventListener('astro:after-swap', () => { probe.swapAt = performance.now(); });
      const sample = () => {
        probe.animations += document.getAnimations().filter((animation) => {
          const effect = animation.effect;
          return effect && 'pseudoElement' in effect && String(effect.pseudoElement || '').startsWith('::view-transition');
        }).length;
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.locator('#case-uriana a[data-case-open]').click();
    await page.waitForFunction(() => window.location.pathname === '/cases/uriana' && document.querySelector('h1')?.textContent.trim() === 'Uriana');
    await page.waitForTimeout(500);
    const probe = await page.evaluate(() => window.__reduced);
    const elapsed = probe.swapAt - probe.clickAt;
    assert.equal(probe.wiping, false, 'no wipe overlay activation');
    assert.equal(probe.animations, 0, 'no view transition animation ran');
    assert.ok(probe.swapAt > 0 && elapsed < 300, `the swap was immediate (${elapsed} ms)`);
  } finally {
    await context.close();
  }
});

test('C24: rapid double navigation leaves the scroll unlocked', async () => {
  const { context, page } = await freshHome({ reducedMotion: 'no-preference' });
  try {
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('intro-preloader'), null, { timeout: 8000 });
    await page.waitForLoadState('networkidle');
    await page.locator('#case-uriana a[data-case-open]').click();
    await page.evaluate(() => {
      const link = document.createElement('a');
      link.href = '/stickers';
      link.textContent = 'stickers';
      document.body.append(link);
      link.click();
    });
    await page.waitForFunction(() => window.location.pathname === '/stickers' && document.querySelector('h1')?.textContent.trim().length > 0);
    await page.waitForTimeout(700);
    const state = await page.evaluate(async () => {
      window.scrollTo(0, 400);
      await new Promise((resolve) => setTimeout(resolve, 150));
      return {
        wiping: /is-(covering|leaving|wiping)/.test(document.getElementById('p5-wipe-overlay').className),
        locked: document.documentElement.classList.contains('lenis-stopped'),
        overflow: getComputedStyle(document.documentElement).overflow,
        scrollY: window.scrollY,
      };
    });
    assert.equal(state.wiping, false);
    assert.equal(state.locked, false);
    assert.notEqual(state.overflow, 'hidden');
    assert.ok(state.scrollY > 0, 'the page scrolls');
  } finally {
    await context.close();
  }
});
