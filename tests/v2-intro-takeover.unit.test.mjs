import { test } from 'node:test';
import assert from 'node:assert/strict';

const timing = () => import('../src/utils/intro-timing.ts');

test('C1: exit waits for fonts, avatar and the 1.2 s minimum', async () => {
  const { computeExitDelay } = await timing();

  assert.equal(computeExitDelay({ elapsedMs: 0, fontsReady: true, avatarReady: true }), 1200, 'ready at 0 ms waits the full 1.2 s minimum');
  assert.equal(computeExitDelay({ elapsedMs: 500, fontsReady: true, avatarReady: true }), 700, 'ready at 500 ms waits the remaining 700 ms');
  assert.equal(computeExitDelay({ elapsedMs: 1199, fontsReady: true, avatarReady: true }), 1, 'one millisecond before the minimum still waits');
  assert.equal(computeExitDelay({ elapsedMs: 1200, fontsReady: true, avatarReady: true }), 0, 'ready at 1.2 s exits now');
  assert.equal(computeExitDelay({ elapsedMs: 2400, fontsReady: true, avatarReady: true }), 0, 'ready after the minimum exits now');

  assert.ok(computeExitDelay({ elapsedMs: 1500, fontsReady: false, avatarReady: true }) > 0, 'fonts pending keeps the preloader past the minimum');
  assert.ok(computeExitDelay({ elapsedMs: 1500, fontsReady: true, avatarReady: false }) > 0, 'avatar pending keeps the preloader past the minimum');
  assert.ok(computeExitDelay({ elapsedMs: 1500, fontsReady: false, avatarReady: false }) > 0, 'both pending keeps the preloader past the minimum');
});

test('C2: exit starts at the 3 s cap when fonts or avatar never load', async () => {
  const { computeExitDelay, INTRO_CAP_MS } = await timing();

  assert.equal(INTRO_CAP_MS, 3000);
  assert.equal(computeExitDelay({ elapsedMs: 0, fontsReady: false, avatarReady: false }), 3000, 'nothing ready at 0 ms waits until the cap');
  assert.equal(computeExitDelay({ elapsedMs: 2000, fontsReady: false, avatarReady: true }), 1000, 'remaining time never passes the cap');
  assert.equal(computeExitDelay({ elapsedMs: 2999, fontsReady: false, avatarReady: true }), 1, 'one millisecond before the cap still waits');
  assert.equal(computeExitDelay({ elapsedMs: 3000, fontsReady: false, avatarReady: false }), 0, 'cap reached exits now');
  assert.equal(computeExitDelay({ elapsedMs: 4500, fontsReady: false, avatarReady: false }), 0, 'past the cap exits now');
});

test('intro mode and duration budgets follow the spec', async () => {
  const { resolveIntroMode, EXIT_MAX_MS, SKIP_MAX_MS, SHORT_EXIT_MS, REDUCED_FADE_MS } = await timing();

  assert.equal(resolveIntroMode({ reducedMotion: true, seenThisSession: true }), 'reduced');
  assert.equal(resolveIntroMode({ reducedMotion: true, seenThisSession: false }), 'reduced');
  assert.equal(resolveIntroMode({ reducedMotion: false, seenThisSession: true }), 'short');
  assert.equal(resolveIntroMode({ reducedMotion: false, seenThisSession: false }), 'full');
  assert.equal(EXIT_MAX_MS, 1400);
  assert.equal(SKIP_MAX_MS, 700);
  assert.equal(SHORT_EXIT_MS, 600);
  assert.equal(REDUCED_FADE_MS, 200);
});

test('C8: scroll lock is set and released only through motion.ts', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const motion = fs.readFileSync('src/utils/motion.ts', 'utf8');
  assert.match(motion, /export function pauseScroll\(/);
  assert.match(motion, /export function resumeScroll\(/);

  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx|astro)$/.test(entry.name)) files.push(full);
    }
  };
  walk('src');

  const lenisUsers = files.filter((f) => /from ['"]lenis['"]|new Lenis\(|getLenis\(/.test(fs.readFileSync(f, 'utf8')));
  assert.deepEqual(lenisUsers, ['src/utils/motion.ts'], 'only motion.ts may touch Lenis');
  const lockUsers = files.filter((f) => /\b(pauseScroll|resumeScroll)\(/.test(fs.readFileSync(f, 'utf8'))).sort();
  assert.deepEqual(lockUsers, ['src/components/IntroPreloader.astro', 'src/utils/motion.ts']);

  const preloader = fs.readFileSync('src/components/IntroPreloader.astro', 'utf8');
  assert.match(preloader, /import \{ pauseScroll, resumeScroll \} from ["']\.\.\/utils\/motion["']/);
  assert.match(preloader, /pauseScroll\(\)/);
  assert.match(preloader, /resumeScroll\(\)/);
  for (const file of ['src/utils/intro-takeover.ts', 'src/utils/intro-timing.ts']) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /lenis-stopped|\.stop\(\)/, `${file} must not toggle the lock`);
  }
});
