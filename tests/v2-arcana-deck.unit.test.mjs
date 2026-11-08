import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const FORBIDDEN = ['THREE.JS', 'WEBGL', 'SHADERS'];

test('lab copy: both locales name the section ARCANA DECK and cite only what the deck uses', async () => {
  const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
  for (const locale of ['pt-br', 'en']) {
    const dict = DICTIONARIES[locale];
    assert.equal(dict.lab.title, 'ARCANA DECK');
    assert.equal(dict.menu.navItems.lab, '04 // ARCANA DECK');
    for (const key of ['sectionAria', 'actTag', 'title', 'statusBadge', 'domainLine', 'indexLabel']) {
      const text = dict.lab[key].toUpperCase();
      for (const word of FORBIDDEN) assert.ok(!text.includes(word), `${locale} lab.${key} still mentions ${word}`);
      assert.ok(!text.includes('CREATIVE LAB'), `${locale} lab.${key} still says CREATIVE LAB`);
    }
    assert.match(dict.lab.domainLine, /GSAP/);
    assert.match(dict.lab.domainLine, /CSS 3D/);
    assert.ok(!dict.footer.stackLine.toUpperCase().includes('THREE.JS'), `${locale} footer still lists THREE.JS`);
    assert.match(dict.footer.stackLine, /GSAP/);
    assert.ok(!dict.a11y.labNavAria.toUpperCase().includes('CREATIVE LAB'));
  }
});

test('lab copy: the menu keeps the lab anchor', () => {
  const menu = fs.readFileSync('src/components/CockpitMenu.tsx', 'utf8');
  assert.match(menu, /id: 'lab', code: '03', labelKey: 'lab', href: '#lab'/);
});
