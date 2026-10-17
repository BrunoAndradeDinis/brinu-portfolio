const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

const ARTIFACT_DIR = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';

async function testStory61() {
  console.log('=== TESTES PLAYWRIGHT: STORY 6.1 — RIGHT CLICK GUARD E TOAST HUD ===\n');

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

    // 2. TRIGGER RIGHT CLICK (CONTEXTMENU)
    console.log('\n[2/4] Disparando clique com botão direito (contextmenu)...');
    const toast = page.locator('[data-right-click-toast]');
    assert((await toast.count()) === 0, 'Toast não deve estar visível antes do clique direito');

    // Right-click somewhere on the page
    await page.mouse.click(500, 400, { button: 'right' });
    await toast.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✓ Intercepção de clique direito disparada e toast [data-right-click-toast] exibido com sucesso');

    // Validate toast content
    const toastText = await toast.innerText();
    assert(
      toastText.includes('F12') && toastText.includes('TELEMETRY INTERCEPTION'),
      'Toast deve conter menção a F12 e alerta de interceptação'
    );
    console.log('✓ Conteúdo do toast orienta desenvolvedores para F12 / DevTools');

    // Capturar screenshot do toast ativo
    const screenshotPath = path.join(ARTIFACT_DIR, '01_right_click_guard_toast.png');
    await toast.screenshot({ path: screenshotPath });
    console.log(`✓ Screenshot salvo em: ${screenshotPath}`);

    // 3. TEST DISMISSAL METHODS
    console.log('\n[3/4] Validando métodos de fechamento do toast...');

    // Method A: Close button
    const closeBtn = toast.locator('[data-toast-close]');
    await closeBtn.click();
    await toast.waitFor({ state: 'detached', timeout: 2000 });
    console.log('✓ Fechamento via botão [data-toast-close] (X) verificado');

    // Method B: Escape key
    await page.mouse.click(600, 350, { button: 'right' });
    await toast.waitFor({ state: 'visible', timeout: 3000 });
    await page.keyboard.press('Escape');
    await toast.waitFor({ state: 'detached', timeout: 2000 });
    console.log('✓ Fechamento acessível via tecla [Escape] verificado');

    // Method C: Outside click
    await page.mouse.click(600, 350, { button: 'right' });
    await toast.waitFor({ state: 'visible', timeout: 3000 });
    await page.mouse.click(100, 100); // Outside
    await toast.waitFor({ state: 'detached', timeout: 2000 });
    console.log('✓ Fechamento via clique fora do elemento verificado');

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
      await page.waitForTimeout(200);

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
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 6.1 PASSARAM COM 100% DE SUCESSO!');
    console.log('=============================================================\n');
  } catch (error) {
    console.error('❌ Erro durante o teste da História 6.1:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStory61();
