import { test } from 'node:test';
import assert from 'node:assert/strict';

const timing = () => import('../src/utils/intro-timing.ts');

test('C1: exit waits for fonts, avatar and the 1.2 s minimum', async () => {
  const { computeExitDelay } = await timing();

  assert.equal(computeExitDelay({ elapsedMs: 0, fontsReady: true, avatarReady: true }), 1200, 'ready at 0 ms waits the full 1.2 s minimum');
  assert.equal(computeExitDelay({ elapsedMs: 500, fontsReady: true, avatarReady: true }), 700, 'ready at 500 ms waits the remaining 700 ms');
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
