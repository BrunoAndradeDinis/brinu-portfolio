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

const { ptBrDict } = await import('../src/i18n/dictionaries.ts');
const BRAND_TONES = ['rgb(254, 0, 0)', 'rgb(163, 0, 0)', 'rgb(8, 8, 8)', 'rgb(43, 43, 43)', 'rgb(251, 250, 244)', 'rgb(217, 213, 199)'];

async function openHome({ viewport = { width: 1440, height: 900 }, ...contextOptions } = {}) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
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

const startCubeRecorder = (page) =>
  page.evaluate(() => {
    const host = document.querySelector('[data-about-portrait]');
    const record = { phases: [], snapshots: {}, overflow: 0, frames: 0, stickerShown: 0, portraitShown: 0, thirdInView: null };
    const frameBox = document.querySelector('[data-about-portrait-frame]');
    const slicesShown = (stage, kind) => {
      const slices = [...stage.querySelectorAll(`[data-cube-slice="${kind}"]`)];
      return slices.length === 9 ? Math.min(...slices.map((slice) => Number(getComputedStyle(slice).opacity))) : 0;
    };
    window.__cube = record;
    const matrixOf = (element) => {
      const transform = getComputedStyle(element).transform;
      return transform === 'none' ? new DOMMatrix() : new DOMMatrix(transform);
    };
    // The face a sticker shows on screen, read from the rendered transforms of its piece and itself.
    const shownFacing = (sticker) => {
      const normal = matrixOf(sticker.parentElement).multiply(matrixOf(sticker)).transformPoint(new DOMPoint(0, 0, 1, 0));
      const axes = [['x', normal.x], ['y', normal.y], ['z', normal.z]];
      const [axis, value] = axes.reduce((best, entry) => (Math.abs(entry[1]) > Math.abs(best[1]) ? entry : best));
      return `${value > 0 ? '+' : '-'}${axis}`;
    };
    const snapshot = (stage) => {
      const stickers = [...stage.querySelectorAll('[data-cube-sticker]')];
      const faces = {};
      for (const sticker of stickers) (faces[shownFacing(sticker)] ??= []).push(sticker.dataset.cubeSticker);
      const front = stickers.filter((sticker) => shownFacing(sticker) === '+z');
      return {
        pieces: stage.querySelectorAll('[data-cube-piece]').length,
        stickers: stickers.length,
        colours: [...new Set(stickers.map((sticker) => getComputedStyle(sticker).backgroundColor))],
        faces,
        stickerSlices: front.map((sticker) => sticker.querySelector('[data-cube-slice="sticker"]')?.style.backgroundImage ?? ''),
        portraitSlices: front.map((sticker) => sticker.querySelector('[data-cube-slice="portrait"]')?.style.backgroundImage ?? ''),
        frameOpacity: Number(getComputedStyle(document.querySelector('[data-about-portrait-frame]')).opacity),
      };
    };
    let last = null;
    const sample = () => {
      const stage = host.querySelector('[data-dossier-cube]');
      const phase = stage ? stage.dataset.dossierCube : record.phases.length ? 'gone' : null;
      if (phase && phase !== last) {
        record.phases.push({ phase, at: performance.now() });
        if (stage) record.snapshots[phase] = snapshot(stage);
        last = phase;
      }
      record.frames += 1;
      if (record.thirdInView === null) {
        const rect = frameBox.getBoundingClientRect();
        const visible = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
        if (rect.height > 0 && visible / rect.height >= 0.35) record.thirdInView = performance.now();
      }
      if (stage) {
        record.stickerShown = Math.max(record.stickerShown, slicesShown(stage, 'sticker'));
        record.portraitShown = Math.max(record.portraitShown, slicesShown(stage, 'portrait'));
      }
      record.overflow = Math.max(record.overflow, document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (phase !== 'gone' || record.frames < 5) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

async function scrollToPortrait(page) {
  await page.evaluate(() => {
    const box = document.querySelector('[data-about-portrait]');
    window.scrollTo(0, box.getBoundingClientRect().top + window.scrollY - Math.max(0, (window.innerHeight - box.offsetHeight) / 2));
  });
}

test('the portrait sits centred in its column, level with the text', async () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1024, height: 800 }, { width: 1440, height: 900 }, { width: 2560, height: 1440 }]) {
    const { context, page } = await openHome({ viewport, reducedMotion: 'reduce' });
    try {
      const boxes = await page.evaluate(() => {
        const read = (selector) => {
          const rect = document.querySelector(selector).getBoundingClientRect();
          return { centreX: rect.left + rect.width / 2, top: rect.top };
        };
        return { column: read('[data-about-avatar-panel]'), portrait: read('[data-about-portrait]'), text: read('[data-about-content-panel]'), bio: read('[data-about-card="bio"]') };
      });
      assert.ok(Math.abs(boxes.portrait.centreX - boxes.column.centreX) <= 1, `${viewport.width}px: the portrait is centred across its column (${boxes.portrait.centreX} vs ${boxes.column.centreX})`);
      if (viewport.width >= 1024) {
        assert.ok(Math.abs(boxes.column.top - boxes.text.top) <= 1, `${viewport.width}px: the portrait column starts level with the text column (${boxes.column.top} vs ${boxes.text.top})`);
        assert.ok(Math.abs(boxes.portrait.top - boxes.bio.top) <= 1, `${viewport.width}px: the portrait starts level with the bio card (${boxes.portrait.top} vs ${boxes.bio.top})`);
      }
    } finally {
      await context.close();
    }
  }
});

test('a scrambled Rubik cube solves itself into the portrait', async () => {
  const { context, page } = await openHome();
  try {
    assert.equal(await page.locator('[data-dossier-cube]').count(), 0, 'no cube before the portrait is reached');
    await startCubeRecorder(page);
    await scrollToPortrait(page);
    await page.waitForFunction(() => window.__cube.phases.some((entry) => entry.phase === 'gone'), null, { timeout: 8000 });
    const record = await page.evaluate(() => window.__cube);
    const startedAt = Number(await page.locator('[data-about-portrait]').getAttribute('data-cube-started-at'));

    assert.deepEqual(record.phases.map((entry) => entry.phase), ['scrambled', 'solving', 'solved', 'sticker', 'portrait', 'gone']);
    const scrambled = record.snapshots.scrambled;
    assert.equal(scrambled.pieces, 27, '27 pieces');
    assert.equal(scrambled.stickers, 54, '54 stickers');
    assert.ok(scrambled.frameOpacity === 0, 'the framed portrait waits behind the cube');
    const mixed = Object.values(scrambled.faces).filter((homes) => new Set(homes).size > 1);
    assert.ok(mixed.length >= 4, `the cube starts scrambled (${mixed.length} mixed faces)`);

    const solved = record.snapshots.solved;
    assert.deepEqual(Object.keys(solved.faces).sort(), ['+x', '+y', '+z', '-x', '-y', '-z']);
    for (const [facing, homes] of Object.entries(solved.faces)) {
      assert.equal(homes.length, 9, `${facing} has nine stickers`);
      assert.equal(new Set(homes).size, 1, `${facing} is one colour once solved`);
    }
    for (const colour of solved.colours) assert.ok(BRAND_TONES.includes(colour), `${colour} is a brand tone`);

    const sticker = record.snapshots.sticker;
    assert.equal(sticker.stickerSlices.length, 9, 'nine front stickers');
    for (const image of sticker.stickerSlices) assert.match(image, /\/stickers\/sticker-04\.svg/, 'sticker 04 is spread over the front');
    const portrait = record.snapshots.portrait;
    for (const image of portrait.portraitSlices) assert.match(image, /brinu-avatar\.jpg/, 'the front settles into the Dossier portrait');
    assert.ok(record.stickerShown >= 0.99, `all nine sticker 04 slices become fully visible (${record.stickerShown})`);
    assert.ok(record.portraitShown >= 0.99, `all nine portrait slices become fully visible (${record.portraitShown})`);

    const end = record.phases.at(-1).at;
    assert.ok(record.thirdInView !== null, 'a third of the portrait came into view');
    assert.ok(startedAt - record.thirdInView <= 100, `the cube starts as 35% of the portrait is on screen (${Math.round(startedAt - record.thirdInView)} ms later)`);
    assert.ok(end - record.thirdInView <= 4000, `the sequence ends within 4 s of that moment (${Math.round(end - record.thirdInView)} ms)`);
    const final = await page.evaluate(() => {
      const image = document.getElementById('about-official-avatar');
      return {
        frameOpacity: Number(getComputedStyle(document.querySelector('[data-about-portrait-frame]')).opacity),
        imageShown: image.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
        alt: image.getAttribute('alt'),
      };
    });
    assert.deepEqual(final, { frameOpacity: 1, imageShown: true, alt: ptBrDict.about.portraitAlt }, 'only the framed portrait remains, with its alt text');
    assert.ok(record.overflow <= 0, 'the cube never widens the page');

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await scrollToPortrait(page);
    await page.waitForTimeout(800);
    assert.equal(await page.locator('[data-dossier-cube]').count(), 0, 'the cube plays once per page load');
  } finally {
    await context.close();
  }
});

test('reduced motion and no JavaScript show the portrait at once', async () => {
  for (const options of [{ reducedMotion: 'reduce' }, { javaScriptEnabled: false }]) {
    const label = options.reducedMotion ? 'reduced motion' : 'no JavaScript';
    const { context, page } = await openHome(options);
    try {
      await scrollToPortrait(page);
      await page.waitForTimeout(500);
      assert.equal(await page.locator('[data-dossier-cube]').count(), 0, `${label}: no cube`);
      const opacity = await page.locator('[data-about-portrait-frame]').evaluate((frame) => Number(getComputedStyle(frame).opacity));
      assert.equal(opacity, 1, `${label}: the framed portrait shows`);
      assert.equal(await page.locator('#about-official-avatar').isVisible(), true);
    } finally {
      await context.close();
    }
  }
});

test('the cube never widens the page from 320 to 2560 px', async () => {
  for (const viewport of [{ width: 320, height: 640 }, { width: 768, height: 1024 }, { width: 2560, height: 1440 }]) {
    const { context, page } = await openHome({ viewport });
    try {
      await startCubeRecorder(page);
      await scrollToPortrait(page);
      await page.waitForFunction(() => window.__cube.phases.some((entry) => entry.phase === 'gone'), null, { timeout: 8000 });
      const record = await page.evaluate(() => window.__cube);
      assert.ok(record.phases.length >= 5, `${viewport.width}px: the cube plays`);
      assert.ok(record.overflow <= 0, `${viewport.width}px: no horizontal overflow while the cube plays (${record.overflow}px)`);
    } finally {
      await context.close();
    }
  }
});

test('each square of the cube shows a different sticker', async () => {
  const { STICKER_FILES } = await import('../src/data/sticker-files.ts');
  const { context, page } = await openHome();
  try {
    await scrollToPortrait(page);
    await page.waitForFunction(() => document.querySelector('[data-dossier-cube]')?.dataset.dossierCube === 'solving');
    const squares = await page.evaluate(() =>
      [...document.querySelectorAll('[data-dossier-cube] [data-cube-sticker]')].map((sticker) => {
        const photo = sticker.querySelector('[data-cube-photo]');
        const box = photo?.getBoundingClientRect();
        const outer = sticker.getBoundingClientRect();
        return {
          image: photo ? getComputedStyle(photo).backgroundImage : '',
          inside: photo ? box.width > 0 && box.width < outer.width + 0.5 : false,
          bordered: photo ? getComputedStyle(sticker).backgroundColor !== 'rgba(0, 0, 0, 0)' : false,
        };
      })
    );
    assert.equal(squares.length, 54, '54 squares');
    const files = squares.map((square) => square.image.match(/\/stickers\/sticker-\d{2}\.svg/)?.[0] ?? '');
    assert.equal(new Set(files).size, 54, 'every square shows a different sticker');
    for (const file of files) {
      assert.ok(STICKER_FILES.includes(file), `${file || '(none)'} comes from the sticker library`);
      assert.notEqual(file, '/stickers/sticker-04.svg', 'sticker 04 is kept for the front');
    }
    assert.ok(squares.every((square) => square.inside && square.bordered), 'each photo sits inside a square of its face colour');
    const loaded = await page.evaluate(async (urls) => {
      const results = await Promise.all(urls.map((url) => fetch(url).then((response) => response.ok && response.headers.get('content-type')?.includes('svg'))));
      return results.every(Boolean);
    }, files);
    assert.equal(loaded, true, 'every sticker file loads');
  } finally {
    await context.close();
  }
});

const { enDict } = await import('../src/i18n/dictionaries.ts');

// The computed accessible name and description of the portrait frame, from Chromium's accessibility tree.
async function frameAccessibility(context, page) {
  const client = await context.newCDPSession(page);
  const { root } = await client.send('DOM.getDocument');
  const { nodeId } = await client.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-about-portrait-frame]' });
  const { nodes } = await client.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  await client.detach();
  const node = nodes.find((entry) => !entry.ignored) ?? nodes[0];
  return { role: node.role?.value ?? null, name: node.name?.value ?? '', description: node.description?.value ?? '' };
}

// Whether any text node on the page reads the replay hint to assistive technology outside the button's description.
const hintExposed = (page, hint) =>
  page.evaluate((text) => {
    const span = document.getElementById('about-portrait-replay-hint');
    return span.textContent.trim() === text && span.checkVisibility() && !span.hidden;
  }, hint);

async function waitForCubeDone(page, plays) {
  await page.waitForFunction((count) => document.querySelector('[data-about-portrait]').dataset.cubePlays === String(count) && !document.querySelector('[data-dossier-cube]'), plays, { timeout: 8000 });
}

test('double click, Enter or Space solves the cube again', async () => {
  const { context, page } = await openHome();
  try {
    await scrollToPortrait(page);
    await waitForCubeDone(page, 1);
    const frame = page.locator('[data-about-portrait-frame]');

    await startCubeRecorder(page);
    await frame.dblclick();
    await page.waitForFunction(() => document.querySelector('[data-dossier-cube]') !== null);
    await frame.dblclick();
    assert.equal(await page.locator('[data-dossier-cube]').count(), 1, 'a double click while the cube plays starts no second cube');
    await waitForCubeDone(page, 2);
    const replay = await page.evaluate(() => window.__cube);
    assert.deepEqual(replay.phases.map((entry) => entry.phase), ['scrambled', 'solving', 'solved', 'sticker', 'portrait', 'gone'], 'the double click plays the whole sequence again');
    assert.equal(Object.values(replay.snapshots.solved.faces).every((homes) => new Set(homes).size === 1), true, 'the replayed cube is solved on screen');
    assert.equal(await frame.evaluate((element) => Number(getComputedStyle(element).opacity)), 1, 'the portrait is back after the replay');

    await frame.focus();
    await page.keyboard.press('Enter');
    await waitForCubeDone(page, 3);
    const before = await page.evaluate(() => window.scrollY);
    await page.keyboard.press(' ');
    await waitForCubeDone(page, 4);
    assert.equal(await page.evaluate(() => window.scrollY), before, 'Space replays without scrolling the page');
  } finally {
    await context.close();
  }
});

test('the portrait shows a pointer and sheds particles on hover', async () => {
  for (const [locale, hint] of [['pt-br', ptBrDict.about.portraitReplayHint], ['en', enDict.about.portraitReplayHint]]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript((value) => window.localStorage.setItem('brinu_locale', value), locale);
    const page = await context.newPage();
    try {
      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        document.getElementById('intro-preloader')?.remove();
        window.dispatchEvent(new CustomEvent('intro-complete'));
      });
      await scrollToPortrait(page);
      await waitForCubeDone(page, 1);
      const frame = page.locator('[data-about-portrait-frame]');
      const semantics = await frame.evaluate((element) => ({ cursor: getComputedStyle(element).cursor, tabIndex: element.tabIndex }));
      assert.deepEqual(semantics, { cursor: 'pointer', tabIndex: 0 }, `${locale}: a pointer and a keyboard stop`);
      assert.deepEqual(await frameAccessibility(context, page), { role: 'button', name: locale === 'en' ? enDict.about.portraitAlt : ptBrDict.about.portraitAlt, description: hint }, `${locale}: assistive technology hears a button named by the portrait, described by the replay hint`);
      assert.equal(await hintExposed(page, hint), false, `${locale}: the hint is only read as the button's description`);

      const box = await frame.boundingBox();
      await page.evaluate(() => {
        const record = { pointer: null, first: null, overflow: 0, alive: 0 };
        window.__particles = record;
        document.addEventListener('pointermove', (event) => {
          record.pointer = { x: event.clientX, y: event.clientY };
        }, true);
        const layer = document.querySelector('[data-portrait-particles]');
        new MutationObserver((changes) => {
          for (const change of changes) {
            for (const node of change.addedNodes) {
              if (record.first || !record.pointer) continue;
              const rect = node.getBoundingClientRect();
              record.first = Math.hypot(rect.left + rect.width / 2 - record.pointer.x, rect.top + rect.height / 2 - record.pointer.y);
            }
          }
        }).observe(layer, { childList: true });
        const sample = () => {
          const alive = layer.childElementCount;
          if (alive > 0) record.overflow = Math.max(record.overflow, document.documentElement.scrollWidth - document.documentElement.clientWidth);
          record.alive = Math.max(record.alive, alive);
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      for (let step = 0; step < 24; step += 1) {
        await page.mouse.move(box.x + box.width * (0.25 + step * 0.02), box.y + box.height * (0.35 + step * 0.012));
        await page.waitForTimeout(14);
      }
      const particles = await page.evaluate(() => {
        const frame = document.querySelector('[data-about-portrait-frame]');
        const bounds = frame.getBoundingClientRect();
        return [...frame.querySelectorAll('[data-portrait-particles] > *')].map((particle) => {
          const rect = particle.getBoundingClientRect();
          return {
            colour: getComputedStyle(particle).backgroundColor,
            inside: rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1 && rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1,
          };
        });
      });
      assert.ok(particles.length >= 5, `${locale}: moving over the portrait sheds particles (${particles.length})`);
      for (const particle of particles) assert.ok(['rgb(254, 0, 0)', 'rgb(251, 250, 244)', 'rgb(8, 8, 8)'].includes(particle.colour), `${particle.colour} is a brand colour`);
      const record = await page.evaluate(() => window.__particles);
      assert.ok(record.first !== null && record.first <= 12, `${locale}: the first particle starts under the cursor (${record.first?.toFixed(1)} px away)`);
      assert.ok(particles.every((particle) => particle.inside), `${locale}: every particle stays inside the frame`);
      const leftAt = await page.evaluate(() => performance.now());
      await page.mouse.move(5, 5);
      await page.waitForFunction(() => document.querySelectorAll('[data-portrait-particles] > *').length === 0, null, { timeout: 3000 });
      const gone = await page.evaluate((start) => performance.now() - start, leftAt);
      assert.ok(gone <= 1100, `${locale}: particles fade within a second of the pointer leaving (${Math.round(gone)} ms)`);
      assert.equal((await page.evaluate(() => window.__particles)).overflow <= 0, true, `${locale}: particles never widen the page while they live`);
    } finally {
      await context.close();
    }
  }
});

test('reduced motion keeps the portrait still: no replay, no particles, no pointer', async () => {
  {
    const { context, page } = await openHome({ javaScriptEnabled: false });
    try {
      const frame = page.locator('[data-about-portrait-frame]');
      const plain = await frame.evaluate((element) => ({ cursor: getComputedStyle(element).cursor, role: element.getAttribute('role'), tabindex: element.getAttribute('tabindex'), describedBy: element.getAttribute('aria-describedby') }));
      assert.deepEqual(plain, { cursor: 'auto', role: null, tabindex: null, describedBy: null }, 'without JavaScript the portrait is a plain image');
      assert.equal(await hintExposed(page, ptBrDict.about.portraitReplayHint), false, 'without JavaScript the replay hint is not read');
    } finally {
      await context.close();
    }
  }
  const { context, page } = await openHome({ reducedMotion: 'reduce' });
  try {
    await scrollToPortrait(page);
    const frame = page.locator('[data-about-portrait-frame]');
    const box = await frame.boundingBox();
    for (let step = 0; step < 12; step += 1) await page.mouse.move(box.x + 40 + step * 10, box.y + 80 + step * 8);
    await frame.dblclick();
    await page.waitForTimeout(400);
    assert.equal(await page.locator('[data-dossier-cube]').count(), 0, 'no cube on double click');
    assert.equal(await page.locator('[data-portrait-particles] > *').count(), 0, 'no particles');
    const semantics = await frame.evaluate((element) => ({ cursor: getComputedStyle(element).cursor, role: element.getAttribute('role'), focusable: element.tabIndex >= 0 }));
    assert.deepEqual(semantics, { cursor: 'auto', role: null, focusable: false }, 'the still portrait does not pose as a button');
    assert.equal(await hintExposed(page, ptBrDict.about.portraitReplayHint), false, 'the replay hint is not read when nothing replays');
    const accessible = await frameAccessibility(context, page);
    assert.equal(accessible.description, '', 'the portrait carries no replay description');
  } finally {
    await context.close();
  }
});
