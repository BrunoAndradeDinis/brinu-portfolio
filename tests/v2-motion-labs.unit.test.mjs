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

const casesReveal = () => import('../src/components/cases/cases-reveal.ts');

test('next advances exactly one case at a time', async () => {
  const { createCaseSteps } = await casesReveal();
  const { MAIN_CASES } = await import('../src/data/cases.ts');
  const steps = createCaseSteps(MAIN_CASES.length);
  assert.equal(steps.index, 0, 'starts on the first case');
  for (let expected = 1; expected < MAIN_CASES.length; expected += 1) {
    assert.deepEqual(steps.next(), { index: expected, done: false });
    assert.equal(steps.index, expected);
  }
});

test('next from the last case reports done and keeps the index', async () => {
  const { createCaseSteps } = await casesReveal();
  for (const count of [1, 2, 4, 9]) {
    const steps = createCaseSteps(count);
    for (let move = 1; move < count; move += 1) steps.next();
    assert.deepEqual(steps.next(), { index: count - 1, done: true }, `count ${count}`);
    assert.deepEqual(steps.next(), { index: count - 1, done: true }, `count ${count}, repeated`);
    assert.equal(steps.index, count - 1);
  }
});

test('previous steps back one case and clamps at the first', async () => {
  const { createCaseSteps } = await casesReveal();
  const steps = createCaseSteps(4);
  assert.deepEqual(steps.previous(), { index: 0, done: true });
  steps.next();
  steps.next();
  assert.deepEqual(steps.previous(), { index: 1, done: false });
  assert.deepEqual(steps.previous(), { index: 0, done: false });
  assert.deepEqual(steps.previous(), { index: 0, done: true });
  assert.deepEqual(steps.goTo(99), { index: 3, done: false });
  assert.deepEqual(steps.goTo(-5), { index: 0, done: false });
  assert.equal(steps.index, 0);
});

test('each case element starts before the previous one ends', async () => {
  const { elementOffsets, CASE_REVEAL_ELEMENTS } = await casesReveal();
  assert.deepEqual([...CASE_REVEAL_ELEMENTS], ['title', 'meta', 'media', 'summary', 'link']);
  for (const duration of [0.4, 0.5, 0.6, 500]) {
    const offsets = elementOffsets(CASE_REVEAL_ELEMENTS.length, duration);
    assert.equal(offsets.length, CASE_REVEAL_ELEMENTS.length);
    assert.equal(offsets[0], 0);
    for (let position = 1; position < offsets.length; position += 1) {
      assert.ok(offsets[position] > offsets[position - 1], `element ${position} starts after element ${position - 1}`);
      const overlap = offsets[position - 1] + duration - offsets[position];
      assert.ok(overlap > 0, `element ${position} starts ${overlap} before the previous one ends`);
    }
  }
  assert.deepEqual(elementOffsets(0, 0.5), []);
});

const orbitLayout = () => import('../src/components/arsenal-orbit/orbit-layout.ts');

test('every skill gets exactly one orbit node', async () => {
  const { layoutOrbit } = await orbitLayout();
  const { ARSENAL } = await import('../src/data/arsenal.ts');
  const nodes = layoutOrbit();
  const skills = ARSENAL.flatMap((domain) => domain.skills.map((skill) => ({ domainId: domain.id, name: skill.name })));
  assert.ok(skills.length > 0);
  assert.equal(nodes.length, skills.length);
  for (const skill of skills) {
    const matches = nodes.filter((node) => node.domainId === skill.domainId && node.name === skill.name);
    assert.equal(matches.length, 1, `${skill.domainId} / ${skill.name} has one node`);
  }
});

test('the same arsenal gives the same orbit positions', async () => {
  const { layoutOrbit } = await orbitLayout();
  const { ARSENAL } = await import('../src/data/arsenal.ts');
  assert.deepEqual(layoutOrbit(), layoutOrbit());
  assert.deepEqual(layoutOrbit(structuredClone(ARSENAL)), layoutOrbit(ARSENAL));
});

test('orbit nodes sit on one of two ellipses and never share a position', async () => {
  const { layoutOrbit, ORBIT_ELLIPSES } = await orbitLayout();
  const nodes = layoutOrbit();
  assert.equal(ORBIT_ELLIPSES.length, 2);
  assert.deepEqual([...new Set(nodes.map((node) => node.ring))].sort(), [0, 1], 'both ellipses carry nodes');
  for (const node of nodes) {
    const { rx, ry } = ORBIT_ELLIPSES[node.ring];
    const onEllipse = (node.x / rx) ** 2 + (node.y / ry) ** 2;
    assert.ok(Math.abs(onEllipse - 1) < 1e-9, `${node.name} lies on ellipse ${node.ring} (${onEllipse})`);
  }
  const positions = new Set(nodes.map((node) => `${node.x.toFixed(6)},${node.y.toFixed(6)}`));
  assert.equal(positions.size, nodes.length);
});
