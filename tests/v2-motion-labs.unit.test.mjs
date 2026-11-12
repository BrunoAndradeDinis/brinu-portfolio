import { test } from 'node:test';
import assert from 'node:assert/strict';

test('routes share one ease and one duration', async () => {
  const { MOTION_EASE, MOTION_DURATION, gsap, p5Snap } = await import('../src/utils/motion.ts');
  assert.deepEqual(MOTION_EASE, { enter: 'p5Snap', fade: 'power2.out' });
  assert.equal(gsap.parseEase(MOTION_EASE.enter), p5Snap, 'the enter ease is the registered p5Snap curve');
  assert.equal(typeof gsap.parseEase(MOTION_EASE.fade), 'function');
  assert.deepEqual(Object.keys(MOTION_DURATION).sort(), ['ms', 'seconds']);
  assert.equal(MOTION_DURATION.ms, MOTION_DURATION.seconds * 1000, 'one duration in two units');
  assert.ok(MOTION_DURATION.ms >= 400 && MOTION_DURATION.ms <= 600, `transitions land in 400-600 ms (${MOTION_DURATION.ms})`);
});

const textType = () => import('../src/utils/text-type.ts');

test('label duration stays between 400 and 600 ms', async () => {
  const { typeDuration } = await textType();
  for (const length of [0, 1, 5, 10, 12, 15, 16, 40, 400, 5000]) {
    const duration = typeDuration(length, 'label');
    assert.ok(duration >= 400 && duration <= 600, `label of ${length} chars types in ${duration} ms`);
  }
});

test('paragraph duration is 40 ms per character capped at 4000 ms', async () => {
  const { typeDuration } = await textType();
  for (const length of [0, 1, 10, 99, 100, 101, 500, 5000]) {
    assert.equal(typeDuration(length, 'paragraph'), Math.min(4000, length * 40), `paragraph of ${length} chars`);
  }
});

test('visible characters grow from none to the full text over the duration', async () => {
  const { typeDuration, visibleChars } = await textType();
  for (const [length, kind] of [[8, 'label'], [30, 'label'], [60, 'paragraph'], [300, 'paragraph']]) {
    const duration = typeDuration(length, kind);
    assert.equal(visibleChars(length, kind, 0), 0, `${kind} ${length} starts empty`);
    assert.equal(visibleChars(length, kind, duration), length, `${kind} ${length} is complete at its duration`);
    assert.equal(visibleChars(length, kind, duration / 2), Math.floor(length / 2), `${kind} ${length} is half typed at half time`);
    let previous = 0;
    for (let elapsed = 0; elapsed <= duration; elapsed += 16) {
      const visible = visibleChars(length, kind, elapsed);
      assert.ok(visible >= previous && visible <= length, `${kind} ${length} never goes back at ${elapsed} ms`);
      previous = visible;
    }
  }
});

test('visible characters clamp outside the typing window and for empty text', async () => {
  const { visibleChars } = await textType();
  assert.equal(visibleChars(20, 'label', -50), 0);
  assert.equal(visibleChars(20, 'label', 10_000), 20);
  assert.equal(visibleChars(200, 'paragraph', 10_000), 200);
  assert.equal(visibleChars(0, 'paragraph', 0), 0);
  assert.equal(visibleChars(0, 'paragraph', 100), 0);
  assert.equal(visibleChars(0, 'label', 300), 0);
});
