import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PROFILE } from '../src/data/profile.ts';
import {
  PROJECT_CASES,
  getLocalizedCases,
  getLocalizedSkillCategories,
} from '../src/data/cases.ts';
import { DICTIONARIES, ptBrDict, enDict } from '../src/i18n/dictionaries.ts';
import {
  sanitizeLocale,
  localeToHtmlLang,
  readStoredLocale,
  writeStoredLocale,
  resolveTranslationKey,
  getLocale,
  setLocale,
  toggleLocale,
} from '../src/i18n/index.ts';

function collectKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

function collectValues(obj) {
  const values = [];
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      values.push(...collectValues(v));
    } else if (Array.isArray(v)) {
      values.push(...v);
    } else {
      values.push(v);
    }
  }
  return values;
}

test('C1: profile.ts exports canonical Franca / SP and official contact metadata', () => {
  assert.equal(PROFILE.fullName, 'Bruno de Andrade Dinis');
  assert.equal(PROFILE.handle, 'Brinu');
  assert.equal(PROFILE.birthYear, 1996);
  assert.equal(PROFILE.location.city, 'Franca');
  assert.equal(PROFILE.location.state, 'SP');
  assert.equal(PROFILE.location.label, 'Franca / SP');
  assert.equal(PROFILE.location.remoteLabel['pt-br'], 'Franca / SP • Remoto');
  assert.equal(PROFILE.location.remoteLabel.en, 'Franca / SP • Remote');
  assert.equal(PROFILE.email, 'bruno.a.dinis96@gmail.com');
  assert.equal(PROFILE.linkedin.handle, '/in/bruno-de-andrade-dinis');
  assert.equal(
    PROFILE.linkedin.url,
    'https://www.linkedin.com/in/bruno-de-andrade-dinis'
  );
  assert.equal(PROFILE.github.handle, '@BrunoAndradeDinis');
  assert.equal(PROFILE.github.url, 'https://github.com/BrunoAndradeDinis');
});

test('T2: getLocalizedCases and getLocalizedSkillCategories provide matching pt-br and en structures', () => {
  const ptCases = getLocalizedCases('pt-br');
  const enCases = getLocalizedCases('en');

  assert.equal(ptCases.length, 4);
  assert.equal(enCases.length, 4);
  assert.deepEqual(
    ptCases.map((c) => c.id),
    enCases.map((c) => c.id)
  );
  assert.equal(PROJECT_CASES.length, 4);
  assert.notEqual(ptCases[0].description, enCases[0].description);

  const ptSkills = getLocalizedSkillCategories('pt-br');
  const enSkills = getLocalizedSkillCategories('en');
  assert.equal(ptSkills.length, 4);
  assert.equal(enSkills.length, 4);
  assert.deepEqual(
    ptSkills.map((s) => s.id),
    enSkills.map((s) => s.id)
  );
  assert.notEqual(ptSkills[0].subtitle, enSkills[0].subtitle);
});

test('C4: pt-br and en dictionaries have 100% key parity and non-empty translations', () => {
  const ptKeys = collectKeys(ptBrDict);
  const enKeys = collectKeys(enDict);

  assert.deepEqual(ptKeys, enKeys);
  assert.ok(ptKeys.length > 60);

  for (const val of collectValues(ptBrDict)) {
    assert.equal(typeof val, 'string');
    assert.ok(val.trim().length > 0);
  }
  for (const val of collectValues(enDict)) {
    assert.equal(typeof val, 'string');
    assert.ok(val.trim().length > 0);
  }

  assert.ok(DICTIONARIES['pt-br'].footer.engineeredIn.includes('FRANCA / SP'));
  assert.ok(DICTIONARIES.en.footer.engineeredIn.includes('FRANCA / SP'));
  assert.ok(!JSON.stringify(DICTIONARIES).toLowerCase().includes('campinas'));
});

test('C5: default locale initializes to pt-br with html lang pt-BR', () => {
  assert.equal(readStoredLocale(null), 'pt-br');
  assert.equal(localeToHtmlLang('pt-br'), 'pt-BR');
  assert.equal(localeToHtmlLang('en'), 'en');
  assert.equal(
    resolveTranslationKey('pt-br', 'contact.stationBaseValue'),
    'Franca / SP • Remoto'
  );
  assert.equal(
    resolveTranslationKey('en', 'contact.stationBaseValue'),
    'Franca / SP • Remote'
  );
});

test('C7: invalid or blocked localStorage falls back safely to pt-br', () => {
  const corruptedStorage = {
    getItem: () => 'es-MX-invalid',
  };
  assert.equal(readStoredLocale(corruptedStorage), 'pt-br');

  const throwingStorage = {
    getItem: () => {
      throw new Error('SecurityError: Storage disabled');
    },
    setItem: () => {
      throw new Error('SecurityError: Storage disabled');
    },
  };
  assert.equal(readStoredLocale(throwingStorage), 'pt-br');
  assert.doesNotThrow(() => writeStoredLocale('en', throwingStorage));
  assert.equal(sanitizeLocale(undefined), 'pt-br');
  assert.equal(sanitizeLocale('en'), 'en');

  assert.equal(setLocale('pt-br', { animate: false }), 'pt-br');
  assert.equal(toggleLocale(), 'en');
  assert.equal(getLocale(), 'en');
  assert.equal(toggleLocale(), 'pt-br');
});

test('T4a: rapid locale toggling updates active locale deterministically without throwing', () => {
  setLocale('pt-br', { animate: false });
  for (let i = 0; i < 6; i += 1) {
    const next = toggleLocale();
    assert.equal(next, i % 2 === 0 ? 'en' : 'pt-br');
  }
  assert.equal(getLocale(), 'pt-br');
});

test('T4b: resolveTranslationKey falls back to keyPath for unknown dot-paths and resolves nested paths', () => {
  assert.equal(
    resolveTranslationKey('pt-br', 'nonexistent.key.path'),
    'nonexistent.key.path'
  );
  assert.equal(resolveTranslationKey('en', 'nav.worksCta'), ptBrDict.nav.worksCta !== enDict.nav.worksCta ? enDict.nav.worksCta : 'WORKS');
  assert.equal(resolveTranslationKey('pt-br', 'nav.worksCta'), ptBrDict.nav.worksCta);
});

test('C8: orphaned components StoryboardReel.astro and CrtOverlay.astro do not exist', () => {
  const storyboardPath = path.resolve('src/components/StoryboardReel.astro');
  const crtOverlayPath = path.resolve('src/components/CrtOverlay.astro');
  assert.equal(fs.existsSync(storyboardPath), false);
  assert.equal(fs.existsSync(crtOverlayPath), false);
});

test('C9: tokens.css enforces Persona 5 Red/Black/White triad with zero #11111E or #1A1A2E', () => {
  const tokensCss = fs.readFileSync(path.resolve('src/styles/tokens.css'), 'utf8');
  assert.ok(tokensCss.includes('--color-bebop-red: #FE0000'));
  assert.ok(tokensCss.includes('--color-space-base: #080808'));
  assert.ok(tokensCss.includes('--color-paper-white: #FBFAF4'));
  assert.equal(tokensCss.toUpperCase().includes('#11111E'), false);
  assert.equal(tokensCss.toUpperCase().includes('#1A1A2E'), false);
});

test('T6a: CockpitMenu defines all 6 canonical Persona 5 navigation blades and syncCockpitTriggerDom', () => {
  const source = fs.readFileSync(
    path.resolve('src/components/CockpitMenu.tsx'),
    'utf8'
  );
  for (const href of ['#hero', '#works', '#about', '#lab', '#contact', '/whoami']) {
    assert.ok(source.includes(`href: '${href}'`), `Missing blade href ${href}`);
  }
  assert.ok(source.includes('export function syncCockpitTriggerDom(isOpen: boolean)'));
  assert.ok(source.includes("cockpitBtn.setAttribute('aria-expanded', String(isOpen))"));
});

test('T6b: CockpitMenu.tsx wires cockpit:open event, Escape key handler, and language/audio controls', () => {
  const source = fs.readFileSync(
    path.resolve('src/components/CockpitMenu.tsx'),
    'utf8'
  );
  assert.ok(source.includes("addEventListener('cockpit:open'"));
  assert.ok(source.includes("e.key === 'Escape'"));
  assert.ok(source.includes('id="cockpit-menu-overlay"'));
  assert.ok(source.includes('data-cockpit-lang="pt-br"'));
  assert.ok(source.includes('data-cockpit-lang="en"'));
  assert.ok(source.includes('id="cockpit-audio-toggle"'));
});

test('T7: BaseLayout and ComicNav mount CockpitMenu, p5-wipe-overlay, and data-lang-toggle', () => {
  const layoutSrc = fs.readFileSync(
    path.resolve('src/layouts/BaseLayout.astro'),
    'utf8'
  );
  const navSrc = fs.readFileSync(
    path.resolve('src/components/ComicNav.astro'),
    'utf8'
  );
  assert.ok(layoutSrc.includes('<CockpitMenu client:load />'));
  assert.ok(layoutSrc.includes('id="p5-wipe-overlay"'));
  assert.ok(layoutSrc.includes('initI18nBindings()'));
  assert.ok(navSrc.includes('id="nav-lang-toggle-btn"'));
  assert.ok(navSrc.includes('data-lang-toggle'));
});

test('T8: ComicHero uses canonical PROFILE email and LinkedIn and zero wrong hardcoded links', () => {
  const heroSrc = fs.readFileSync(
    path.resolve('src/components/ComicHero.astro'),
    'utf8'
  );
  assert.ok(heroSrc.includes('PROFILE.linkedin.url'));
  assert.ok(heroSrc.includes('PROFILE.email'));
  assert.equal(heroSrc.includes('bruno.andrade.dinis@gmail.com'), false);
  assert.equal(heroSrc.includes('linkedin.com/in/brunoandradedinis'), false);
});

test('T9: SelectedWorks.astro binds bilingual data-case-* and data-i18n attributes in Red/Black/White', () => {
  const worksSrc = fs.readFileSync(
    path.resolve('src/components/SelectedWorks.astro'),
    'utf8'
  );
  assert.ok(worksSrc.includes('data-case-title'));
  assert.ok(worksSrc.includes('data-case-description'));
  assert.ok(worksSrc.includes('data-case-challenge'));
  assert.ok(worksSrc.includes('data-case-solution'));
  assert.ok(worksSrc.includes('data-case-metric'));
  assert.ok(worksSrc.includes('data-i18n="works.title"'));
});

test('C12: About.astro and SkillsGrid.astro form a unified Persona 5 Confidant Dossier without duplicate receipt clutter', () => {
  const aboutSrc = fs.readFileSync(
    path.resolve('src/components/About.astro'),
    'utf8'
  );
  const skillsSrc = fs.readFileSync(
    path.resolve('src/components/SkillsGrid.astro'),
    'utf8'
  );
  assert.ok(aboutSrc.includes('<SkillsGrid />'));
  assert.ok(aboutSrc.includes('PROFILE.location.label'));
  assert.ok(aboutSrc.includes('data-i18n="about.bioP1"'));
  assert.ok(skillsSrc.includes('data-skill-vignette'));
  assert.ok(skillsSrc.includes('data-skill-title'));
  assert.ok(skillsSrc.includes('data-skill-badge-text'));
  assert.equal(aboutSrc.includes('PHILOSOPHY //'), false);
});

test('T11: CreativeLab and lab islands use useLocale() and remove redundant hardware telemetry boxes', () => {
  const labAstro = fs.readFileSync(
    path.resolve('src/components/CreativeLab.astro'),
    'utf8'
  );
  const tunerSrc = fs.readFileSync(
    path.resolve('src/components/lab/CrtTuner.tsx'),
    'utf8'
  );
  const sonarSrc = fs.readFileSync(
    path.resolve('src/components/lab/SonarRadar.tsx'),
    'utf8'
  );
  const deckSrc = fs.readFileSync(
    path.resolve('src/components/lab/CyberDeck.tsx'),
    'utf8'
  );

  assert.equal(labAstro.includes('GRAPHICS SUBSYSTEM'), false);
  assert.ok(tunerSrc.includes('useLocale()'));
  assert.ok(sonarSrc.includes('useLocale()'));
  assert.ok(deckSrc.includes('useLocale()'));
});








