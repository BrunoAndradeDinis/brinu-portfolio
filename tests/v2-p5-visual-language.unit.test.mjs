import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('C1: P5Title, P5Panel and P5Badge components exist under src/components/p5', () => {
  const titlePath = path.resolve('src/components/p5/P5Title.astro');
  const panelPath = path.resolve('src/components/p5/P5Panel.astro');
  const badgePath = path.resolve('src/components/p5/P5Badge.astro');

  assert.equal(fs.existsSync(titlePath), true, 'Expected src/components/p5/P5Title.astro');
  assert.equal(fs.existsSync(panelPath), true, 'Expected src/components/p5/P5Panel.astro');
  assert.equal(fs.existsSync(badgePath), true, 'Expected src/components/p5/P5Badge.astro');

  const titleSrc = fs.readFileSync(titlePath, 'utf8');
  const panelSrc = fs.readFileSync(panelPath, 'utf8');
  const badgeSrc = fs.readFileSync(badgePath, 'utf8');

  assert.ok(titleSrc.includes('data-p5-title'), 'P5Title must expose data-p5-title attribute');
  assert.ok(panelSrc.includes('data-p5-panel') && panelSrc.includes('p5-panel'), 'P5Panel must expose data-p5-panel and p5-panel class');
  assert.ok(badgeSrc.includes('data-p5-badge') && badgeSrc.includes('p5-badge'), 'P5Badge must expose data-p5-badge and p5-badge class');
});

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

test('C19: ransom font stacks include explicit fallback families and preserve rotations', async () => {
  const { RANSOM_FONT_STACKS, planRansomTitle } = await import('../src/components/p5/ransom.ts');

  assert.equal(RANSOM_FONT_STACKS.length, 4);
  for (const entry of RANSOM_FONT_STACKS) {
    assert.ok(
      entry.stack.includes(',') && /(sans-serif|monospace|cursive)/.test(entry.stack),
      `Font stack "${entry.stack}" must include a generic fallback family`
    );
  }

  const words = planRansomTitle('BOUNTY ARCHIVE');
  const chars = words.flatMap((w) => w.chars);
  assert.equal(chars.map((c) => c.char).join(''), 'BOUNTYARCHIVE');

  const uniqueFamilies = new Set(chars.map((c) => c.fontToken));
  assert.ok(uniqueFamilies.size >= 3, `Expected at least 3 font families, got ${uniqueFamilies.size}`);

  for (const ch of chars) {
    assert.ok(
      ch.rotationDeg >= -8 && ch.rotationDeg <= 8 && ch.rotationDeg !== 0,
      `Expected non-zero rotation in [-8, 8], got ${ch.rotationDeg} for "${ch.char}"`
    );
    assert.ok(
      ch.fontStack.includes(',') && /(sans-serif|monospace|cursive)/.test(ch.fontStack),
      `Expected fallback stack on letter "${ch.char}", got ${ch.fontStack}`
    );
  }
});

test('C20: single-word titles under 4 letters alternate at least 2 font families', async () => {
  const { planRansomTitle } = await import('../src/components/p5/ransom.ts');

  for (const shortTitle of ['LAB', 'BIO', 'OI', 'HI']) {
    const words = planRansomTitle(shortTitle);
    assert.equal(words.length, 1);
    const chars = words[0].chars;
    assert.equal(chars.length, shortTitle.length);
    const families = new Set(chars.map((c) => c.fontToken));
    assert.ok(
      families.size >= 2,
      `Expected "${shortTitle}" (<4 letters) to alternate at least 2 font families, got ${families.size}`
    );
    for (let i = 1; i < chars.length; i += 1) {
      assert.notEqual(
        chars[i].fontToken,
        chars[i - 1].fontToken,
        `Adjacent letters in "${shortTitle}" must alternate font families`
      );
    }
  }
});


