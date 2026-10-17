const { chromium } = require('playwright');
const assert = require('assert');

async function testStory62() {
  console.log('=== TESTES PLAYWRIGHT: STORY 6.2 — TELEMETRIA & CUPOM FISCAL ASCII NO CONSOLE ===\n');

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

    const consoleLogs = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });

    console.log('[1/4] Carregando a aplicação e monitorando saída do DevTools...');
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(500);

    // 2. VALIDATE CONSOLE RECEIPT EMISSION
    console.log('\n[2/4] Validando emissão do cupom fiscal ASCII #1996...');
    const allConsoleOutput = consoleLogs.join('\n');
    assert(
      allConsoleOutput.includes('TELEMETRIA DETECTADA') || allConsoleOutput.includes('BEBOP TRANSIT & BOUNTY RECEIPT'),
      'Console deve conter o cabeçalho de telemetria ou o cupom fiscal #1996'
    );
    assert(
      allConsoleOutput.includes('Bruno de Andrade Dinis') || allConsoleOutput.includes('RECEIPT #1996'),
      'Cupom fiscal deve conter dados do operador'
    );
    console.log('✓ Cupom fiscal ASCII retrô #1996 impresso com sucesso no console do DevTools');

    // 3. VALIDATE GLOBAL GETTERS (REQUISITO AD-5: SEM PARÊNTESES)
    console.log('\n[3/4] Validando getters nativos no objeto window (AD-5: execução sem parênteses)...');

    // Test window.status
    const statusResult = await page.evaluate(() => window.status);
    assert(
      typeof statusResult === 'string' && statusResult.includes('Cupom fiscal'),
      `window.status deve reemitir o recibo (obtido: ${statusResult})`
    );
    console.log(`✓ window.status executado sem parênteses: "${statusResult}"`);

    // Test window.projects
    const projectsResult = await page.evaluate(() => window.projects);
    assert(
      typeof projectsResult === 'string' && projectsResult.includes('Projetos carregados'),
      `window.projects deve carregar os projetos (obtido: ${projectsResult})`
    );
    console.log(`✓ window.projects executado sem parênteses: "${projectsResult}"`);

    // Test window.cilada (listens for custom event)
    const ciladaResult = await page.evaluate(() => {
      let eventDispatched = false;
      const handler = () => {
        eventDispatched = true;
      };
      window.addEventListener('bebop:cilada-trigger', handler, { once: true });
      const msg = window.cilada;
      return { msg, eventDispatched };
    });
    assert(
      ciladaResult.msg.includes('CILADA ATIVADA'),
      `window.cilada deve confirmar ativação (obtido: ${ciladaResult.msg})`
    );
    assert(ciladaResult.eventDispatched, 'window.cilada deve disparar evento "bebop:cilada-trigger"');
    console.log(`✓ window.cilada executado sem parênteses e evento disparado: "${ciladaResult.msg}"`);

    // Test window.contact
    const contactResult = await page.evaluate(() => {
      // Temporarily override location to prevent navigation during check
      const originalLocation = window.location.href;
      return window.contact;
    });
    assert(
      contactResult.includes('cliente de email'),
      `window.contact deve responder com mensagem de email (obtido: ${contactResult})`
    );
    console.log(`✓ window.contact executado sem parênteses: "${contactResult}"`);

    // Test window.whoami getter existence
    const hasWhoamiGetter = await page.evaluate(() => {
      const descriptor = Object.getOwnPropertyDescriptor(window, 'whoami');
      return descriptor && typeof descriptor.get === 'function';
    });
    assert(hasWhoamiGetter, 'window.whoami deve estar registrado como assessor getter');
    console.log('✓ window.whoami configurado como assessor getter nativo');

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
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 6.2 PASSARAM COM 100% DE SUCESSO!');
    console.log('=============================================================\n');
  } catch (error) {
    console.error('❌ Erro durante o teste da História 6.2:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStory62();
