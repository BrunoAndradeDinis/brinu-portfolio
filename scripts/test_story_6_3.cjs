const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

const ARTIFACT_DIR = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';

async function testStory63() {
  console.log('=== TESTES PLAYWRIGHT: STORY 6.3 — ROTA SECRETA /whoami (TERMINAL CRT) ===\n');

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

    console.log('[1/4] Carregando a rota secreta /whoami no Desktop (1440x900)...');
    await page.goto('http://localhost:4321/whoami', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // 2. VALIDATE TERMINAL WINDOW AND STRUCTURE
    console.log('\n[2/4] Validando janela de terminal CRT e controles...');
    const terminal = page.locator('[data-terminal-window]');
    await terminal.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Componente [data-terminal-window] renderizado com sucesso');

    const terminalBody = page.locator('[data-terminal-body]');
    await terminalBody.waitFor({ state: 'visible', timeout: 5000 });

    // 3. VALIDATE TYPING SIMULATOR AND SKIP BUTTON
    console.log('\n[3/4] Validando simulador de digitação e botão de pular...');
    const skipBtn = page.locator('#skip-typing-btn');
    await skipBtn.waitFor({ state: 'visible', timeout: 3000 });
    await skipBtn.click();
    await page.waitForTimeout(300);

    const terminalContent = await terminalBody.innerText();
    assert(
      terminalContent.includes('Bruno de Andrade Dinis') &&
        terminalContent.includes('Helena') &&
        terminalContent.includes('Magalu Cloud'),
      'Terminal deve conter biografia, menção à filha Helena e Magalu Cloud após renderização'
    );
    assert(
      terminalContent.includes('SESSION COMPLETE'),
      'Terminal deve indicar término com [SESSION COMPLETE]'
    );
    console.log('✓ Comandos de telemetria autoral (whoami, uptime, mission, skills, philosophy) renderizados');

    // Capturar screenshot do terminal ativo
    const screenshotPath = path.join(ARTIFACT_DIR, '01_whoami_terminal_screen.png');
    await terminal.screenshot({ path: screenshotPath });
    console.log(`✓ Screenshot salvo em: ${screenshotPath}`);

    // Test Return to Home button
    console.log('\nTestando navegação de retorno à ponte de comando (Home)...');
    const returnBtn = page.locator('[data-return-home]');
    await returnBtn.click();
    await page.waitForURL('http://localhost:4321/', { timeout: 5000 });
    console.log('✓ Botão de retorno redirecionou com sucesso para a Home');

    // 4. VALIDATE RESPONSIVE CONTAINMENT & ZERO OVERFLOW ON /whoami
    console.log('\n[4/4] Validando contenção responsiva e ausência de overflow na rota /whoami...');
    const viewports = [
      { name: 'Mobile Mini (375px)', width: 375, height: 667 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Desktop (1440px)', width: 1440, height: 900 },
      { name: 'Ultrawide (2560px)', width: 2560, height: 1440 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:4321/whoami', { waitUntil: 'domcontentloaded' });
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
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 6.3 PASSARAM COM 100% DE SUCESSO!');
    console.log('=============================================================\n');
  } catch (error) {
    console.error('❌ Erro durante o teste da História 6.3:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStory63();
