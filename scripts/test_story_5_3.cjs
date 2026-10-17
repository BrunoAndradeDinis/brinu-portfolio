const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

const ARTIFACT_DIR = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';

async function testStory53() {
  console.log('=== TESTES PLAYWRIGHT: STORY 5.3 — BOUNTY SONAR (RADAR 360° COM ÁUDIO) ===\n');

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

    // 2. SCROLL TO #LAB AND VALIDATE RADAR CANVAS
    console.log('\n[2/4] Validando montagem da seção Creative Lab e SonarRadar...');
    const labSection = page.locator('#lab');
    await labSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const radar = page.locator('[data-sonar-radar]');
    await radar.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Seção #lab e componente [data-sonar-radar] renderizados com sucesso');

    const canvas = page.locator('[data-radar-canvas]');
    await canvas.waitFor({ state: 'visible', timeout: 5000 });
    
    // Check canvas dimensions
    const canvasBox = await canvas.boundingBox();
    assert(canvasBox && canvasBox.width > 200 && canvasBox.height > 200, 'Canvas deve ter dimensões válidas maiores que 200px');
    console.log(`✓ Canvas 2D renderizado com dimensões: ${Math.round(canvasBox.width)}x${Math.round(canvasBox.height)}px`);

    // 3. VALIDATE CONTROLS AND INTERACTION
    console.log('\n[3/4] Validando controles do Sonar, áudio e telemetria de alvos...');
    const audioToggle = page.locator('[data-radar-audio-toggle]');
    let audioText = await audioToggle.innerText();
    assert(audioText.includes('MUTED'), `Áudio deve iniciar mutado (obtido: ${audioText})`);
    console.log('✓ Áudio inicia em conformidade com AD-4: MUTED por padrão');

    // Toggle audio ON
    await audioToggle.click();
    await page.waitForTimeout(200);
    audioText = await audioToggle.innerText();
    assert(audioText.includes('AUDIO: ON'), `Áudio deve estar ON após clique (obtido: ${audioText})`);
    console.log('✓ Toggle de áudio acionado: SONAR AUDIO: ON');

    // Toggle back to MUTED
    await audioToggle.click();
    await page.waitForTimeout(200);
    audioText = await audioToggle.innerText();
    assert(audioText.includes('MUTED'), `Áudio deve voltar a MUTED (obtido: ${audioText})`);
    console.log('✓ Toggle de áudio restaurado com segurança para MUTED');

    // Test Target Telemetry and Target Switching
    const targetName = page.locator('[data-target-name]');
    let currentTarget = await targetName.innerText();
    console.log(`✓ Alvo inicial na telemetria: ${currentTarget}`);

    // Click on another target: 'the-warriors'
    const warriorsBtn = page.locator('[data-select-target="the-warriors"]');
    await warriorsBtn.click();
    await page.waitForTimeout(300);

    currentTarget = await targetName.innerText();
    assert(
      currentTarget.toUpperCase().includes('THE WARRIORS'),
      `Telemetria deve atualizar para The Warriors (obtido: ${currentTarget})`
    );
    console.log(`✓ Alvo alterado com sucesso para: ${currentTarget}`);

    // Test Jokenpo Arena target
    const jokenpoBtn = page.locator('[data-select-target="jokenpo"]');
    await jokenpoBtn.click();
    await page.waitForTimeout(300);

    currentTarget = await targetName.innerText();
    assert(
      currentTarget.toUpperCase().includes('JOKENPO'),
      `Telemetria deve atualizar para Jokenpo (obtido: ${currentTarget})`
    );
    console.log(`✓ Alvo alterado com sucesso para: ${currentTarget}`);

    // Capturar screenshot do radar militar em ação
    const screenshotPath = path.join(ARTIFACT_DIR, '01_bounty_sonar_radar_screen.png');
    await radar.screenshot({ path: screenshotPath });
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
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 5.3 PASSARAM COM 100% DE SUCESSO!');
    console.log('=============================================================\n');
  } catch (error) {
    console.error('❌ Erro durante o teste da História 5.3:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStory53();
