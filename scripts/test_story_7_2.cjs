const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

const ARTIFACT_DIR = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';

async function testStory72() {
  console.log('=== TESTES PLAYWRIGHT: STORY 7.2 — MINI-TERMINAL BOUNTY DISPATCH ===\n');

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

    // 2. SCROLL TO #CONTACT AND VERIFY BOUNTY DISPATCH MOUNT
    console.log('\n[2/5] Validando montagem do mini-terminal Bounty Dispatch...');
    const contactSection = page.locator('#contact');
    await contactSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    const terminal = page.locator('[data-bounty-dispatch]');
    await terminal.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Mini-terminal [data-bounty-dispatch] montado e visível na viewport');

    // 3. TEST VALIDATION ERRORS ON EMPTY SUBMIT
    console.log('\n[3/5] Testando validações de campo em tempo de submissão...');
    const submitBtn = page.locator('[data-dispatch-submit-btn]');
    await submitBtn.click();
    await page.waitForTimeout(300);

    const errorName = page.locator('[data-error-name]');
    const errorEmail = page.locator('[data-error-email]');
    const errorMessage = page.locator('[data-error-message]');

    assert(await errorName.isVisible(), 'Erro de nome deve estar visível');
    assert(await errorEmail.isVisible(), 'Erro de email deve estar visível');
    assert(await errorMessage.isVisible(), 'Erro de mensagem deve estar visível');
    console.log('✓ Erros de validação exibidos corretamente para campos vazios');

    // Test invalid email
    await page.locator('[data-input-name]').fill('Spike Spiegel');
    await page.locator('[data-input-email]').fill('not-an-email');
    await page.locator('[data-input-message]').fill('Curto');
    await submitBtn.click();
    await page.waitForTimeout(300);

    assert(await errorEmail.isVisible(), 'Erro de email inválido deve ser exibido');
    assert(await errorMessage.isVisible(), 'Erro de mensagem curta deve ser exibido');
    console.log('✓ Validação de regex de email e tamanho mínimo de payload validados');

    // 4. TEST SUCCESSFUL DISPATCH & HUD RECEIPT
    console.log('\n[4/5] Preenchendo payload válido e confirmando recibo HUD...');
    await page.locator('[data-input-email]').fill('spike@bebop.space');
    await page.locator('[data-input-message]').fill('Preciso de um sistema de telemetria e áudio interativo Web Audio API.');
    await submitBtn.click();
    await page.waitForTimeout(600);

    const receipt = page.locator('[data-dispatch-receipt]');
    await receipt.waitFor({ state: 'visible', timeout: 3000 });

    const receiptText = await receipt.innerText();
    assert(receiptText.includes('TRANSMISSION ENCRYPTED'), 'Recibo deve indicar transmissão encriptada');
    assert(receiptText.includes('Spike Spiegel'), 'Recibo deve conter o codename do remetente');
    assert(receiptText.includes('spike@bebop.space'), 'Recibo deve conter a frequência de retorno');
    assert(receiptText.includes('RECEIVED ON BEBOP SENSORS'), 'Recibo deve indicar status recebido nos sensores');
    console.log('✓ Recibo HUD emitido com sucesso e telemetria formatada');

    // Capture screenshot of the terminal receipt
    const screenshotPath = path.join(ARTIFACT_DIR, '01_bounty_dispatch_terminal_screen.png');
    await terminal.screenshot({ path: screenshotPath });
    console.log(`✓ Screenshot do terminal salvo em: ${screenshotPath}`);

    // Test Reset
    const newTransmissionBtn = page.locator('[data-new-transmission-btn]');
    await newTransmissionBtn.click();
    await page.waitForTimeout(300);
    assert(await page.locator('[data-input-name]').isVisible(), 'Formulário deve ser restaurado após reset');
    console.log('✓ Botão de nova transmissão restaura o formulário com sucesso');

    // 5. TEST RESPONSIVENESS AND ZERO HORIZONTAL OVERFLOW ACROSS VIEWPORTS
    console.log('\n[5/5] Validando contenção responsiva e ausência de overflow horizontal...');
    const viewports = [
      { name: 'Mobile (375x667)', width: 375, height: 667 },
      { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      { name: 'Desktop (1440x900)', width: 1440, height: 900 },
      { name: 'Ultrawide (2560x1440)', width: 2560, height: 1440 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);

      const overflow = await page.evaluate(() => {
        const docEl = document.documentElement;
        return {
          scrollWidth: docEl.scrollWidth,
          clientWidth: docEl.clientWidth,
          hasOverflow: docEl.scrollWidth > docEl.clientWidth,
        };
      });

      assert(!overflow.hasOverflow, `Overflow horizontal detectado em ${vp.name}: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`);
      console.log(`  ✓ ${vp.name}: scrollWidth=${overflow.scrollWidth} <= clientWidth=${overflow.clientWidth}`);
    }

    console.log('\n===============================================================');
    console.log('✓ TODOS OS TESTES DA STORY 7.2 FORAM EXECUTADOS COM SUCESSO!');
    console.log('===============================================================\n');
  } catch (error) {
    console.error('❌ Falha nos testes da Story 7.2:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStory72();
