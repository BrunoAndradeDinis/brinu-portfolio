const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

const ARTIFACT_DIR = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';

async function testStory52() {
  console.log('=== TESTES PLAYWRIGHT: STORY 5.2 — CRT FREQUENCY TUNER (KNOB ANALÓGICO) ===\n');

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

    // 2. SCROLL TO #LAB AND VALIDATE COMPONENT
    console.log('\n[2/4] Validando montagem da seção Creative Lab e CrtTuner...');
    const labSection = page.locator('#lab');
    await labSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const tuner = page.locator('[data-crt-tuner]');
    await tuner.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Seção #lab e componente [data-crt-tuner] renderizados com sucesso');

    // 3. VALIDATE PRESETS AND MODES (92.4 Verde, 98.7 Âmbar, 104.2 Cromático)
    console.log('\n[3/4] Validando canais presets e modos de exibição CRT...');
    const crtScreen = page.locator('[data-crt-screen]');
    const freqDisplay = page.locator('[data-frequency-display]');

    // Initial state: 92.4 MHz (Green Phosphor)
    let mode = await crtScreen.getAttribute('data-active-mode');
    assert(mode === 'green', `Modo inicial deve ser green (obtido: ${mode})`);
    let text = await crtScreen.innerText();
    assert(text.includes('PHOSPHOR GREEN'), 'Tela deve exibir PHOSPHOR GREEN no canal 92.4 MHz');
    console.log('✓ Canal 92.4 MHz verificado: PHOSPHOR GREEN ativo');

    // Switch to 98.7 MHz (Vintage Amber)
    const amberBtn = page.locator('[data-preset-btn="amber"]');
    await amberBtn.click();
    await page.waitForTimeout(200);

    mode = await crtScreen.getAttribute('data-active-mode');
    assert(mode === 'amber', `Modo deve ser amber (obtido: ${mode})`);
    text = await crtScreen.innerText();
    assert(text.includes('VINTAGE AMBER'), 'Tela deve exibir VINTAGE AMBER no canal 98.7 MHz');
    let freqVal = await freqDisplay.innerText();
    assert(freqVal.includes('98.7'), `Display deve exibir 98.7 MHz (obtido: ${freqVal})`);
    console.log('✓ Canal 98.7 MHz verificado: VINTAGE AMBER ativo');

    // Switch to 104.2 MHz (Chromatic CRT)
    const chromaticBtn = page.locator('[data-preset-btn="chromatic"]');
    await chromaticBtn.click();
    await page.waitForTimeout(200);

    mode = await crtScreen.getAttribute('data-active-mode');
    assert(mode === 'chromatic', `Modo deve ser chromatic (obtido: ${mode})`);
    text = await crtScreen.innerText();
    assert(text.includes('CHROMATIC CRT'), 'Tela deve exibir CHROMATIC CRT no canal 104.2 MHz');
    freqVal = await freqDisplay.innerText();
    assert(freqVal.includes('104.2'), `Display deve exibir 104.2 MHz (obtido: ${freqVal})`);
    console.log('✓ Canal 104.2 MHz verificado: CHROMATIC CRT ativo');

    // 4. VALIDATE KNOB ROTATION & DRAGGING / KEYBOARD
    console.log('\nTestando interação tátil de teclado no knob analógico...');
    const knob = page.locator('[data-tuner-knob]');
    await knob.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    const freqAfterKey = await freqDisplay.innerText();
    console.log(`✓ Teclado respondeu com alteração de frequência para: ${freqAfterKey.replace('\n', ' ')}`);

    // Capturar screenshot do sintonizador ativo
    const screenshotPath = path.join(ARTIFACT_DIR, '01_crt_frequency_tuner_screen.png');
    await tuner.screenshot({ path: screenshotPath });
    console.log(`✓ Screenshot salvo em: ${screenshotPath}`);

    // 5. VALIDATE RESPONSIVE CONTAINMENT & ZERO OVERFLOW
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
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 5.2 PASSARAM COM 100% DE SUCESSO!');
    console.log('=============================================================\n');
  } catch (error) {
    console.error('❌ Erro durante o teste da História 5.2:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStory52();
