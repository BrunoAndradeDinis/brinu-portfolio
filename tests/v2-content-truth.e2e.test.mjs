import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';
import { getLocalizedCases } from '../src/data/cases.ts';
import { getLocalizedArchive } from '../src/data/archive.ts';

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
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
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

async function waitForStableScroll(page) {
  await page.waitForFunction(
    () =>
      new Promise((resolve) => {
        const samples = [];
        const tick = () => {
          samples.push(window.scrollY);
          if (samples.length >= 4 && samples.slice(-4).every((y) => y === samples.at(-1))) resolve(true);
          else setTimeout(tick, 100);
        };
        tick();
      }),
    null,
    { timeout: 10000 }
  );
}

async function openHome(locale = 'pt-br') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>stub</body></html>' })
  );
  await context.addInitScript((value) => {
    try {
      window.localStorage.setItem('brinu_locale', value);
    } catch {}
  }, locale);
  const page = await context.newPage();
  await page.goto(`${baseUrl}/?freeze`, { waitUntil: 'load' });
  await page.evaluate(() => {
    const el = document.getElementById('intro-preloader');
    if (el) {
      el.click();
      el.remove();
    }
  });
  return { context, page };
}

test('C6: works section lists the four main cases in order', async () => {
  const { context, page } = await openHome();
  try {
    const ids = await page.locator('#works [data-reel-card]').evaluateAll((cards) => cards.map((c) => c.id));
    assert.deepEqual(ids, ['case-magalu-cloud', 'case-uriana', 'case-efood', 'case-aurastream']);
  } finally {
    await context.close();
  }
});

test('C15: case links open a new tab with noopener noreferrer', async () => {
  const { context, page } = await openHome();
  try {
    const links = page.locator('#works [data-reel-card] a[data-case-link]');
    const count = await links.count();
    assert.ok(count >= 4);
    for (let i = 0; i < count; i += 1) {
      assert.equal(await links.nth(i).getAttribute('target'), '_blank');
      const rel = (await links.nth(i).getAttribute('rel')) ?? '';
      assert.ok(rel.includes('noopener') && rel.includes('noreferrer'), `rel was "${rel}"`);
    }
    const magaluLink = page.locator('#case-magalu-cloud a[data-case-link]').first();
    await magaluLink.scrollIntoViewIfNeeded();
    const [popup] = await Promise.all([context.waitForEvent('page'), magaluLink.click()]);
    await popup.waitForLoadState('domcontentloaded');
    assert.equal(popup.url(), 'https://magalu.cloud/');
    assert.equal(await popup.evaluate(() => window.opener), null);
  } finally {
    await context.close();
  }
});

test('C25: archive lists exactly the approved entries', async () => {
  const { context, page } = await openHome();
  try {
    const ids = await page.locator('[data-archive-card]').evaluateAll((cards) => cards.map((c) => c.id));
    assert.deepEqual(ids, [
      'archive-jokenpo', 'archive-lista-de-contatos', 'archive-the-warriors', 'archive-armazem-do-pierre',
      'archive-vue-apps', 'archive-doutor-agenda', 'archive-quake-log-parser', 'archive-brinu-portfolio-v2',
    ]);
  } finally {
    await context.close();
  }
});

test('C26: archive entries show repo and only real demo links', async () => {
  const { context, page } = await openHome();
  try {
    for (const entry of getLocalizedArchive('pt-br')) {
      const card = page.locator(`#archive-${entry.id}`);
      assert.equal((await card.locator('[data-archive-title]').innerText()).trim().toUpperCase(), entry.title.toUpperCase());
      assert.equal((await card.locator('[data-archive-description]').innerText()).trim(), entry.description);
      assert.equal(await card.locator('[data-archive-stack-item]').count(), entry.stack.length);
      const hrefs = await card.locator('a[data-archive-link]').evaluateAll((as) => as.map((a) => [a.dataset.archiveLink, a.getAttribute('href')]));
      assert.deepEqual(hrefs, entry.links.map((l) => [l.type, l.url]));
      assert.ok(hrefs.some(([type]) => type === 'github'), `${entry.id} has no repository link`);
      for (const [, href] of hrefs) {
        assert.ok(href && href !== '#' && href.startsWith('https://'), `${entry.id} has an empty link`);
      }
    }
    assert.equal(await page.locator('#archive-doutor-agenda a[data-archive-link="demo"]').count(), 0);
  } finally {
    await context.close();
  }
});

test('C27: doutor agenda shows its in progress status in both locales', async () => {
  for (const [locale, expected] of [['pt-br', 'Em construção'], ['en', 'In progress']]) {
    const { context, page } = await openHome(locale);
    try {
      const status = page.locator('#archive-doutor-agenda [data-archive-status]');
      assert.equal((await status.innerText()).trim().toUpperCase(), expected.toUpperCase());
      assert.equal(await page.locator('[data-archive-status]').count(), 1);
      if (locale === 'en') {
        const en = getLocalizedArchive('en').find((e) => e.id === 'jokenpo');
        assert.equal((await page.locator('#archive-jokenpo [data-archive-description]').innerText()).trim(), en.description);
        const enCase = getLocalizedCases('en').find((c) => c.id === 'uriana');
        assert.equal((await page.locator('#case-uriana [data-case-description]').innerText()).trim(), enCase.description);
      }
    } finally {
      await context.close();
    }
  }
});

const { getArsenalCounter } = await import('../src/data/arsenal.ts');

test('C22: page shows no rank max or verified capabilities labels', async () => {
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openHome(locale);
    try {
      const text = await page.locator('body').innerText();
      assert.doesNotMatch(text, /RANK MAX/i);
      assert.doesNotMatch(text, /CAPACIDADES VERIFICADAS|VERIFIED CAPABILITIES/i);
    } finally {
      await context.close();
    }
  }
});

test('C23: arsenal counter is computed from the data', async () => {
  const { ARSENAL } = await import('../src/data/arsenal.ts');
  const domains = ARSENAL.length;
  const skills = ARSENAL.reduce((n, d) => n + d.skills.length, 0);
  const words = { 'pt-br': ['DOMÍNIOS', 'SKILLS COM PROVA'], en: ['DOMAINS', 'SKILLS WITH PROOF'] };
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openHome(locale);
    try {
      const domCount = await page.locator('[data-skill-vignette]').count();
      const domSkills = await page.locator('[data-skill-badge]').count();
      assert.equal(domCount, domains);
      assert.equal(domSkills, skills);
      const expected = `${domCount} ${words[locale][0]} • ${domSkills} ${words[locale][1]}`;
      assert.equal((await page.locator('[data-arsenal-counter]').innerText()).trim(), expected);
      assert.equal(getArsenalCounter(locale), expected);
    } finally {
      await context.close();
    }
  }
  const source = fs.readFileSync('src/components/SkillsGrid.astro', 'utf8');
  assert.doesNotMatch(source, /\b\d+\s+(DOMÍNIOS|DOMAINS|SKILLS)/, 'counter must not be hardcoded in the component');
});

test('C24: clicking an evidence chip scrolls to its card', async () => {
  const { context, page } = await openHome();
  try {
    const chip = page.locator('[data-skill-badge]', { hasText: 'PostgreSQL + Prisma' }).locator('a[data-evidence-link="case:uriana"]');
    assert.equal(await chip.getAttribute('href'), '#case-uriana');
    await waitForStableScroll(page);
    const before = await page.evaluate(() => document.getElementById('case-uriana').getBoundingClientRect().top);
    assert.ok(Math.abs(before) > 900, `card must start out of view (top ${before})`);
    await chip.dispatchEvent('click', { button: 0 });
    await page.waitForFunction(() => Math.abs(document.getElementById('case-uriana').getBoundingClientRect().top) <= 90, null, {
      timeout: 15000,
    });
  } finally {
    await context.close();
  }
});

test('C28: career lists three roles newest first with localized dates', async () => {
  const expected = {
    'pt-br': ['dez/2025 – atual', 'nov/2019 – nov/2025', 'jun/2017 – out/2019'],
    en: ['Dec 2025 – present', 'Nov 2019 – Nov 2025', 'Jun 2017 – Oct 2019'],
  };
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openHome(locale);
    try {
      const ids = await page.locator('#about [data-career-entry]').evaluateAll((items) => items.map((i) => i.id));
      assert.deepEqual(ids, ['career-magalu-cloud', 'career-luizalabs', 'career-magazine-luiza']);
      const periods = await page.locator('#about [data-career-period]').allInnerTexts();
      assert.deepEqual(periods.map((p) => p.trim().toLowerCase()), expected[locale].map((p) => p.toLowerCase()));
      const orgs = await page.locator('#about [data-career-org]').allInnerTexts();
      assert.deepEqual(orgs.map((o) => o.trim().toUpperCase()), ['MAGALU CLOUD', 'LUIZALABS', 'MAGAZINE LUIZA']);
      const roles = await page.locator('#about [data-career-role]').allInnerTexts();
      const expectedRoles = {
        'pt-br': ['Desenvolvedor de front-end', 'Assistente de helpdesk II', 'Atendente de SAC'],
        en: ['Frontend Developer', 'Helpdesk Assistant II', 'Customer Service Agent'],
      };
      assert.deepEqual(roles.map((r) => r.trim().toUpperCase()), expectedRoles[locale].map((r) => r.toUpperCase()));
    } finally {
      await context.close();
    }
  }
});

test('C29: luizalabs entry links its three automations', async () => {
  const { context, page } = await openHome();
  try {
    const links = await page
      .locator('#career-luizalabs a[data-automation-link]')
      .evaluateAll((as) => as.map((a) => [a.textContent.replace('↗', '').trim(), a.getAttribute('href'), a.getAttribute('target')]));
    assert.deepEqual(links, [
      ['Consulta CNPJ', 'https://github.com/BrunoAndradeDinis/consultaCNPJ', '_blank'],
      ['sheetScriptForm', 'https://github.com/BrunoAndradeDinis/sheetScriptForm', '_blank'],
      ['Mapa de Desempenho', 'https://github.com/BrunoAndradeDinis/mapaDeDesempenho', '_blank'],
    ]);
    assert.equal(await page.locator('#career-magalu-cloud a[data-automation-link]').count(), 0);
  } finally {
    await context.close();
  }
});

test('C30: education lists the four approved entries with status', async () => {
  const expected = {
    'pt-br': ['Concluído', 'Concluído', 'Em andamento', 'Em andamento'],
    en: ['Completed', 'Completed', 'In progress', 'In progress'],
  };
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openHome(locale);
    try {
      const ids = await page.locator('#about [data-education-entry]').evaluateAll((items) => items.map((i) => i.id));
      assert.deepEqual(ids, ['education-ampli', 'education-ebac', 'education-full-stack-club', 'education-alura']);
      const statuses = await page.locator('#about [data-education-status]').allInnerTexts();
      assert.deepEqual(statuses.map((s) => s.trim().toUpperCase()), expected[locale].map((s) => s.toUpperCase()));
      const courses = await page.locator('#about [data-education-course]').allInnerTexts();
      const expectedCourses = {
        'pt-br': ['Desenvolvimento Web', 'Engenheiro de Front-end', 'Developer Fullstack', 'Formação técnica em programação'],
        en: ['Web Development', 'Frontend Engineer', 'Fullstack Developer', 'Technical programming track'],
      };
      assert.deepEqual(courses.map((c) => c.trim()), expectedCourses[locale]);
      const periods = await page.locator('#about [data-education-period]').allInnerTexts();
      const expectedPeriods = {
        'pt-br': ['mai/2023 – dez/2024', 'nov/2024 – jun/2026', 'jun/2025 – atual', 'mai/2022 – atual'],
        en: ['May 2023 – Dec 2024', 'Nov 2024 – Jun 2026', 'Jun 2025 – present', 'May 2022 – present'],
      };
      assert.deepEqual(periods.map((p) => p.trim().toLowerCase()), expectedPeriods[locale].map((p) => p.toLowerCase()));
    } finally {
      await context.close();
    }
  }
});

test('C31: page does not mention fatec', async () => {
  for (const locale of ['pt-br', 'en']) {
    const { context, page } = await openHome(locale);
    try {
      assert.doesNotMatch(await page.content(), /fatec/i);
    } finally {
      await context.close();
    }
  }
});

test('C33: about shows at most two bio lines and no manifesto', async () => {
  const { context, page } = await openHome();
  try {
    assert.equal(await page.locator('#about [data-i18n^="about.bioLine"]').count(), 2);
    assert.equal(await page.locator('#about [data-i18n="about.manifestoQuote"], #about blockquote').count(), 0);
    assert.doesNotMatch(await page.locator('#about').innerText(), /MANIFESTO/i);
  } finally {
    await context.close();
  }
});

const { ptBrDict, enDict } = await import('../src/i18n/dictionaries.ts');
const { mottoSentence } = await import('../src/components/filmstrip/motto.ts');

const normalize = (text) => text.replace(/\s+/g, ' ').trim();

function ptOnlyStrings() {
  const pairs = [];
  const walk = (pt, en) => {
    if (typeof pt === 'string') {
      if (typeof en === 'string' && pt.trim() && pt !== en) pairs.push(pt.trim());
      return;
    }
    if (pt && typeof pt === 'object') for (const key of Object.keys(pt)) walk(pt[key], en?.[key]);
  };
  walk(ptBrDict, enDict);
  return new Set(pairs);
}

test('C3: switching to en translates portrait alt and filmstrip captions', async () => {
  const { context, page } = await openHome('pt-br');
  try {
    for (const id of ['#lab', '#contact']) {
      await page.locator(id).scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
    }
    await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0, null, { timeout: 15000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('#nav-lang-toggle-btn').click();
    await page.waitForFunction(() => window.localStorage.getItem('brinu_locale') === 'en' && document.documentElement.lang === 'en');
    await page.waitForTimeout(800);

    assert.equal(await page.locator('#about-official-avatar').getAttribute('alt'), enDict.about.portraitAlt);
    assert.notEqual(enDict.about.portraitAlt, ptBrDict.about.portraitAlt);
    for (const i of [1, 2, 3, 4, 5, 6]) {
      const slide = page.locator('[data-film-slide]').nth(i - 1);
      assert.equal((await slide.locator(`[data-i18n="filmstrip.slides.s${i}Reel"]`).textContent()).trim(), enDict.filmstrip.slides[`s${i}Reel`]);
      assert.equal((await slide.locator(`[data-i18n="filmstrip.slides.s${i}Title"]`).textContent()).trim(), enDict.filmstrip.slides[`s${i}Title`]);
      assert.equal(await slide.locator('img').getAttribute('alt'), enDict.filmstrip.slides[`s${i}Alt`]);
    }

    const attributes = await page.evaluate(() =>
      [...document.querySelectorAll('[alt], [aria-label], [title]')].flatMap((el) =>
        ['alt', 'aria-label', 'title']
          .filter((name) => el.hasAttribute(name))
          .map((name) => ({ name, value: el.getAttribute(name).trim(), tag: el.tagName }))
      )
    );
    assert.ok(attributes.length > 20, `expected many labelled elements, got ${attributes.length}`);
    const ptStrings = ptOnlyStrings();
    const leftovers = attributes.filter(
      (a) => a.value && (ptStrings.has(a.value) || /[ãõç]|ção\b|ções\b|\b(de|do|da|para|com)\s/i.test(a.value))
    );
    assert.deepEqual(leftovers, [], 'portuguese text left in attributes on the en page');
  } finally {
    await context.close();
  }
});

test('C34: filmstrip motto is the single approved sentence', async () => {
  for (const [locale, dict, expected] of [
    ['pt-br', ptBrDict, 'APRENDI A RESOLVER PROBLEMAS ATENDENDO PESSOAS — HOJE EU RESOLVO COM INTERFACES.'],
    ['en', enDict, 'I LEARNED TO SOLVE PROBLEMS BY HELPING PEOPLE — TODAY I SOLVE THEM WITH INTERFACES.'],
  ]) {
    const { context, page } = await openHome(locale);
    try {
      assert.equal(mottoSentence(dict), expected);
      assert.equal(await page.locator('[data-motto-text] p').count(), 1);
      const rendered = await page.locator('[data-motto-text]').evaluate((el) => el.textContent);
      assert.equal(normalize(rendered), expected);
      assert.equal(await page.locator('[data-motto-text] [class*="skew-x"]').count() >= 3, true);
    } finally {
      await context.close();
    }
  }
});

test('C35: first reel captions come from the dictionary and frames link to cases', async () => {
  const { context, page } = await openHome();
  try {
    const frames = page.locator('[data-filmstrip-parallax] a[data-film-slide]');
    assert.equal(await frames.count(), 6);
    const hrefs = await frames.evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    assert.deepEqual(hrefs, ['#case-aurastream', '#archive-quake-log-parser', '#archive-jokenpo', '#archive-the-warriors', '#case-magalu-cloud', '#about']);
    for (const href of hrefs) {
      assert.equal(await page.locator(href).count(), 1, `${href} target must exist`);
    }
    for (const i of [1, 2, 3, 4, 5, 6]) {
      const reel = frames.nth(i - 1).locator(`[data-i18n="filmstrip.slides.s${i}Reel"]`);
      assert.equal((await reel.textContent()).trim(), ptBrDict.filmstrip.slides[`s${i}Reel`]);
    }
    const source = fs.readFileSync('src/components/FilmstripParallax.astro', 'utf8');
    assert.doesNotMatch(source, /reel: "FRAME 0\d/, 'first reel captions must not be hardcoded');
  } finally {
    await context.close();
  }
});

const REFERENCE_COPY = [
  'O CÓDIGO MONÓTONO', 'DOMINOU A WEB', 'FORTALEZAS DA MONOTONIA', 'REALIDADE BASE', 'PERCEPÇÃO SENSORIAL',
  'CORRIDA MONÓTONA', 'REINOU POR TEMPO DEMAIS', 'FOR TOO LONG', 'HAS RULED THE WEB', 'IDENTIFIED THE STRONGHOLDS',
  'BASE REALITY', 'SENSORY PERCEPTION', 'RAT RACE',
];

function builtHtmlFiles(dir = 'dist') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return builtHtmlFiles(full);
    return /\.(html|js)$/.test(e.name) ? [full] : [];
  });
}

test('C36: no translated reference copy remains', () => {
  const sources = [...builtHtmlFiles(), 'src/i18n/dictionaries.ts'];
  for (const file of sources) {
    const text = fs.readFileSync(file, 'utf8').toUpperCase();
    for (const phrase of REFERENCE_COPY) {
      assert.ok(!text.includes(phrase.toUpperCase()), `${file} contains "${phrase}"`);
    }
  }
});

test('C37: hero and filmstrip render the approved copy deck', async () => {
  const expectations = {
    'pt-br': { left: '8 ANOS DE MAGALU DO ATENDIMENTO AO FRONT-END', right: 'INTERFACES COM PERSONALIDADE E CÓDIGO LIMPO', heading: 'CADA FRAME, UM PROJETO ENTREGUE' },
    en: { left: '8 YEARS AT MAGALU FROM SUPPORT TO FRONTEND', right: 'INTERFACES WITH PERSONALITY AND CLEAN CODE', heading: 'EVERY FRAME, A SHIPPED PROJECT' },
  };
  for (const [locale, exp] of Object.entries(expectations)) {
    const { context, page } = await openHome(locale);
    try {
      const left = await page.locator('[data-hero-manifesto="left"]').evaluate((el) => el.innerText);
      const right = await page.locator('[data-hero-manifesto="right"]').evaluate((el) => el.innerText);
      assert.ok(normalize(left).toUpperCase().includes(exp.left), `left manifesto was "${normalize(left)}"`);
      assert.ok(normalize(right).toUpperCase().includes(exp.right), `right manifesto was "${normalize(right)}"`);
      assert.equal(normalize(await page.locator('[data-i18n="filmstrip.heading"]').textContent()), exp.heading);
    } finally {
      await context.close();
    }
  }
});

test('C5: home title and description say desenvolvedor frontend', () => {
  const html = fs.readFileSync('dist/index.html', 'utf8');
  const title = (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').replaceAll('&amp;', '&');
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  assert.match(title, /Desenvolvedor Frontend/);
  assert.match(description, /Desenvolvedor Frontend/);
  assert.doesNotMatch(title, /Software Engineer|Engenheiro de Software/);
  assert.equal(title, ptBrDict.meta.title);
});

test('C32: right click keeps the native context menu', async () => {
  const { context, page } = await openHome();
  try {
    await page.evaluate(() => {
      window.__contextMenuPrevented = null;
      window.addEventListener('contextmenu', (event) => {
        setTimeout(() => {
          window.__contextMenuPrevented = event.defaultPrevented;
        }, 0);
      });
    });
    await page.locator('#hero').click({ button: 'right', position: { x: 200, y: 200 } });
    await page.waitForFunction(() => window.__contextMenuPrevented !== null);
    assert.equal(await page.evaluate(() => window.__contextMenuPrevented), false);
    assert.equal(await page.locator('[role="dialog"]:visible, [role="alertdialog"]:visible').count(), 0);
    assert.equal(fs.existsSync('src/components/RightClickGuard.tsx'), false);
  } finally {
    await context.close();
  }
});

const FORBIDDEN_CLAIMS = [
  'Golang', 'Go (Golang)', 'golang/', 'Kubernetes', 'K8s', 'GraphQL', 'Cache Distribuído', 'Distributed Caching',
  'Zero-Downtime', 'sistemas distribuídos', 'Sistemas Distribuídos', 'distributed systems', 'Distributed Systems',
  'Engenheiro de Software', 'Software Engineer', 'INP <', 'INP &lt;', '100% de cobertura', '100% unit test coverage',
  '60fps', '60FPS', '60 fps', '60 FPS',
];

function filesUnder(dir, pattern) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return filesUnder(full, pattern);
    return pattern.test(e.name) ? [full] : [];
  });
}

test('C2: forbidden claims are absent from build, dictionaries and data', () => {
  const files = [
    ...filesUnder('dist', /\.(html|js|svg)$/),
    ...filesUnder('src/i18n', /\.ts$/),
    ...filesUnder('src/data', /\.ts$/),
    ...filesUnder('public/assets/filmstrip', /\.svg$/),
    ...filesUnder('src/components', /\.(astro|tsx|ts)$/),
  ];
  assert.ok(files.some((f) => f.endsWith('index.html')));
  const hits = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const term of FORBIDDEN_CLAIMS) {
      if (text.includes(term)) hits.push(`${file}: ${term}`);
    }
    if (/DISTRIBUTED SYSTEMS|SISTEMAS DISTRIBUÍDOS|ARQUITETURA DISTRIBUÍDA|DISTRIBUTED ARCHITECTURE|JEST COVERAGE: 100|99\.99% SLA/i.test(text)) hits.push(`${file}: distributed or unbacked claim`);
    const unbacked = text.match(/O\(N\) Concurrency|Go & Node|CONCURRENT|\d+(\.\d+)?% Uptime|\bHLS\b|ASTRO 5\b|90s Cult/i);
    if (unbacked) hits.push(`${file}: ${unbacked[0]}`);
  }
  assert.deepEqual(hits, []);
});
