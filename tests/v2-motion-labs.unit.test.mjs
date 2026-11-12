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
