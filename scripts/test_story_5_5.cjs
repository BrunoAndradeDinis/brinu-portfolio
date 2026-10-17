const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

const ARTIFACT_DIR = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';

async function testStory55() {
  console.log('=== TESTES PLAYWRIGHT: STORY 5.5 — SEÇÃO CREATIVE LAB & MONTAGE DO PLAYGROUND ===\n');

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

    console.log('[1/4] Carregando a aplicação no Desktop (1440x900)...');
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(500);

    // 2. VALIDATE CREATIVE LAB SECTION & EXPERIMENT NAVIGATION
    console.log('\n[2/4] Validando estrutura editorial e barra de navegação do Creative Lab...');
    const labSection = page.locator('#lab');
    await labSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const labTitle = page.locator('[data-lab-title]');
    await labTitle.waitFor({ state: 'visible', timeout: 5000 });
    const titleText = await labTitle.innerText();
    assert(titleText.includes('CREATIVE LAB'), `Título deve ser CREATIVE LAB (obtido: ${titleText})`);
    console.log('✓ Seção #lab e cabeçalho editorial validados');

    const labNav = page.locator('[data-lab-nav]');
    await labNav.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Barra de navegação rápida de experimentos [data-lab-nav] presente');

    // 3. VALIDATE MOUNTING OF ALL 3 EXPERIMENTS
    console.log('\n[3/4] Validando montagem dos 3 experimentos interativos...');
    const exp1 = page.locator('#lab-crt-tuner [data-crt-tuner]');
    const exp2 = page.locator('#lab-sonar-radar [data-sonar-radar]');
    const exp3 = page.locator('#lab-cyber-deck [data-cyber-deck]');

    await exp1.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Experimento 1 (CRT Frequency Tuner) montado e ativo');

    await exp2.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Experimento 2 (Bounty Sonar Radar) montado e ativo');

    await exp3.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Experimento 3 (Zero-G Cyber Deck) montado e ativo');

    // Test Navigation link click
    console.log('\nTestando atalhos de navegação do Creative Lab...');
    await page.locator('[data-nav-sonar]').click();
    await page.waitForTimeout(400);
    const sonarBox = await exp2.boundingBox();
    assert(sonarBox && sonarBox.y < 900, 'Navegação para o Sonar Radar deve rolar o elemento para a viewport');
    console.log('✓ Atalho [data-nav-sonar] rolou suavemente para o Experimento 2');

    // Capturar screenshot panorâmica do Creative Lab
    const screenshotPath = path.join(ARTIFACT_DIR, '01_creative_lab_playground_overview.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`✓ Screenshot salvo em: ${screenshotPath}`);

    // 4. VALIDATE RESPONSIVE CONTAINMENT & ZERO OVERFLOW
    console.log('\n[4/4] Validando contenção responsiva e ausência de overflow horizontal...');
    const viewports = [
      { name: 'Mobile Mini (375px)', width: 375, height: 667 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Desktop (1440px)', width: 1440, height: 900 },
      { name: 'Ultrawide (2560px)', width: 2560, height: 1440 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.locator('#lab').scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      assert(
        !hasHorizontalScroll,
        `Overflow horizontal detectado em ${vp.name}: scrollWidth=${metrics.scrollWidth} > clientWidth=${metrics.clientWidth}`
      );
      console.log(`  ✓ ${vp.name}: scrollWidth=${metrics.scrollWidth}px <= clientWidth=${metrics.clientWidth}px`);
    }

    console.log('\n=============================================================');
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 5.5 PASSARAM COM 100% DE SUCESSO!');
    console.log('=============================================================\n');
  } catch (error) {
    console.error('❌ Erro durante o teste da História 5.5:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStory55();
