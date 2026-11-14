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

test('nearer stars are larger and move more with the camera', () => {
  const near = { x: 0, y: 0, depth: 300 };
  const far = { x: 0, y: 0, depth: 2000 };
  const at = (point, camera) => sky.project(point, camera, 1440, 900, 4);
  assert.deepEqual([at(near, { x: 0, y: 0 }).x, at(near, { x: 0, y: 0 }).y], [720, 450], 'a star straight ahead sits at the centre');
  assert.ok(at(near, { x: 0, y: 0 }).size > at(far, { x: 0, y: 0 }).size, 'near stars are larger');
  assert.equal(at(near, { x: 0, y: 0 }).size, (4 * 900) / 2 / 300, 'size attenuates with depth as the prototype sizes points');
  const nearShift = at(near, { x: 0, y: 0 }).x - at(near, { x: 70, y: 0 }).x;
  const farShift = at(far, { x: 0, y: 0 }).x - at(far, { x: 70, y: 0 }).x;
  assert.ok(nearShift > 0 && farShift > 0, 'stars move against the camera');
  assert.ok(nearShift > farShift * 5, `near stars move more (${nearShift.toFixed(1)} vs ${farShift.toFixed(1)} px)`);
  assert.ok(at(near, { x: 0, y: 45 }).y > 450, 'raising the camera moves stars down the screen');
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

test('shooting stars cross from the side away from the pointer and fade in and out', () => {
  const random = sky.seeded(7);
  for (const pointer of [{ x: 0.6, y: 0.4 }, { x: -0.6, y: -0.4 }]) {
    for (let index = 0; index < 50; index += 1) {
      const shot = sky.spawnShot(random, pointer, 1.6);
      assert.ok(shot.depth >= 500 && shot.depth <= 1800);
      assert.ok(shot.length >= 140 && shot.length <= 260);
      assert.ok(shot.life >= 13 && shot.life <= 18);
      assert.equal(Math.sign(shot.x), -Math.sign(pointer.x), 'it starts on the side away from the pointer');
      assert.equal(Math.sign(shot.vx), Math.sign(pointer.x), 'it travels across the view');
    }
  }
  assert.equal(sky.shotOpacity({ age: 0, life: 15 }), 0);
  assert.equal(sky.shotOpacity({ age: 5, life: 15 }), 0.9);
  assert.equal(sky.shotOpacity({ age: 15, life: 15 }), 0);
  assert.equal(sky.MAX_SHOTS, 5);
  assert.deepEqual({ ...sky.SHOT_GAP }, { min: 3, spread: 3 });
});
