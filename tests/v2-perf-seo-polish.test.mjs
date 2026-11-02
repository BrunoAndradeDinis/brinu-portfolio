import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PROFILE, buildPersonJsonLd } from '../src/data/profile.ts';
import { ptBrDict, enDict } from '../src/i18n/dictionaries.ts';
import { localeToOgLocale, resolveTranslationKey } from '../src/i18n/index.ts';

test('C1: CyberDeck.tsx uses explicit named Three.js imports without wildcard namespace import', () => {
  const source = fs.readFileSync(
    path.resolve('src/components/lab/CyberDeck.tsx'),
    'utf8'
  );
  assert.equal(
    source.includes('import * as THREE'),
    false,
    'CyberDeck.tsx must not use wildcard import * as THREE'
  );
  assert.equal(
    source.includes('THREE.'),
    false,
    'CyberDeck.tsx must not reference THREE. namespace'
  );
  for (const symbol of [
    'Scene',
    'PerspectiveCamera',
    'WebGLRenderer',
    'Group',
    'Mesh',
    'PointLight',
    'AmbientLight',
    'DirectionalLight',
    'BoxGeometry',
    'PlaneGeometry',
    'SphereGeometry',
    'EdgesGeometry',
    'MeshStandardMaterial',
    'LineBasicMaterial',
    'LineSegments',
    'SRGBColorSpace',
  ]) {
    assert.ok(
      source.includes(symbol),
      `Expected CyberDeck.tsx to import and use ${symbol}`
    );
  }
});

test('C2: all built JS chunks in dist/_astro/ are under 500 kB with zero chunk warnings', () => {
  const astroDir = path.resolve('dist/_astro');
  assert.equal(fs.existsSync(astroDir), true, 'dist/_astro must exist');

  const jsFiles = fs
    .readdirSync(astroDir)
    .filter((f) => f.endsWith('.js'));
  assert.ok(jsFiles.length > 5, 'Expected multiple split JS chunks in dist/_astro');

  for (const file of jsFiles) {
    const fullPath = path.join(astroDir, file);
    const stat = fs.statSync(fullPath);
    assert.ok(
      stat.size < 500_000,
      `Chunk ${file} (${stat.size} bytes) exceeds 500,000 bytes`
    );
  }
});

test('T2a: buildPersonJsonLd exports canonical Schema.org Person with Franca / SP and official links', () => {
  const jsonLd = buildPersonJsonLd();
  assert.equal(jsonLd['@context'], 'https://schema.org');
  assert.equal(jsonLd['@type'], 'Person');
  assert.equal(jsonLd.name, 'Bruno de Andrade Dinis');
  assert.equal(jsonLd.alternateName, 'Brinu');
  assert.equal(jsonLd.birthDate, '1996');
  assert.equal(jsonLd.email, 'bruno.a.dinis96@gmail.com');
  assert.equal(jsonLd.address['@type'], 'PostalAddress');
  assert.equal(jsonLd.address.addressLocality, 'Franca');
  assert.equal(jsonLd.address.addressRegion, 'SP');
  assert.equal(jsonLd.address.addressCountry, 'BR');
  assert.deepEqual(jsonLd.sameAs, [
    PROFILE.github.url,
    PROFILE.linkedin.url,
  ]);
});

test('T2b: localeToOgLocale and a11y.skipToContent provide bilingual parity', () => {
  assert.equal(localeToOgLocale('pt-br'), 'pt_BR');
  assert.equal(localeToOgLocale('en'), 'en_US');
  assert.equal(
    resolveTranslationKey('pt-br', 'a11y.skipToContent'),
    ptBrDict.a11y.skipToContent
  );
  assert.equal(
    resolveTranslationKey('en', 'a11y.skipToContent'),
    enDict.a11y.skipToContent
  );
  assert.notEqual(ptBrDict.a11y.skipToContent, enDict.a11y.skipToContent);
});

