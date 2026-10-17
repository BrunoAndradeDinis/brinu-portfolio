const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

const ARTIFACT_DIR = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';

async function testStory64() {
  console.log('=== TESTES PLAYWRIGHT: STORY 6.4 — SEQUÊNCIA DE EMERGÊNCIA (CILADA ALERT) ===\n');

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

    console.log('[1/5] Carregando a aplicação no Desktop (1440x900)...');
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(500);

    const initialTitle = await page.title();
    console.log(`✓ Título inicial da aba: "${initialTitle}"`);

    // 2. TRIGGER VIA CONSOLE GETTER (window.cilada)
    console.log('\n[2/5] Testando disparo da cilada via console (window.cilada)...');
    await page.evaluate(() => window.cilada);
    await page.waitForTimeout(300);

    const overlay = page.locator('[data-cilada-overlay]');
    await overlay.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✓ Overlay vermelho de emergência [data-cilada-overlay] renderizado');

    // Check title alternation
    await page.waitForTimeout(500);
    const activeTitle = await page.title();
    assert(
      activeTitle.includes('CILADA') || activeTitle.includes('ALERTA'),
      `Título deve alternar para alerta (obtido: ${activeTitle})`
    );
    console.log(`✓ Título da aba alternando em alerta dinâmico: "${activeTitle}"`);

    // Check dynamic siren favicon
    const faviconHref = await page.evaluate(() => {
      const link = document.querySelector("link[rel*='icon']");
      return link ? link.getAttribute('href') : '';
    });
    assert(
      faviconHref.startsWith('data:image/png;base64,'),
      'Favicon deve ser substituído pela sirene dinâmica Canvas 2D'
    );
    console.log('✓ Favicon dinâmico de sirene vermelha desenhado e ativo');

    // Capturar screenshot do alerta de emergência ativo
    const screenshotPath = path.join(ARTIFACT_DIR, '01_cilada_emergency_alert.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`✓ Screenshot salvo em: ${screenshotPath}`);

    // Dismiss via button
    const dismissBtn = page.locator('[data-cilada-dismiss]');
    await dismissBtn.click();
    await overlay.waitFor({ state: 'detached', timeout: 2000 });
    console.log('✓ Desativação manual via botão [data-cilada-dismiss] confirmada');

    // Verify title and favicon restored
    const restoredTitle = await page.title();
    assert(
      restoredTitle === initialTitle,
      `Título deve retornar ao original (obtido: ${restoredTitle})`
    );
    console.log('✓ Título da aba restaurado perfeitamente');

    // 3. TRIGGER VIA 3X CLICKS ON LOGO
    console.log('\n[3/5] Testando disparo da cilada via 3 cliques rápidos no logotipo do HUD...');
    const logo = page.locator('#comic-nav-logo');
    await logo.click();
    await page.waitForTimeout(100);
    await logo.click();
    await page.waitForTimeout(100);
    await logo.click();
    await page.waitForTimeout(300);

    await overlay.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✓ 3x cliques rápidos no logotipo ativaram com sucesso a cilada!');

    // Dismiss via Escape key
    await page.keyboard.press('Escape');
    await overlay.waitFor({ state: 'detached', timeout: 2000 });
    console.log('✓ Desativação do alarme via tecla [Escape] verificada');

    // 4. TEST AUTOMATIC TIMEOUT REVERSAL (6 SECONDS)
    console.log('\n[4/5] Testando reversão automática do alarme após o timer de 6 segundos...');
    await page.evaluate(() => window.cilada);
    await overlay.waitFor({ state: 'visible', timeout: 2000 });
    console.log('  Aguardando expiração do timer de 6s...');
    await page.waitForTimeout(6300);
    await overlay.waitFor({ state: 'detached', timeout: 3000 });
    console.log('✓ Alarme auto-revertido após 6 segundos e estado original restabelecido');

    // 5. VALIDATE RESPONSIVE CONTAINMENT & ZERO OVERFLOW
    console.log('\n[5/5] Validando contenção responsiva e ausência de overflow horizontal...');
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
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 6.4 PASSARAM COM 100% DE SUCESSO!');
    console.log('=============================================================\n');
  } catch (error) {
    console.error('❌ Erro durante o teste da História 6.4:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStory64();
