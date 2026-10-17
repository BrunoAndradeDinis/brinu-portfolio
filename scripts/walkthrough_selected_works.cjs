const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

async function runWalkthroughSelectedWorks() {
  console.log('=== BMAD WALKTHROUGH PLAYWRIGHT: ÉPICA 03 — SHOWCASE SELECTED WORKS ===\n');

  const screenshotsDir = path.join(
    __dirname,
    '../_bmad-output/initiative-brinu-portfolio/walkthrough-selected-works/screenshots'
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

    // 2. ROLAR ATÉ #WORKS E CAPTURAR O GRID DESKTOP
    console.log('[2/4] Rolando até #works e capturando o grid técnico...');
    const worksSection = page.locator('#works');
    await worksSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const shot1 = path.join(screenshotsDir, '01_selected_works_grid_desktop.png');
    await page.screenshot({ path: shot1, fullPage: false });
    console.log(`✓ Screenshot 1 salvo: ${shot1}`);

    // 3. CAPTURAR HOVER NOS CARDS
    console.log('[3/4] Testando microinterações de hover nos cards...');
    const auraCard = page.locator('#case-aurastream');
    await auraCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await auraCard.hover();
    await page.waitForTimeout(300);

    const shot2 = path.join(screenshotsDir, '02_card_aurastream_hover.png');
    await auraCard.screenshot({ path: shot2 });
    console.log(`✓ Screenshot 2 salvo (AuraStream Hover): ${shot2}`);

    const jokenpoCard = page.locator('#case-jokenpo-franky');
    await jokenpoCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await jokenpoCard.hover();
    await page.waitForTimeout(300);

    const shot3 = path.join(screenshotsDir, '03_card_jokenpo_hover.png');
    await jokenpoCard.screenshot({ path: shot3 });
    console.log(`✓ Screenshot 3 salvo (Jokenpo Hover): ${shot3}`);

    // 4. TESTAR MOBILE 375PX
    console.log('[4/4] Validando layout mobile 375px...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(400);

    const mobileWorks = page.locator('#works');
    await mobileWorks.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const shot4 = path.join(screenshotsDir, '04_selected_works_mobile_375.png');
    await page.screenshot({ path: shot4, fullPage: false });
    console.log(`✓ Screenshot 4 salvo (Mobile 375px): ${shot4}`);

    console.log('\n=============================================================');
    console.log('🎉 CAPTURA DE EVIDÊNCIAS DE WALKTHROUGH CONCLUÍDA COM SUCESSO!');
    console.log('=============================================================\n');
  } finally {
    await browser.close();
  }
}

runWalkthroughSelectedWorks().catch((err) => {
  console.error('\n❌ ERRO NO WALKTHROUGH:', err);
  process.exit(1);
});
