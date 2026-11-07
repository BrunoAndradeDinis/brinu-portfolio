import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('C2: tokens.css declares each --color-* once without legacy color aliases', () => {
  const tokensPath = path.resolve('src/styles/tokens.css');
  const tokensCss = fs.readFileSync(tokensPath, 'utf8');

  const forbiddenAliases = [
    '--color-acid-green',
    '--color-crt-cyan',
    '--color-bebop-amber',
    '--color-contrast-pink',
  ];

  for (const alias of forbiddenAliases) {
    assert.equal(
      tokensCss.includes(alias),
      false,
      `tokens.css must not declare or reference forbidden alias ${alias}`
    );
  }

  const declarations = [...tokensCss.matchAll(/(--color-[a-z0-9-]+)\s*:/gi)].map((m) => m[1]);
  assert.ok(declarations.length >= 6, 'Expected canonical --color-* declarations in tokens.css');

  const counts = new Map();
  for (const name of declarations) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
  assert.deepEqual(
    duplicates,
    [],
    `Expected each --color-* token to be declared once, found duplicates: ${JSON.stringify(duplicates)}`
  );

  assert.ok(tokensCss.includes('--color-bebop-red: #FE0000'));
  assert.ok(tokensCss.includes('--color-space-base: #080808'));
  assert.ok(tokensCss.includes('--color-paper-white: #FBFAF4'));
});

test('C3: motion module registers and exports p5Snap and p5Overshoot custom eases', async () => {
  const motion = await import('../src/utils/motion.ts');
  assert.equal(typeof motion.p5Snap, 'function', 'p5Snap must be exported as an easing function');
  assert.equal(
    typeof motion.p5Overshoot,
    'function',
    'p5Overshoot must be exported as an easing function'
  );
  assert.equal(typeof motion.registerP5Eases, 'function');

  assert.equal(motion.p5Snap(0), 0);
  assert.equal(motion.p5Snap(1), 1);
  assert.ok(motion.p5Snap(0.35) > 0.85, 'p5Snap must snap quickly in the first third of the curve');

  assert.equal(motion.p5Overshoot(0), 0);
  assert.equal(motion.p5Overshoot(1), 1);
  assert.ok(
    motion.p5Overshoot(0.45) > 1.0,
    'p5Overshoot must overshoot past 1.0 before settling at 1.0'
  );

  const firstRefSnap = motion.p5Snap;
  const firstRefOvershoot = motion.p5Overshoot;
  const again = motion.registerP5Eases();
  assert.equal(again.p5Snap, firstRefSnap, 'registerP5Eases must register p5Snap once');
  assert.equal(again.p5Overshoot, firstRefOvershoot, 'registerP5Eases must register p5Overshoot once');
});

test('C4: halftone and shatter svg patterns exist under 4 kB each', () => {
  const halftonePath = path.resolve('src/assets/patterns/halftone.svg');
  const shatterPath = path.resolve('src/assets/patterns/shatter.svg');

  assert.equal(fs.existsSync(halftonePath), true, 'Expected src/assets/patterns/halftone.svg');
  assert.equal(fs.existsSync(shatterPath), true, 'Expected src/assets/patterns/shatter.svg');

  const halftoneStat = fs.statSync(halftonePath);
  const shatterStat = fs.statSync(shatterPath);

  assert.ok(
    halftoneStat.size > 0 && halftoneStat.size < 4096,
    `halftone.svg must be < 4096 bytes, got ${halftoneStat.size}`
  );
  assert.ok(
    shatterStat.size > 0 && shatterStat.size < 4096,
    `shatter.svg must be < 4096 bytes, got ${shatterStat.size}`
  );

  const halftoneSvg = fs.readFileSync(halftonePath, 'utf8');
  const shatterSvg = fs.readFileSync(shatterPath, 'utf8');

  assert.ok(halftoneSvg.includes('<svg') && halftoneSvg.includes('<pattern'), 'halftone.svg must define an SVG <pattern>');
  assert.ok(shatterSvg.includes('<svg') && shatterSvg.includes('<pattern') && shatterSvg.includes('<polygon'), 'shatter.svg must define an SVG <pattern> with <polygon> shards');
});

