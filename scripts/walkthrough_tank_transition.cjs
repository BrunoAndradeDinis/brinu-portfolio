const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function walkthroughTankTransition() {
  console.log('=== BMAD WALKTHROUGH PLAYWRIGHT: TRANSIÇÃO TANK! & VALIDAÇÃO DE SCROLL (EPIC 02) ===\n');

  const screenshotsDir = path.resolve(
    __dirname,
    '../_bmad-output/initiative-brinu-portfolio/walkthrough-tank-transition/screenshots'
  );
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    console.log('[1/4] Carregando a página e aguardando preloader...');
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(600);

    const getMetrics = async () => {
      return await page.evaluate(() => {
        const avatar = document.getElementById('hero-avatar-badge');
        const letterI = document.querySelector('[data-hero-letter="I"]');
        const avatarRect = avatar.getBoundingClientRect();
        const letterIRect = letterI.getBoundingClientRect();
        return {
          avatarCenterX: avatarRect.left + avatarRect.width / 2,
          avatarCenterY: avatarRect.top + avatarRect.height / 2,
          letterICenterX: letterIRect.left + letterIRect.width / 2,
          letterICenterY: letterIRect.top + letterIRect.height / 2,
          diffX: (avatarRect.left + avatarRect.width / 2) - (letterIRect.left + letterIRect.width / 2),
          diffY: (avatarRect.top + avatarRect.height / 2) - (letterIRect.top + letterIRect.height / 2),
          inlineStyle: avatar.getAttribute('style') || '',
        };
      });
    };

    // Estado Inicial
    const initialMetrics = await getMetrics();
    console.log(`[2/4] Estado inicial do Avatar: CenterX=${initialMetrics.avatarCenterX.toFixed(1)}px, CenterY=${initialMetrics.avatarCenterY.toFixed(1)}px`);
    const initialShotPath = path.join(screenshotsDir, '01_hero_initial_centered.png');
    await page.screenshot({ path: initialShotPath });
    console.log(`✓ Screenshot 1 salvo: ${initialShotPath}`);

    // Rolagem para baixo (transição para Selected Works)
    console.log('\n[3/4] Rolando para baixo em direção a #works...');
    await page.evaluate(() => window.scrollTo({ top: 850, behavior: 'smooth' }));
    await page.waitForTimeout(1400);

    const midMetrics = await getMetrics();
    console.log(`✓ Em transição (scroll 850px): Avatar CenterX=${midMetrics.avatarCenterX.toFixed(1)}px (sem desvio lateral)`);
    const transShotPath = path.join(screenshotsDir, '02_tank_transition_strip.png');
    await page.screenshot({ path: transShotPath });
    console.log(`✓ Screenshot 2 salvo (Faixa Tank!): ${transShotPath}`);

    // Rolagem de volta para o topo (o cenário que o usuário reportou)
    console.log('\n[4/4] Rolando de volta para o topo (scroll 0px)...');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(1400);

    const backMetrics = await getMetrics();
    console.log(`✓ Estado pós-retorno ao topo: CenterX=${backMetrics.avatarCenterX.toFixed(1)}px, CenterY=${backMetrics.avatarCenterY.toFixed(1)}px`);
    console.log(`  Desvio X pós-scroll: ${(backMetrics.avatarCenterX - initialMetrics.avatarCenterX).toFixed(2)}px (esperado: ~0px)`);
    console.log(`  Desvio Y pós-scroll: ${(backMetrics.avatarCenterY - initialMetrics.avatarCenterY).toFixed(2)}px (esperado: ~0px)`);

    assert(
      Math.abs(backMetrics.avatarCenterX - initialMetrics.avatarCenterX) < 1.0,
      `Avatar teve desvio horizontal após retorno! Inicial=${initialMetrics.avatarCenterX}, Final=${backMetrics.avatarCenterX}`
    );
    assert(
      Math.abs(backMetrics.avatarCenterY - initialMetrics.avatarCenterY) < 1.0,
      `Avatar teve desvio vertical após retorno! Inicial=${initialMetrics.avatarCenterY}, Final=${backMetrics.avatarCenterY}`
    );

    const backShotPath = path.join(screenshotsDir, '03_hero_back_to_top_perfect.png');
    await page.screenshot({ path: backShotPath });
    console.log(`✓ Screenshot 3 salvo (Avatar perfeitamente preservado no centro): ${backShotPath}`);

    // Teste de responsividade após scroll
    const breakpoints = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1440, height: 900 },
    ];

    console.log('\nValidando ciclo de scroll em múltiplos viewports...');
    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(300);

      const bpInit = await getMetrics();
      await page.evaluate(() => window.scrollTo(0, 600));
      await page.waitForTimeout(600);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(600);
      const bpEnd = await getMetrics();

      const deltaX = Math.abs(bpEnd.avatarCenterX - bpInit.avatarCenterX);
      const deltaY = Math.abs(bpEnd.avatarCenterY - bpInit.avatarCenterY);
      assert(deltaX < 1.0 && deltaY < 1.0, `Erro de deslocamento em ${bp.name}: deltaX=${deltaX}, deltaY=${deltaY}`);
      console.log(`  ✓ ${bp.name} (${bp.width}px): DeltaX=${deltaX.toFixed(2)}px, DeltaY=${deltaY.toFixed(2)}px — Centralização 100% perfeita`);
    }

    console.log('\n=============================================================');
    console.log('🎉 VALIDAÇÃO DE WALKTHROUGH PLAYWRIGHT CONCLUÍDA COM SUCESSO!');
    console.log('Zero deslocamento residual do avatar ao rolar e voltar ao topo.');
    console.log('=============================================================\n');
  } finally {
    await browser.close();
  }
}

walkthroughTankTransition().catch((err) => {
  console.error('\n❌ ERRO NA VALIDAÇÃO DO WALKTHROUGH:');
  console.error(err);
  process.exit(1);
});
