const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';
const LOCAL_DIR = '/home/br_dinis/Pessoal/brinu-portfolio/_bmad-output/initiative-brinu-portfolio/walkthrough-hero-avatar/screenshots';

fs.mkdirSync(LOCAL_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function runHeroAvatarWalkthrough() {
  console.log('=== VALIDAÇÃO PLAYWRIGHT WALKTHROUGH: HERO & AVATAR COMPOSITION ===\n');

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
  });

  try {
    // 1. DESKTOP INTERACTION (1440x900)
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    console.log('[1/4] Carregando a aplicação e aguardando dismiss da cortina...');
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(500);

    // Snapshot Hero Idle
    const shot1 = path.join(LOCAL_DIR, '01_hero_desktop_idle.png');
    await page.screenshot({ path: shot1 });
    fs.copyFileSync(shot1, path.join(ARTIFACT_DIR, '01_hero_desktop_idle.png'));
    console.log('✓ 1. Hero Desktop Idle capturada:', shot1);

    // Medir alinhamento geométrico do avatar sobre a letra 'I'
    const heroMetrics = await page.evaluate(() => {
      const h1 = document.querySelector('h1[aria-label="BRINU"]');
      const letterI = h1 ? h1.querySelectorAll('span')[2] : null;
      const avatar = document.getElementById('hero-avatar-badge');
      const stamp = document.getElementById('hero-stamp-badge');

      const h1Rect = h1 ? h1.getBoundingClientRect() : null;
      const iRect = letterI ? letterI.getBoundingClientRect() : null;
      const avatarRect = avatar ? avatar.getBoundingClientRect() : null;

      const avatarCenter = avatarRect ? avatarRect.left + avatarRect.width / 2 : null;
      const iCenter = iRect ? iRect.left + iRect.width / 2 : null;

      return {
        h1Exists: !!h1,
        avatarExists: !!avatar,
        stampExists: !!stamp,
        stampText: stamp ? stamp.innerText.replace(/\s+/g, ' ').trim() : null,
        avatarCenter,
        iCenter,
        centerDiff: avatarCenter && iCenter ? Math.abs(avatarCenter - iCenter) : null,
      };
    });
    console.log('  Métricas de Alinhamento:', heroMetrics);
    assert(heroMetrics.centerDiff !== null && heroMetrics.centerDiff < 2.5, 'Avatar deve estar centralizado milimetricamente sobre a letra I (delta < 2.5px)');

    // 2. INTERAÇÃO TÁTIL: HOVER NO AVATAR
    console.log('\n[2/4] Simulando Hover no Avatar...');
    const avatarBadge = page.locator('#hero-avatar-badge');
    await avatarBadge.hover();
    await page.waitForTimeout(300);

    const shot2 = path.join(LOCAL_DIR, '02_hero_avatar_hover.png');
    await page.screenshot({ path: shot2 });
    fs.copyFileSync(shot2, path.join(ARTIFACT_DIR, '02_hero_avatar_hover.png'));
    console.log('✓ 2. Estado Hover capturado:', shot2);

    // 3. INTERAÇÃO TÁTIL: CLIQUE E POPS DE QUADRINHOS
    console.log('\n[3/4] Clicando no Avatar e capturando Balão Comic...');
    await avatarBadge.click();
    await page.waitForTimeout(350);

    const shot3 = path.join(LOCAL_DIR, '03_hero_avatar_clicked_speech_bubble.png');
    await page.screenshot({ path: shot3 });
    fs.copyFileSync(shot3, path.join(ARTIFACT_DIR, '03_hero_avatar_clicked_speech_bubble.png'));
    console.log('✓ 3. Balão Comic ativo capturado:', shot3);

    const bubbleInfo = await page.evaluate(() => {
      const bubble = document.getElementById('avatar-comic-bubble');
      const text = document.getElementById('avatar-comic-text');
      const badge = document.getElementById('hero-avatar-badge');
      return {
        visible: bubble ? window.getComputedStyle(bubble).opacity === '1' : false,
        text: text ? text.innerText : null,
        ariaExpanded: badge ? badge.getAttribute('aria-expanded') : null,
      };
    });
    console.log('  Estado do Balão Comic:', bubbleInfo);
    assert.strictEqual(bubbleInfo.visible, true, 'Balão deve estar visível');
    assert.strictEqual(bubbleInfo.ariaExpanded, 'true', 'aria-expanded deve ser true');

    await context.close();

    // 4. RESPONSIVIDADE MOBILE (iPhone SE - 375x667)
    console.log('\n[4/4] Validando Mobile (375x667)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await mobilePage.waitForTimeout(400);

    // Clica no avatar em mobile também para validar o balão em tela estreita
    const mobileAvatar = mobilePage.locator('#hero-avatar-badge');
    await mobileAvatar.click();
    await mobilePage.waitForTimeout(300);

    const shot4 = path.join(LOCAL_DIR, '04_mobile_hero_with_bubble.png');
    await mobilePage.screenshot({ path: shot4 });
    fs.copyFileSync(shot4, path.join(ARTIFACT_DIR, '04_mobile_hero_with_bubble.png'));
    console.log('✓ 4. Mobile com balão ativo capturado:', shot4);

    const mobileCheck = await mobilePage.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      return {
        hasHorizontalOverflow: scrollWidth > clientWidth,
        scrollWidth,
        clientWidth,
      };
    });
    console.log('  Mobile Check:', mobileCheck);
    assert(!mobileCheck.hasHorizontalOverflow, 'Mobile não deve ter transbordamento horizontal');

    await mobileContext.close();

    console.log('\n===============================================================');
    console.log('VALIDAÇÃO PLAYWRIGHT DO WALKTHROUGH CONCLUÍDA COM 100% SUCESSO!');
    console.log('===============================================================');

    return {
      heroMetrics,
      bubbleInfo,
      mobileCheck,
    };
  } finally {
    await browser.close();
  }
}

runHeroAvatarWalkthrough().catch((err) => {
  console.error('\n❌ Falha na validação do walkthrough:', err);
  process.exit(1);
});
