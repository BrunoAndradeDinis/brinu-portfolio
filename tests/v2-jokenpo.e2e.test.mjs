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

const GAME_CHUNK = /\/_astro\/jokenpo-game\.[\w-]+\.js$/;
const CHOICES = ['pedra', 'papel', 'tesoura'];

async function openHome({ viewport = { width: 1440, height: 900 }, locale = 'pt-br', ...options } = {}) {
  const context = await browser.newContext({ viewport, ...options });
  await context.addInitScript((loc) => {
    window.localStorage.setItem('brinu_locale', loc);
    const real = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = (array) => {
      if (array instanceof Uint32Array && array.length === 1 && typeof window.__cpu === 'number') {
        array[0] = Math.floor((window.__cpu + 0.5) * 2 ** 32 / 3);
        return array;
      }
      return real(array);
    };
  }, locale);
  const page = await context.newPage();
  const chunks = [];
  page.on('request', (request) => {
    if (GAME_CHUNK.test(new URL(request.url()).pathname)) chunks.push(request.url());
  });
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.getElementById('intro-preloader')?.click());
  await page.waitForFunction(() => document.documentElement.classList.contains('intro-completed'), null, { timeout: 15000 });
  return { context, page, chunks };
}

async function toPanel(page) {
  await page.evaluate(() => {
    const el = document.querySelector('[data-jokenpo]');
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 40);
  });
  await page.waitForFunction(() => document.querySelector('[data-jokenpo]').dataset.jokenpoState === 'ready', null, { timeout: 10000 });
}

const panel = (page) => page.evaluate(() => {
  const root = document.querySelector('[data-jokenpo]');
  const text = (selector) => root.querySelector(selector)?.textContent.trim() ?? '';
  return {
    state: root.dataset.jokenpoState,
    result: root.querySelector('[data-jk-splash]').dataset.result ?? null,
    splash: text('[data-jk-splash]'),
    live: text('[data-jk-result]'),
    player: text('[data-jk-pick="player"]'),
    cpu: text('[data-jk-pick="cpu"]'),
    score: ['win', 'draw', 'lose'].map((key) => text(`[data-jk-score="${key}"]`)).join('/'),
  };
});

async function playRound(page, player, cpu) {
  await page.evaluate((index) => { window.__cpu = index; }, CHOICES.indexOf(cpu));
  await page.locator(`[data-jk-choice="${player}"]`).click();
  await page.waitForFunction(() => document.querySelector('[data-jokenpo]').dataset.jokenpoState === 'ready');
}

test('JK-01: the game chunk stays out of the first load and arrives near the contact panel', async () => {
  const { context, page, chunks } = await openHome();
  try {
    await page.waitForTimeout(800);
    assert.deepEqual(chunks, [], 'no game chunk on first load');
    assert.equal(await page.locator('[data-jk-choice]').first().isDisabled(), true, 'choices wait for the game');
    await toPanel(page);
    assert.equal(chunks.length, 1, 'game chunk loads once near the panel');
    assert.equal(await page.locator('[data-jk-choice]').first().isDisabled(), false);
  } finally {
    await context.close();
  }
});

test('JK-02: the TAKE YOUR TIME title renders as tilted plates, animates, and stays still with reduced motion', async () => {
  const read = (page) => page.evaluate(() => {
    const title = document.querySelector('[data-jk-title]');
    return {
      label: title.getAttribute('aria-label'),
      chars: [...title.querySelectorAll('[data-jk-char]')].map((char) => char.textContent).join(''),
      plates: new Set([...title.querySelectorAll('[data-jk-char]')].map((char) => getComputedStyle(char).backgroundColor)).size,
      transforms: [...title.querySelectorAll('[data-jk-char]')].map((char) => getComputedStyle(char).transform).join('|'),
    };
  });

  const moving = await openHome();
  try {
    await toPanel(moving.page);
    await moving.page.waitForTimeout(1500);
    const first = await read(moving.page);
    assert.deepEqual({ label: first.label, chars: first.chars, plates: first.plates }, { label: 'TAKE YOUR TIME', chars: 'TAKEYOURTIME', plates: 3 });
    let changed = false;
    for (let tries = 0; tries < 12 && !changed; tries += 1) {
      await moving.page.waitForTimeout(250);
      changed = (await read(moving.page)).transforms !== first.transforms;
    }
    assert.equal(changed, true, 'the letters jitter while idle');
  } finally {
    await moving.context.close();
  }

  const still = await openHome({ reducedMotion: 'reduce' });
  try {
    await toPanel(still.page);
    const first = await read(still.page);
    await still.page.waitForTimeout(2000);
    assert.equal((await read(still.page)).transforms, first.transforms, 'the title is static with reduced motion');
    assert.equal(first.chars, 'TAKEYOURTIME');
  } finally {
    await still.context.close();
  }
});

test('JK-03: every play resolves against the CPU, the score adds up and the reset zeroes it', async () => {
  const { context, page } = await openHome({ reducedMotion: 'reduce' });
  try {
    await toPanel(page);
    const expected = {
      pedra: { pedra: 'empate', papel: 'derrota', tesoura: 'vitoria' },
      papel: { pedra: 'vitoria', papel: 'empate', tesoura: 'derrota' },
      tesoura: { pedra: 'derrota', papel: 'vitoria', tesoura: 'empate' },
    };
    const words = { vitoria: 'VITÓRIA', derrota: 'DERROTA', empate: 'EMPATE' };
    const labels = { pedra: 'PEDRA', papel: 'PAPEL', tesoura: 'TESOURA' };
    for (const player of CHOICES) {
      for (const cpu of CHOICES) {
        await playRound(page, player, cpu);
        const state = await panel(page);
        const result = expected[player][cpu];
        assert.deepEqual({ result: state.result, splash: state.splash, player: state.player, cpu: state.cpu }, { result, splash: words[result], player: labels[player], cpu: labels[cpu] }, `${player} vs ${cpu}`);
      }
    }
    assert.equal((await panel(page)).score, '3/3/3', 'three wins, three draws, three losses');
    await page.locator('[data-jk-reset]').click();
    const reset = await panel(page);
    assert.deepEqual({ score: reset.score, result: reset.result, live: reset.live, player: reset.player }, { score: '0/0/0', result: null, live: '', player: '- - -' });
  } finally {
    await context.close();
  }
});

test('JK-04: keys 1, 2 and 3 play from the focused panel, with a visible focus ring, and the result is announced', async () => {
  const { context, page } = await openHome({ reducedMotion: 'reduce' });
  try {
    await toPanel(page);
    await page.locator('[data-jk-choice="pedra"]').focus();
    await page.keyboard.press('Tab');
    const ring = await page.evaluate(() => {
      const focused = document.activeElement;
      return { choice: focused.dataset.jkChoice, outline: getComputedStyle(focused).outlineStyle, width: getComputedStyle(focused).outlineWidth };
    });
    assert.deepEqual(ring, { choice: 'papel', outline: 'solid', width: '3px' });

    await page.evaluate(() => { window.__cpu = 0; });
    await page.keyboard.press('2');
    await page.waitForFunction(() => document.querySelector('[data-jokenpo]').dataset.jokenpoState === 'ready');
    let state = await panel(page);
    assert.equal(state.player, 'PAPEL');
    assert.equal(state.result, 'vitoria');
    assert.equal(await page.locator('[data-jk-result]').getAttribute('aria-live'), 'polite');
    assert.equal(state.live, 'PAPEL × PEDRA — Você ganhou!');

    await page.evaluate(() => { window.__cpu = 0; });
    await page.keyboard.press('3');
    await page.waitForFunction(() => document.querySelector('[data-jokenpo]').dataset.jokenpoState === 'ready');
    state = await panel(page);
    assert.equal(state.live, 'TESOURA × PEDRA — Você perdeu!');
    assert.equal(state.score, '1/0/1');

    await page.locator('#dispatch-name').focus();
    await page.keyboard.press('1');
    assert.equal((await panel(page)).score, '1/0/1', 'keys outside the panel do not play');
  } finally {
    await context.close();
  }
});

test('JK-05: with motion the round counts JO-KEN-PÔ and lands the splash with no arena overlay; with reduced motion it lands at once', async () => {
  const moving = await openHome();
  try {
    await toPanel(moving.page);
    await moving.page.evaluate(() => { window.__cpu = 2; });
    await moving.page.locator('[data-jk-choice="pedra"]').click();
    const beats = new Set();
    let covers = 0;
    for (let tries = 0; tries < 30 && (await panel(moving.page)).state !== 'ready'; tries += 1) {
      beats.add(await moving.page.locator('[data-jk-count]').textContent());
      covers += await moving.page.evaluate(() => {
        const arena = document.querySelector('[data-jk-arena]');
        const box = arena.getBoundingClientRect();
        return [...arena.querySelectorAll('*')].filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width >= box.width * 0.9 && rect.height >= box.height * 0.9 && getComputedStyle(el).backgroundColor === 'rgb(254, 0, 0)';
        }).length;
      });
      await moving.page.waitForTimeout(40);
    }
    assert.ok(['JO', 'KEN', 'PÔ!'].some((beat) => beats.has(beat)), `countdown shows, saw ${[...beats]}`);
    assert.equal(covers, 0, 'no red overlay sweeps the arena during the reveal');
    assert.equal(await moving.page.locator('[data-jk-wipe]').count(), 0, 'the wipe element is gone');
    await moving.page.waitForFunction(() => document.querySelector('[data-jokenpo]').dataset.jokenpoState === 'ready');
    assert.equal((await panel(moving.page)).result, 'vitoria');
  } finally {
    await moving.context.close();
  }

  const still = await openHome({ reducedMotion: 'reduce' });
  try {
    await toPanel(still.page);
    await still.page.evaluate(() => { window.__cpu = 1; });
    await still.page.locator('[data-jk-choice="pedra"]').click();
    const state = await panel(still.page);
    assert.equal(state.state, 'ready', 'no countdown with reduced motion');
    assert.equal(state.result, 'derrota');
    assert.equal(await still.page.locator('[data-jk-count]').evaluate((el) => getComputedStyle(el).visibility), 'hidden');
  } finally {
    await still.context.close();
  }
});

test('JK-06: the game copy switches between pt and en, including the last round', async () => {
  const { context, page } = await openHome({ reducedMotion: 'reduce' });
  try {
    await toPanel(page);
    await playRound(page, 'tesoura', 'papel');
    const copy = () => page.evaluate(() => {
      const root = document.querySelector('[data-jokenpo]');
      return {
        kicker: root.querySelector('[data-i18n="jokenpo.kicker"]').textContent.trim(),
        labels: [...root.querySelectorAll('.jk-choice-label')].map((label) => label.textContent.trim()).join(','),
        reset: root.querySelector('[data-jk-reset]').textContent.trim(),
        splash: root.querySelector('[data-jk-splash]').textContent.trim(),
        live: root.querySelector('[data-jk-result]').textContent.trim(),
      };
    });
    assert.deepEqual(await copy(), { kicker: 'MINIGAME // JOKENPÔ', labels: 'PEDRA,PAPEL,TESOURA', reset: 'Reiniciar jogo', splash: 'VITÓRIA', live: 'TESOURA × PAPEL — Você ganhou!' });
    await page.locator('#cockpit-trigger-btn').click();
    await page.locator('[data-cockpit-lang="en"]').click();
    await page.waitForFunction(() => document.documentElement.getAttribute('data-locale') === 'en');
    await page.waitForTimeout(300);
    assert.deepEqual(await copy(), { kicker: 'MINIGAME // ROCK PAPER SCISSORS', labels: 'ROCK,PAPER,SCISSORS', reset: 'Restart game', splash: 'VICTORY', live: 'SCISSORS × PAPER — You won!' });
  } finally {
    await context.close();
  }
});

test('JK-07: the panel fits from 320 to 2560px in pt and en, beside the form on desktop and after it on phones', async () => {
  for (const locale of ['pt-br', 'en']) {
    for (const width of [320, 375, 768, 1024, 1440, 2560]) {
      const { context, page } = await openHome({ viewport: { width, height: 900 }, locale, reducedMotion: 'reduce' });
      try {
        await toPanel(page);
        await playRound(page, 'tesoura', 'pedra');
        const fit = await page.evaluate(() => {
          const root = document.querySelector('[data-jokenpo]');
          const box = root.getBoundingClientRect();
          const form = document.getElementById('bounty-dispatch-container').getBoundingClientRect();
          const issues = [];
          root.querySelectorAll('.jk-kicker, .jk-char, .jk-pick, .jk-result, .jk-prompt, .jk-choice-label, .jk-tally, .jk-reset, .jk-splash span, .jk-slot, .jk-icon, .jk-avatar').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (!r.width) return;
            if (r.left < box.left - 1 || r.right > box.right + 1 || r.top < box.top - 1 || r.bottom > box.bottom + 1) issues.push(`outside ${el.className}`);
          });
          root.querySelectorAll('.jk-choice-label, .jk-pick').forEach((el) => {
            if (el.getBoundingClientRect().height > parseFloat(getComputedStyle(el).fontSize) * 1.6) issues.push(`wraps ${el.textContent}`);
          });
          return {
            issues,
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            beside: box.right <= form.left + 1 && Math.abs(box.bottom - form.bottom) <= 2,
            after: box.top >= form.bottom,
          };
        });
        assert.deepEqual(fit.issues, [], `${locale} ${width}px: every text fits the panel`);
        assert.equal(fit.overflow, false, `${locale} ${width}px: no horizontal overflow`);
        if (width >= 1024) assert.equal(fit.beside, true, `${locale} ${width}px: beside the form and as tall`);
        else assert.equal(fit.after, true, `${locale} ${width}px: after the form`);
      } finally {
        await context.close();
      }
    }
  }
});

test('JK-08: the pirate logos carry the names, the loser dims to half, nothing dims on a draw, and the splash sits level with the logos', async () => {
  const { context, page } = await openHome({ reducedMotion: 'reduce' });
  try {
    await toPanel(page);
    const arena = () => page.evaluate(() => {
      const root = document.querySelector('[data-jokenpo]');
      const opacity = (selector) => Number(getComputedStyle(root.querySelector(selector)).opacity);
      const logos = [...root.querySelectorAll('[data-jk-avatar]')];
      const word = root.querySelector('[data-jk-splash] span');
      const wordBox = word?.getBoundingClientRect();
      const logoBox = logos[0].getBoundingClientRect();
      const cardTop = root.querySelector('.jk-slot').getBoundingClientRect().top;
      return {
        alts: logos.map((logo) => logo.alt),
        visibleNames: root.querySelectorAll('.jk-name').length,
        player: [opacity('[data-jk-avatar="player"]'), opacity('[data-jk-side="player"]')],
        cpu: [opacity('[data-jk-avatar="cpu"]'), opacity('[data-jk-side="cpu"]')],
        grey: getComputedStyle(root.querySelector('[data-jk-side="player"]')).filter,
        level: wordBox ? wordBox.bottom > logoBox.top && wordBox.top < logoBox.bottom : null,
        clearOfCards: wordBox ? wordBox.bottom <= cardTop + 2 : null,
        clearOfLogos: wordBox ? logos.every((logo) => {
          const box = logo.getBoundingClientRect();
          return wordBox.right <= box.left || wordBox.left >= box.right || wordBox.bottom <= box.top || wordBox.top >= box.bottom;
        }) : null,
      };
    });

    const idle = await arena();
    assert.deepEqual({ alts: idle.alts, visibleNames: idle.visibleNames, player: idle.player, cpu: idle.cpu }, { alts: ['Você — Chapéus de Palha', 'Computador — Franky'], visibleNames: 0, player: [1, 1], cpu: [1, 1] });

    await playRound(page, 'tesoura', 'pedra');
    const loss = await arena();
    assert.deepEqual({ player: loss.player, cpu: loss.cpu, grey: loss.grey }, { player: [0.5, 0.5], cpu: [1, 1], grey: 'grayscale(1)' }, 'the player dims on a loss');
    assert.deepEqual({ level: loss.level, clearOfCards: loss.clearOfCards, clearOfLogos: loss.clearOfLogos }, { level: true, clearOfCards: true, clearOfLogos: true });

    await playRound(page, 'papel', 'pedra');
    const win = await arena();
    assert.deepEqual({ player: win.player, cpu: win.cpu }, { player: [1, 1], cpu: [0.5, 0.5] }, 'the CPU dims on a win');

    await playRound(page, 'pedra', 'pedra');
    const draw = await arena();
    assert.deepEqual({ player: draw.player, cpu: draw.cpu }, { player: [1, 1], cpu: [1, 1] }, 'nobody dims on a draw');

    await playRound(page, 'tesoura', 'pedra');
    await page.locator('[data-jk-reset]').click();
    assert.deepEqual((await arena()).player, [1, 1], 'reset clears the dim');

    await page.locator('#cockpit-trigger-btn').click();
    await page.locator('[data-cockpit-lang="en"]').click();
    await page.waitForFunction(() => document.documentElement.getAttribute('data-locale') === 'en');
    assert.deepEqual((await arena()).alts, ['You — Straw Hats', 'Computer — Franky']);
  } finally {
    await context.close();
  }
});

const crestInset = () => {
  const root = document.querySelector('[data-jokenpo]');
  const arena = root.querySelector('[data-jk-arena]').getBoundingClientRect();
  const topY = (x) => arena.top + arena.height * 0.03 * (1 - (x - arena.left) / arena.width);
  const leftX = (y) => arena.left + arena.width * 0.01 * Math.max(0, (y - arena.top - 0.03 * arena.height) / (0.94 * arena.height));
  const rightX = (y) => arena.right - arena.width * 0.01 * ((y - arena.top) / arena.height);
  const player = root.querySelector('[data-jk-crest="player"]').getBoundingClientRect();
  const cpu = root.querySelector('[data-jk-crest="cpu"]').getBoundingClientRect();
  return {
    top: Math.min(player.top - topY(player.left), cpu.top - topY(cpu.right)),
    side: Math.min(player.left - leftX(player.top), rightX(cpu.top) - cpu.right),
  };
};

const crestMotion = (page) => page.evaluate(() => {
  const root = document.querySelector('[data-jokenpo]');
  const translateY = (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform === 'none' ? undefined : getComputedStyle(el).transform).m42;
  return {
    playerY: Math.round(translateY(root.querySelector('[data-jk-crest="player"]'))),
    cpuY: Math.round(translateY(root.querySelector('[data-jk-crest="cpu"]'))),
    playerTransform: getComputedStyle(root.querySelector('[data-jk-crest="player"]')).transform,
    cpuTransform: getComputedStyle(root.querySelector('[data-jk-crest="cpu"]')).transform,
  };
});

test('JK-09: the pirate logos sit 2rem inside the plate edge, play their result tweens and reset between rounds', async () => {
  for (const [width, minSide] of [[1440, 32], [1024, 32], [768, 32], [375, 16]]) {
    const { context, page } = await openHome({ viewport: { width, height: 900 } });
    try {
      await toPanel(page);
      const inset = await page.evaluate(crestInset);
      assert.ok(inset.top >= 32, `${width}px: logos sit ${Math.round(inset.top)}px below the plate edge`);
      assert.ok(inset.side >= minSide, `${width}px: logos sit ${Math.round(inset.side)}px from the plate side`);
    } finally {
      await context.close();
    }
  }

  const { context, page } = await openHome();
  try {
    await toPanel(page);
    await playRound(page, 'tesoura', 'pedra');
    await page.waitForTimeout(1200);
    const lost = await crestMotion(page);
    assert.equal(lost.playerY, 6, 'the losing logo slumps 6px');
    assert.equal(lost.cpuY, 0, 'the winning logo lands back at rest');

    await page.evaluate(() => { window.__cpu = 0; });
    await page.locator('[data-jk-choice="papel"]').click();
    const next = await crestMotion(page);
    assert.deepEqual({ player: next.playerTransform, cpu: next.cpuTransform }, { player: 'none', cpu: 'none' }, 'a new round clears the previous tweens');
    await page.waitForFunction(() => document.querySelector('[data-jokenpo]').dataset.jokenpoState === 'ready');
    await page.waitForTimeout(1200);
    assert.equal((await crestMotion(page)).cpuY, 6, 'the CPU slumps after losing');

    await page.locator('[data-jk-reset]').click();
    const reset = await crestMotion(page);
    assert.deepEqual({ player: reset.playerTransform, cpu: reset.cpuTransform }, { player: 'none', cpu: 'none' }, 'reset clears the tweens');
  } finally {
    await context.close();
  }
});

test('JK-10: with reduced motion the logos stay still on hover and after a round, and only the dim remains', async () => {
  const { context, page } = await openHome({ reducedMotion: 'reduce' });
  try {
    await toPanel(page);
    await page.locator('[data-jk-avatar="player"]').hover();
    await page.waitForTimeout(400);
    assert.equal(await page.locator('[data-jk-avatar="player"]').evaluate((el) => getComputedStyle(el).transform), 'none', 'no hover motion');
    await playRound(page, 'tesoura', 'pedra');
    await page.waitForTimeout(800);
    const still = await crestMotion(page);
    assert.deepEqual({ player: still.playerTransform, cpu: still.cpuTransform }, { player: 'none', cpu: 'none' }, 'no result motion');
    assert.equal(await page.locator('[data-jk-avatar="player"]').evaluate((el) => getComputedStyle(el).opacity), '0.5', 'the loser is still dimmed');
  } finally {
    await context.close();
  }
});

test('JK-11: hovering a pirate logo tilts and scales it, and leaving restores it', async () => {
  const { context, page } = await openHome();
  try {
    await toPanel(page);
    const logo = page.locator('[data-jk-avatar="cpu"]');
    await logo.hover();
    await page.waitForTimeout(500);
    const scale = await logo.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a);
    assert.ok(scale > 1, `hover enlarges the logo (${scale})`);
    await page.mouse.move(5, 5);
    await page.waitForTimeout(500);
    const rest = await logo.evaluate((el) => { const m = new DOMMatrixReadOnly(getComputedStyle(el).transform); return Math.round(Math.hypot(m.a, m.b) * 100) / 100; });
    assert.equal(rest, 1, 'leaving restores the size');
  } finally {
    await context.close();
  }
});

const choiceLook = (page, choice) => page.locator(`[data-jk-choice="${choice}"]`).evaluate((el) => {
  const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform === 'none' ? undefined : getComputedStyle(el).transform);
  return {
    lift: Math.round(matrix.m42),
    scale: Math.round(matrix.a * 100) / 100,
    shadow: getComputedStyle(el).getPropertyValue('--jk-shadow').trim(),
  };
});

test('JK-12: the choice cards lift with a red shadow on hover and keyboard focus, gently when selected, never mid-round, and only change colour with reduced motion', async () => {
  const { context, page } = await openHome();
  try {
    await toPanel(page);
    assert.deepEqual(await choiceLook(page, 'pedra'), { lift: 0, scale: 1, shadow: '0px' }, 'cards rest flat');

    await page.locator('[data-jk-choice="pedra"]').hover();
    await page.waitForTimeout(450);
    assert.deepEqual(await choiceLook(page, 'pedra'), { lift: -6, scale: 1.04, shadow: '7px' }, 'hover lifts the card and grows the shadow');
    await page.mouse.move(2, 2);
    await page.waitForTimeout(450);
    assert.deepEqual(await choiceLook(page, 'pedra'), { lift: 0, scale: 1, shadow: '0px' }, 'leaving restores it');

    await page.locator('[data-jk-choice="pedra"]').focus();
    await page.keyboard.press('Tab');
    await page.waitForTimeout(450);
    assert.deepEqual(await choiceLook(page, 'papel'), { lift: -6, scale: 1.04, shadow: '7px' }, 'keyboard focus gets the same lift');

    await page.evaluate(() => { window.__cpu = 0; });
    await page.locator('[data-jk-choice="tesoura"]').hover();
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(150);
    assert.deepEqual(await choiceLook(page, 'tesoura'), { lift: 0, scale: 1, shadow: '0px' }, 'no lift while the round runs');
    await page.waitForFunction(() => document.querySelector('[data-jokenpo]').dataset.jokenpoState === 'ready');
    await page.mouse.move(2, 2);
    await page.locator('[data-jk-choice="tesoura"]').hover();
    await page.waitForTimeout(450);
    assert.deepEqual(await choiceLook(page, 'tesoura'), { lift: -3, scale: 1.02, shadow: '4px' }, 'the selected card lifts gently');
  } finally {
    await context.close();
  }

  const still = await openHome({ reducedMotion: 'reduce' });
  try {
    await toPanel(still.page);
    await still.page.locator('[data-jk-choice="papel"]').hover();
    await still.page.waitForTimeout(300);
    const look = await choiceLook(still.page, 'papel');
    assert.deepEqual({ lift: look.lift, scale: look.scale }, { lift: 0, scale: 1 }, 'no movement with reduced motion');
    assert.equal(look.shadow, '7px', 'the shadow still marks the hover');
  } finally {
    await still.context.close();
  }
});

test('JK-13: a loss plays the defeat sound, a win the bounty arpeggio and a draw neither', async () => {
  const { context, page } = await openHome({ reducedMotion: 'reduce' });
  try {
    await toPanel(page);
    await page.evaluate(() => {
      window.__sounds = [];
      const audio = window.bebopAudio;
      for (const name of ['playBountyLost', 'playBountyAcquired']) {
        const original = audio[name].bind(audio);
        audio[name] = () => {
          window.__sounds.push(name);
          original();
        };
      }
    });
    const sounds = async (player, cpu) => {
      await page.evaluate(() => { window.__sounds = []; });
      await playRound(page, player, cpu);
      return page.evaluate(() => window.__sounds);
    };
    assert.deepEqual(await sounds('tesoura', 'pedra'), ['playBountyLost']);
    assert.deepEqual(await sounds('pedra', 'tesoura'), ['playBountyAcquired']);
    assert.deepEqual(await sounds('papel', 'papel'), []);
  } finally {
    await context.close();
  }
});
