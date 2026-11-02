import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';
import { PROFILE } from '../src/data/profile.ts';
import {
  PROJECT_CASES,
  getLocalizedCases,
  getLocalizedSkillCategories,
} from '../src/data/cases.ts';
import { DICTIONARIES, ptBrDict, enDict } from '../src/i18n/dictionaries.ts';
import {
  sanitizeLocale,
  localeToHtmlLang,
  readStoredLocale,
  writeStoredLocale,
  resolveTranslationKey,
  getLocale,
  setLocale,
  toggleLocale,
} from '../src/i18n/index.ts';

function collectKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const keyPath = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v, keyPath));
    } else {
      keys.push(keyPath);
    }
  }
  return keys.sort();
}

function collectValues(obj) {
  const values = [];
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      values.push(...collectValues(v));
    } else if (Array.isArray(v)) {
      values.push(...v);
    } else {
      values.push(v);
    }
  }
  return values;
}

function walkFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

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
  });
  await page.waitForFunction(
    () => !document.querySelector('astro-island[component-url*="CockpitMenu"][ssr]')
  );
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
  if (browser) {
    await browser.close();
  }
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('C1: profile.ts exports canonical Franca / SP and official contact metadata', () => {
  assert.equal(PROFILE.fullName, 'Bruno de Andrade Dinis');
  assert.equal(PROFILE.handle, 'Brinu');
  assert.equal(PROFILE.birthYear, 1996);
  assert.equal(PROFILE.location.city, 'Franca');
  assert.equal(PROFILE.location.state, 'SP');
  assert.equal(PROFILE.location.label, 'Franca / SP');
  assert.equal(PROFILE.location.remoteLabel['pt-br'], 'Franca / SP • Remoto');
  assert.equal(PROFILE.location.remoteLabel.en, 'Franca / SP • Remote');
  assert.equal(PROFILE.email, 'bruno.a.dinis96@gmail.com');
  assert.equal(PROFILE.linkedin.handle, '/in/bruno-de-andrade-dinis');
  assert.equal(
    PROFILE.linkedin.url,
    'https://www.linkedin.com/in/bruno-de-andrade-dinis'
  );
  assert.equal(PROFILE.github.handle, '@BrunoAndradeDinis');
  assert.equal(PROFILE.github.url, 'https://github.com/BrunoAndradeDinis');
});

test('C2: zero legacy Campinas or mismatched contact strings in src/', () => {
  const srcFiles = walkFiles(path.resolve('src'));
  assert.ok(srcFiles.length > 15);

  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lower = content.toLowerCase();
    assert.equal(
      lower.includes('campinas'),
      false,
      `Found forbidden "Campinas" in ${file}`
    );
    assert.equal(
      lower.includes('bruno.andrade.dinis@gmail.com'),
      false,
      `Found legacy email in ${file}`
    );
    assert.equal(
      lower.includes('linkedin.com/in/brunoandradedinis'),
      false,
      `Found legacy LinkedIn URL in ${file}`
    );
  }
});

test('C3: Hero, Contact, Footer, /whoami, and telemetry reference canonical profile data', async () => {
  const heroSrc = fs.readFileSync(path.resolve('src/components/ComicHero.astro'), 'utf8');
  const contactSrc = fs.readFileSync(path.resolve('src/components/Contact.astro'), 'utf8');
  const footerSrc = fs.readFileSync(path.resolve('src/components/BebopFooter.astro'), 'utf8');
  const whoamiSrc = fs.readFileSync(path.resolve('src/pages/whoami.astro'), 'utf8');
  const telemetrySrc = fs.readFileSync(path.resolve('src/utils/telemetry.ts'), 'utf8');

  for (const [name, src] of [
    ['ComicHero.astro', heroSrc],
    ['Contact.astro', contactSrc],
    ['BebopFooter.astro', footerSrc],
    ['whoami.astro', whoamiSrc],
    ['telemetry.ts', telemetrySrc],
  ]) {
    assert.ok(src.includes('PROFILE'), `${name} must import/use PROFILE`);
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

  const homeHtml = await page.content();
  assert.ok(homeHtml.includes('Franca / SP'));
  assert.ok(homeHtml.includes('bruno.a.dinis96@gmail.com'));
  assert.ok(homeHtml.includes('https://www.linkedin.com/in/bruno-de-andrade-dinis'));
  assert.ok(homeHtml.includes('/in/bruno-de-andrade-dinis'));
  assert.ok(homeHtml.includes('https://github.com/BrunoAndradeDinis'));

  await page.goto(`${baseUrl}/whoami`, { waitUntil: 'networkidle' });
  const whoamiText = await page.locator('body').innerText();
  assert.ok(whoamiText.toUpperCase().includes('FRANCA / SP'));
  assert.equal(whoamiText.toLowerCase().includes('campinas'), false);

  await context.close();
});

test('T2: getLocalizedCases and getLocalizedSkillCategories provide matching pt-br and en structures', () => {
  const ptCases = getLocalizedCases('pt-br');
  const enCases = getLocalizedCases('en');

  assert.equal(ptCases.length, 4);
  assert.equal(enCases.length, 4);
  assert.deepEqual(
    ptCases.map((c) => c.id),
    enCases.map((c) => c.id)
  );
  assert.equal(PROJECT_CASES.length, 4);
  assert.notEqual(ptCases[0].description, enCases[0].description);

  const ptSkills = getLocalizedSkillCategories('pt-br');
  const enSkills = getLocalizedSkillCategories('en');
  assert.equal(ptSkills.length, 4);
  assert.equal(enSkills.length, 4);
  assert.deepEqual(
    ptSkills.map((s) => s.id),
    enSkills.map((s) => s.id)
  );
  assert.notEqual(ptSkills[0].subtitle, enSkills[0].subtitle);
});

test('C4: pt-br and en dictionaries have 100% key parity and non-empty translations', () => {
  const ptKeys = collectKeys(ptBrDict);
  const enKeys = collectKeys(enDict);

  assert.deepEqual(ptKeys, enKeys);
  assert.ok(ptKeys.length > 60);

  for (const val of collectValues(ptBrDict)) {
    assert.equal(typeof val, 'string');
    assert.ok(val.trim().length > 0);
  }
  for (const val of collectValues(enDict)) {
    assert.equal(typeof val, 'string');
    assert.ok(val.trim().length > 0);
  }

  assert.ok(DICTIONARIES['pt-br'].footer.engineeredIn.includes('FRANCA / SP'));
  assert.ok(DICTIONARIES.en.footer.engineeredIn.includes('FRANCA / SP'));
  assert.ok(!JSON.stringify(DICTIONARIES).toLowerCase().includes('campinas'));
});

test('C5: default locale initializes to pt-br with html lang pt-BR', async () => {
  assert.equal(readStoredLocale(null), 'pt-br');
  assert.equal(localeToHtmlLang('pt-br'), 'pt-BR');
  assert.equal(localeToHtmlLang('en'), 'en');
  assert.equal(
    resolveTranslationKey('pt-br', 'contact.stationBaseValue'),
    'Franca / SP • Remoto'
  );
  assert.equal(
    resolveTranslationKey('en', 'contact.stationBaseValue'),
    'Franca / SP • Remote'
  );

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

  const htmlLang = await page.getAttribute('html', 'lang');
  assert.equal(htmlLang, 'pt-BR');
  const worksTitle = await page.locator('[data-i18n="works.title"]').first().innerText();
  assert.equal(worksTitle.trim(), ptBrDict.works.title);

  await context.close();
});

test('C6: language toggle switches pt-br and en, persists to localStorage, and updates UI without reload', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await dismissIntroIfPresent(page);

  await page.evaluate(() => {
    window.__noReloadMarker = 'alive';
  });

  assert.equal(await page.getAttribute('html', 'lang'), 'pt-BR');
  assert.equal(
    (await page.locator('[data-i18n="works.title"]').first().innerText()).trim(),
    ptBrDict.works.title
  );

  await page.click('#nav-lang-toggle-btn');

  assert.equal(await page.getAttribute('html', 'lang'), 'en');
  assert.equal(
    await page.evaluate(() => window.localStorage.getItem('brinu_locale')),
    'en'
  );
  assert.equal(
    await page.evaluate(() => window.__noReloadMarker),
    'alive'
  );

  assert.equal(
    (await page.locator('[data-i18n="works.title"]').first().innerText()).trim(),
    enDict.works.title
  );
  assert.equal(
    (await page.locator('[data-i18n="contact.stationBaseValue"]').first().innerText()).trim(),
    enDict.contact.stationBaseValue
  );
  assert.equal(
    (await page.locator('#case-aurastream [data-case-description]').first().textContent()).trim(),
    getLocalizedCases('en')[0].description
  );

  // Scroll to #contact so client:visible BountyDispatch island hydrates and updates reactively without reload
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForFunction(
    (expected) => {
      const btn = document.querySelector('[data-dispatch-submit-btn]');
      return Boolean(btn && btn.textContent && btn.textContent.includes(expected));
    },
    enDict.dispatch.submitCta
  );
  const submitBtnTextEn = await page
    .locator('[data-dispatch-submit-btn]')
    .textContent();
  assert.ok(submitBtnTextEn && submitBtnTextEn.includes(enDict.dispatch.submitCta));

  // Toggle back to pt-br
  await page.click('#nav-lang-toggle-btn');
  assert.equal(await page.getAttribute('html', 'lang'), 'pt-BR');
  assert.equal(
    await page.evaluate(() => window.localStorage.getItem('brinu_locale')),
    'pt-br'
  );
  assert.equal(
    (await page.locator('[data-i18n="works.title"]').first().innerText()).trim(),
    ptBrDict.works.title
  );

  await context.close();
});

test('C7: invalid or blocked localStorage falls back safely to pt-br', async () => {
  const corruptedStorage = {
    getItem: () => 'es-MX-invalid',
  };
  assert.equal(readStoredLocale(corruptedStorage), 'pt-br');

  const throwingStorage = {
    getItem: () => {
      throw new Error('SecurityError: Storage disabled');
    },
    setItem: () => {
      throw new Error('SecurityError: Storage disabled');
    },
  };
  assert.equal(readStoredLocale(throwingStorage), 'pt-br');
  assert.doesNotThrow(() => writeStoredLocale('en', throwingStorage));
  assert.equal(sanitizeLocale(undefined), 'pt-br');
  assert.equal(sanitizeLocale('en'), 'en');

  assert.equal(setLocale('pt-br', { animate: false }), 'pt-br');
  assert.equal(toggleLocale(), 'en');
  assert.equal(getLocale(), 'en');
  assert.equal(toggleLocale(), 'pt-br');

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.setItem('brinu_locale', 'fr-FR-corrupted');
  });
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  assert.equal(await page.getAttribute('html', 'lang'), 'pt-BR');
  await context.close();
});

test('T4a: rapid locale toggling updates active locale deterministically without throwing', () => {
  setLocale('pt-br', { animate: false });
  for (let i = 0; i < 6; i += 1) {
    const next = toggleLocale();
    assert.equal(next, i % 2 === 0 ? 'en' : 'pt-br');
  }
  assert.equal(getLocale(), 'pt-br');
});

test('T4b: resolveTranslationKey falls back to keyPath for unknown dot-paths and resolves nested paths', () => {
  assert.equal(
    resolveTranslationKey('pt-br', 'nonexistent.key.path'),
    'nonexistent.key.path'
  );
  assert.equal(
    resolveTranslationKey('en', 'nav.worksCta'),
    ptBrDict.nav.worksCta !== enDict.nav.worksCta ? enDict.nav.worksCta : 'WORKS'
  );
  assert.equal(resolveTranslationKey('pt-br', 'nav.worksCta'), ptBrDict.nav.worksCta);
});

test('C8: orphaned StoryboardReel.astro and CrtOverlay.astro files are removed', () => {
  const storyboardPath = path.resolve('src/components/StoryboardReel.astro');
  const crtOverlayPath = path.resolve('src/components/CrtOverlay.astro');
  assert.equal(fs.existsSync(storyboardPath), false);
  assert.equal(fs.existsSync(crtOverlayPath), false);
});

test('C9: tokens.css enforces Persona 5 Red/Black/White triad without legacy navy surfaces', () => {
  const tokensCss = fs.readFileSync(path.resolve('src/styles/tokens.css'), 'utf8');
  assert.ok(tokensCss.includes('--color-bebop-red: #FE0000'));
  assert.ok(tokensCss.includes('--color-space-base: #080808'));
  assert.ok(tokensCss.includes('--color-paper-white: #FBFAF4'));
  assert.equal(tokensCss.toUpperCase().includes('#11111E'), false);
  assert.equal(tokensCss.toUpperCase().includes('#1A1A2E'), false);
});

test('T6a: CockpitMenu defines all 6 canonical Persona 5 navigation blades and syncCockpitTriggerDom', () => {
  const source = fs.readFileSync(
    path.resolve('src/components/CockpitMenu.tsx'),
    'utf8'
  );
  for (const href of ['#hero', '#works', '#about', '#lab', '#contact', '/whoami']) {
    assert.ok(source.includes(`href: '${href}'`), `Missing blade href ${href}`);
  }
  assert.ok(source.includes('export function syncCockpitTriggerDom(isOpen: boolean)'));
  assert.ok(source.includes("cockpitBtn.setAttribute('aria-expanded', String(isOpen))"));
});

test('T6b: CockpitMenu.tsx wires cockpit:open event, Escape key handler, and language/audio controls', () => {
  const source = fs.readFileSync(
    path.resolve('src/components/CockpitMenu.tsx'),
    'utf8'
  );
  assert.ok(source.includes("addEventListener('cockpit:open'"));
  assert.ok(source.includes("e.key === 'Escape'"));
  assert.ok(source.includes('id="cockpit-menu-overlay"'));
  assert.ok(source.includes('data-cockpit-lang="pt-br"'));
  assert.ok(source.includes('data-cockpit-lang="en"'));
  assert.ok(source.includes('id="cockpit-audio-toggle"'));
});

test('C10: clicking #cockpit-trigger-btn opens CockpitMenu with aria-expanded=true and controls', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await dismissIntroIfPresent(page);

  assert.equal(
    await page.getAttribute('#cockpit-trigger-btn', 'aria-expanded'),
    'false'
  );
  assert.equal(
    await page.getAttribute('#cockpit-menu-overlay', 'aria-hidden'),
    'true'
  );

  await page.click('#cockpit-trigger-btn');

  assert.equal(
    await page.getAttribute('#cockpit-trigger-btn', 'aria-expanded'),
    'true'
  );
  assert.equal(
    await page.getAttribute('#cockpit-menu-overlay', 'aria-hidden'),
    'false'
  );

  for (const href of ['#hero', '#works', '#about', '#lab', '#contact', '/whoami']) {
    const linkCount = await page
      .locator(`#cockpit-menu-overlay a[href="${href}"]`)
      .count();
    assert.equal(linkCount, 1, `Expected blade link ${href} in CockpitMenu`);
  }

  assert.equal(
    await page.locator('#cockpit-menu-overlay [data-cockpit-lang="pt-br"]').count(),
    1
  );
  assert.equal(
    await page.locator('#cockpit-menu-overlay [data-cockpit-lang="en"]').count(),
    1
  );
  assert.equal(
    await page.locator('#cockpit-menu-overlay #cockpit-audio-toggle').count(),
    1
  );

  await context.close();
});

test('C11: Escape and menu link clicks close CockpitMenu and set aria-expanded=false', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await dismissIntroIfPresent(page);

  // Open and close with Escape
  await page.click('#cockpit-trigger-btn');
  assert.equal(
    await page.getAttribute('#cockpit-trigger-btn', 'aria-expanded'),
    'true'
  );
  await page.keyboard.press('Escape');
  assert.equal(
    await page.getAttribute('#cockpit-trigger-btn', 'aria-expanded'),
    'false'
  );
  assert.equal(
    await page.getAttribute('#cockpit-menu-overlay', 'aria-hidden'),
    'true'
  );

  // Re-open and close by clicking a menu link
  await page.click('#cockpit-trigger-btn');
  assert.equal(
    await page.getAttribute('#cockpit-trigger-btn', 'aria-expanded'),
    'true'
  );
  await page.click('#cockpit-menu-overlay a[href="#works"]');
  assert.equal(
    await page.getAttribute('#cockpit-trigger-btn', 'aria-expanded'),
    'false'
  );
  assert.equal(
    await page.getAttribute('#cockpit-menu-overlay', 'aria-hidden'),
    'true'
  );

  await context.close();
});

test('T7: BaseLayout and ComicNav mount CockpitMenu, p5-wipe-overlay, and data-lang-toggle', () => {
  const layoutSrc = fs.readFileSync(
    path.resolve('src/layouts/BaseLayout.astro'),
    'utf8'
  );
  const navSrc = fs.readFileSync(
    path.resolve('src/components/ComicNav.astro'),
    'utf8'
  );
  assert.ok(layoutSrc.includes('<CockpitMenu client:load />'));
  assert.ok(layoutSrc.includes('id="p5-wipe-overlay"'));
  assert.ok(layoutSrc.includes('initI18nBindings()'));
  assert.ok(navSrc.includes('id="nav-lang-toggle-btn"'));
  assert.ok(navSrc.includes('data-lang-toggle'));
});

test('T8: ComicHero uses canonical PROFILE email and LinkedIn and zero wrong hardcoded links', () => {
  const heroSrc = fs.readFileSync(
    path.resolve('src/components/ComicHero.astro'),
    'utf8'
  );
  assert.ok(heroSrc.includes('PROFILE.linkedin.url'));
  assert.ok(heroSrc.includes('PROFILE.email'));
  assert.equal(heroSrc.includes('bruno.andrade.dinis@gmail.com'), false);
  assert.equal(heroSrc.includes('linkedin.com/in/brunoandradedinis'), false);
});

test('T9: SelectedWorks.astro binds bilingual data-case-* and data-i18n attributes in Red/Black/White', () => {
  const worksSrc = fs.readFileSync(
    path.resolve('src/components/SelectedWorks.astro'),
    'utf8'
  );
  assert.ok(worksSrc.includes('data-case-title'));
  assert.ok(worksSrc.includes('data-case-description'));
  assert.ok(worksSrc.includes('data-case-challenge'));
  assert.ok(worksSrc.includes('data-case-solution'));
  assert.ok(worksSrc.includes('data-case-metric'));
  assert.ok(worksSrc.includes('data-i18n="works.title"'));
});

test('C12: About and SkillsGrid render unified Persona 5 Confidant dossier without duplicate receipt', () => {
  const aboutSrc = fs.readFileSync(
    path.resolve('src/components/About.astro'),
    'utf8'
  );
  const skillsSrc = fs.readFileSync(
    path.resolve('src/components/SkillsGrid.astro'),
    'utf8'
  );
  assert.ok(aboutSrc.includes('<SkillsGrid />'));
  assert.ok(aboutSrc.includes('PROFILE.location.label'));
  assert.ok(aboutSrc.includes('data-i18n="about.bioP1"'));
  assert.ok(skillsSrc.includes('data-skill-vignette'));
  assert.ok(skillsSrc.includes('data-skill-title'));
  assert.ok(skillsSrc.includes('data-skill-badge-text'));
  assert.equal(aboutSrc.includes('PHILOSOPHY //'), false);
});

test('T11: CreativeLab and lab islands use useLocale() and remove redundant hardware telemetry boxes', () => {
  const labAstro = fs.readFileSync(
    path.resolve('src/components/CreativeLab.astro'),
    'utf8'
  );
  const tunerSrc = fs.readFileSync(
    path.resolve('src/components/lab/CrtTuner.tsx'),
    'utf8'
  );
  const sonarSrc = fs.readFileSync(
    path.resolve('src/components/lab/SonarRadar.tsx'),
    'utf8'
  );
  const deckSrc = fs.readFileSync(
    path.resolve('src/components/lab/CyberDeck.tsx'),
    'utf8'
  );

  assert.equal(labAstro.includes('GRAPHICS SUBSYSTEM'), false);
  assert.ok(tunerSrc.includes('useLocale()'));
  assert.ok(sonarSrc.includes('useLocale()'));
  assert.ok(deckSrc.includes('useLocale()'));
});

test('C13: zero horizontal overflow across 320px, 375px, 768px, and 1440px in pt-br and en', async () => {
  const viewports = [
    { width: 320, height: 640 },
    { width: 375, height: 667 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ];
  const routes = ['/', '/whoami'];
  const locales = ['pt-br', 'en'];

  const context = await browser.newContext();
  const page = await context.newPage();

  for (const route of routes) {
    for (const locale of locales) {
      await page.addInitScript((loc) => {
        window.localStorage.setItem('brinu_locale', loc);
      }, locale);

      for (const vp of viewports) {
        await page.setViewportSize(vp);
        await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });

        const metrics = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));

        assert.ok(
          metrics.scrollWidth <= metrics.clientWidth,
          `Horizontal overflow on ${route} (${locale}) at ${vp.width}px: scrollWidth=${metrics.scrollWidth} > clientWidth=${metrics.clientWidth}`
        );
      }
    }
  }

  await context.close();
});

test('C14: prefers-reduced-motion bypasses wipe and keeps content visible at opacity 1', async () => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

  const initialOpacity = await page.evaluate(() => {
    const hero = document.getElementById('hero');
    return hero ? window.getComputedStyle(hero).opacity : '0';
  });
  assert.equal(initialOpacity, '1');

  await page.click('#nav-lang-toggle-btn');

  const afterToggle = await page.evaluate(() => {
    const wipe = document.getElementById('p5-wipe-overlay');
    const hero = document.getElementById('hero');
    return {
      isWiping: wipe ? wipe.classList.contains('is-wiping') : false,
      heroOpacity: hero ? window.getComputedStyle(hero).opacity : '0',
      lang: document.documentElement.lang,
    };
  });

  assert.equal(afterToggle.isWiping, false);
  assert.equal(afterToggle.heroOpacity, '1');
  assert.equal(afterToggle.lang, 'en');

  await context.close();
});
