import { test } from 'node:test';
import assert from 'node:assert/strict';

const sky = await import('../src/components/not-found/star-sky.ts');

test('the sky has the four layers of the prototype', () => {
  const layers = sky.createStarLayers(sky.seeded(1));
  assert.deepEqual(layers.map((layer) => layer.count), [380, 260, 120, 26]);
  assert.deepEqual(layers.map((layer) => layer.stars.length), [380, 260, 120, 26]);
  assert.deepEqual(layers.map((layer) => layer.colour), ['#FBFAF4', '#FBFAF4', '#FBFAF4', '#FE0000']);
  assert.deepEqual(layers.map((layer) => [layer.near, layer.far, layer.size, layer.opacity]), [[1500, 2400, 6, 0.55], [800, 1500, 5, 0.75], [250, 800, 4, 0.95], [400, 2000, 6, 0.9]]);
  for (const layer of layers) {
    for (const star of layer.stars) {
      assert.ok(star.depth >= layer.near && star.depth <= layer.far, 'each star sits within its layer depth');
      assert.ok(Math.abs(star.x) <= star.depth * sky.HALF_FOV_TAN * 2.6 && Math.abs(star.y) <= star.depth * sky.HALF_FOV_TAN * 1.5, 'stars spread a little wider than the view');
    }
  }
  assert.deepEqual(sky.createStarLayers(sky.seeded(1)), layers, 'the same seed gives the same sky');
});

test('the view pivots as the prototype camera does: far stars follow the pointer, near ones move against it', () => {
  const near = { x: 0, y: 0, depth: 300 };
  const far = { x: 0, y: 0, depth: 2000 };
  const at = (point, camera) => sky.project(point, camera, 1440, 900, 4);
  assert.deepEqual([at(near, { x: 0, y: 0 }).x, at(near, { x: 0, y: 0 }).y], [720, 450], 'a star straight ahead sits at the centre');
  assert.ok(at(near, { x: 0, y: 0 }).size > at(far, { x: 0, y: 0 }).size, 'near stars are larger');
  assert.equal(at(near, { x: 0, y: 0 }).size, (4 * 900) / 2 / 300, 'size attenuates with depth as the prototype sizes points');
  // Reference values from the prototype's Three.js camera at x = 70 looking at (14, 0, -1000), 1440 x 900.
  const nearMove = at(near, { x: 70, y: 0 }).x - at(near, { x: 0, y: 0 }).x;
  const farMove = at(far, { x: 70, y: 0 }).x - at(far, { x: 0, y: 0 }).x;
  assert.ok(Math.abs(farMove - 16) <= 1.5, `a star 2000 deep follows the pointer by about 16 px (${farMove.toFixed(1)})`);
  assert.ok(Math.abs(nearMove + 136) <= 2, `a star 300 deep moves against it by about 136 px (${nearMove.toFixed(1)})`);
  const pivot = { x: 0, y: 0, depth: 1250 };
  assert.ok(Math.abs(at(pivot, { x: 70, y: 0 }).x - 720) < 0.5, 'a star 1250 deep, the pivot, stays put');
  assert.ok(at(near, { x: 0, y: 45 }).y > 450 && at(far, { x: 0, y: 45 }).y < 450, 'raising the view moves near stars down and far stars up');
});

test('the camera eases toward the pointer within 70 by 45', () => {
  let camera = { x: 0, y: 0 };
  for (let step = 0; step < 2000; step += 1) camera = sky.easeCamera(camera, { x: 5, y: -5 });
  assert.ok(Math.abs(camera.x - 70) < 0.01 && Math.abs(camera.y + 45) < 0.01, `the camera settles at the bound (${camera.x}, ${camera.y})`);
  const first = sky.easeCamera({ x: 0, y: 0 }, { x: 1, y: 1 });
  assert.ok(first.x > 0 && first.x < 70 * 0.05, 'one frame moves only a small step toward the pointer');
});

test('layers breathe between 56% and 100% of their opacity', () => {
  const layer = { opacity: 0.8, phase: 0.3, speed: 0.4 };
  const values = Array.from({ length: 400 }, (_, step) => sky.twinkle(layer, step * 0.05));
  assert.ok(Math.min(...values) >= 0.8 * 0.56 - 1e-9 && Math.max(...values) <= 0.8 + 1e-9);
  assert.ok(Math.min(...values) < 0.8 * 0.6, 'it reaches down near 56%');
  assert.ok(Math.max(...values) - Math.min(...values) > 0.8 * 0.4, 'the breathing is visible');
});

test('shooting stars cross from the corner away from the pointer and fade in and out', () => {
  const random = sky.seeded(7);
  for (const pointer of [{ x: 0.6, y: 0.4 }, { x: -0.6, y: -0.4 }]) {
    for (let index = 0; index < 50; index += 1) {
      const shot = sky.spawnShot(random, pointer, 1.6);
      assert.ok(shot.depth >= 500 && shot.depth <= 1800);
      assert.ok(shot.length >= 140 && shot.length <= 260);
      assert.ok(shot.life >= 13 && shot.life <= 18);
      assert.equal(Math.sign(shot.x), -Math.sign(pointer.x), 'it starts on the side away from the pointer');
      assert.equal(Math.sign(shot.y), -Math.sign(pointer.y), 'it starts above or below, away from the pointer');
      assert.equal(Math.sign(shot.vx), Math.sign(pointer.x), 'it travels across the view');
      assert.equal(Math.sign(shot.vy), Math.sign(pointer.y), 'and toward the pointer\'s side vertically');
    }
  }
  assert.equal(sky.shotOpacity({ age: 0, life: 15 }), 0);
  assert.equal(sky.shotOpacity({ age: 5, life: 15 }), 0.9);
  assert.equal(sky.shotOpacity({ age: 15, life: 15 }), 0);
});

test('the schedule keeps at most five shots, spawning every three to six seconds', () => {
  const random = sky.seeded(3);
  const schedule = { shots: [], next: sky.FIRST_SHOT_AT };
  const dt = 1 / 60;
  const spawns = [];
  let most = 0;
  for (let step = 1; step <= 60 * 240; step += 1) {
    const before = schedule.shots.length;
    const time = step * dt;
    if (sky.advanceShots(schedule, dt, random, { x: 0.4, y: -0.2 }, 1.6)) spawns.push({ time, before });
    most = Math.max(most, schedule.shots.length);
  }
  assert.ok(Math.abs(spawns[0].time - sky.FIRST_SHOT_AT) <= dt + 1e-9, `the first shot comes at 2.5 s (${spawns[0].time.toFixed(2)})`);
  assert.ok(most <= 5, `never more than five in flight (${most})`);

  const full = { shots: Array.from({ length: 5 }, (_, index) => ({ x: 0, y: 0, depth: 900, vx: 1, vy: 1, length: 200, age: 0, life: 10 + index })), next: 0.5 };
  assert.equal(sky.advanceShots(full, 1, random, { x: 0.4, y: -0.2 }, 1.6), null, 'a full sky spawns nothing when the gap runs out');
  assert.equal(full.shots.length, 5);
  assert.ok(full.next < 0, 'the overdue spawn waits');
  for (let second = 2; second <= 9; second += 1) sky.advanceShots(full, 1, random, { x: 0.4, y: -0.2 }, 1.6);
  assert.equal(full.shots.length, 5, 'still full while every shot lives');
  sky.advanceShots(full, 1.5, random, { x: 0.4, y: -0.2 }, 1.6);
  assert.equal(full.shots.length, 4, 'the oldest shot ends');
  assert.ok(sky.advanceShots(full, dt, random, { x: 0.4, y: -0.2 }, 1.6), 'the waiting shot spawns on the next frame');
  for (let index = 1; index < spawns.length; index += 1) {
    const gap = spawns[index].time - spawns[index - 1].time;
    assert.ok(gap >= 3 - dt - 1e-9, `gap ${gap.toFixed(2)} s is at least three seconds`);
    if (gap > 6 + dt + 1e-9) assert.equal(spawns[index].before, sky.MAX_SHOTS - 1, `a gap of ${gap.toFixed(2)} s only follows a full sky`);
  }
  const free = spawns.slice(1).map((entry, index) => entry.time - spawns[index].time).filter((gap) => gap <= 6 + dt);
  assert.ok(free.length > 10 && Math.max(...free) > 5 && Math.min(...free) < 4, 'gaps spread across three to six seconds');
});
