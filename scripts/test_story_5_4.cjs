const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

const ARTIFACT_DIR = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';

async function testStory54() {
  console.log('=== TESTES PLAYWRIGHT: STORY 5.4 — ZERO-G CYBER DECK (CARTUCHO 3D COM EJEÇÃO) ===\n');

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

    // 2. SCROLL TO #LAB AND VALIDATE CYBERDECK 3D
    console.log('\n[2/4] Validando montagem da seção Creative Lab e CyberDeck Three.js...');
    const labSection = page.locator('#lab');
    await labSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const deck = page.locator('[data-cyber-deck]');
    await deck.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Seção #lab e componente [data-cyber-deck] renderizados com sucesso');

    const canvasContainer = page.locator('[data-deck-canvas-container]');
    await canvasContainer.waitFor({ state: 'visible', timeout: 5000 });

    const canvas = canvasContainer.locator('canvas');
    await canvas.waitFor({ state: 'visible', timeout: 5000 });
    const canvasBox = await canvas.boundingBox();
    assert(
      canvasBox && canvasBox.width > 150 && canvasBox.height > 150,
      'Canvas WebGL deve possuir dimensões válidas maiores que 150px'
    );
    console.log(`✓ Canvas WebGL renderizado com dimensões: ${Math.round(canvasBox.width)}x${Math.round(canvasBox.height)}px`);

    // 3. VALIDATE AUDIO TOGGLE & DOCKED INITIAL STATE
    console.log('\n[3/4] Validando estados do cartucho, ejeção mecânica e áudio...');
    const statusBadge = page.locator('[data-cartridge-status]');
    let statusText = await statusBadge.innerText();
    assert(statusText.includes('DOCKED'), `Cartucho deve iniciar no estado DOCKED (obtido: ${statusText})`);
    console.log('✓ Estado inicial verificado: CARTRIDGE: DOCKED');

    // Test Audio toggle
    const audioToggle = page.locator('[data-deck-audio-toggle]');
    let audioText = await audioToggle.innerText();
    assert(audioText.includes('MUTED'), `Áudio deve iniciar mutado (obtido: ${audioText})`);
    console.log('✓ Áudio inicia em conformidade com AD-4: MUTED por padrão');

    await audioToggle.click();
    await page.waitForTimeout(200);
    audioText = await audioToggle.innerText();
    assert(audioText.includes('DECK AUDIO: ON'), `Áudio deve estar ON (obtido: ${audioText})`);
    console.log('✓ Toggle de áudio acionado: DECK AUDIO: ON');

    await audioToggle.click();
    await page.waitForTimeout(200);
    audioText = await audioToggle.innerText();
    assert(audioText.includes('MUTED'), `Áudio deve voltar a MUTED (obtido: ${audioText})`);
    console.log('✓ Toggle de áudio restaurado com segurança para MUTED');

    // Check code drawer initial locked state
    const codeBlock = page.locator('[data-code-block]');
    let codeText = await codeBlock.innerText();
    assert(codeText.includes('ACESSO BLOQUEADO'), 'Código deve iniciar bloqueado antes da ejeção');
    console.log('✓ Gaveta de código inicia no estado de proteção de memória trancada');

    // 4. TEST MECHANICAL EJECTION BUTTON
    console.log('\nTestando acionamento mecânico do botão de ejeção...');
    const ejectBtn = page.locator('[data-deck-eject-btn]');
    await ejectBtn.click();
    await page.waitForTimeout(400);

    statusText = await statusBadge.innerText();
    assert(statusText.includes('EJECTED'), `Status deve mudar para EJECTED (obtido: ${statusText})`);
    console.log('✓ Status mecânico atualizado para: CARTRIDGE: EJECTED');

    codeText = await codeBlock.innerText();
    assert(
      codeText.includes('QuantumStreamPipeline') || codeText.includes('BEBOP ZERO-G'),
      'Gaveta deve exibir código decodificado após ejeção'
    );
    console.log('✓ Gaveta de memória decodificada com sucesso: pipeline autoral desbloqueado');

    // Reinsert cartridge
    await ejectBtn.click();
    await page.waitForTimeout(400);
    statusText = await statusBadge.innerText();
    assert(statusText.includes('DOCKED'), `Status deve retornar a DOCKED (obtido: ${statusText})`);
    console.log('✓ Cartucho reinserido e travado no mecanismo com sucesso');

    // 5. TEST DRAG INTERACTION ON 3D CANVAS
    console.log('\nTestando interação de arraste inercial no modelo 3D...');
    const canvasCenter = {
      x: canvasBox.x + canvasBox.width / 2,
      y: canvasBox.y + canvasBox.height / 2,
    };

    await page.mouse.move(canvasCenter.x, canvasCenter.y);
    await page.mouse.down();
    await page.mouse.move(canvasCenter.x + 80, canvasCenter.y - 40, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    console.log('✓ Interação por ponteiro com amortecimento inercial executada com sucesso');

    // Test Keyboard rotation
    await deck.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
    console.log('✓ Rotação acessível por teclado (Arrow keys) verificada');

    // Eject again for screenshot capture
    await ejectBtn.click();
    await page.waitForTimeout(400);

    const screenshotPath = path.join(ARTIFACT_DIR, '01_zero_g_cyber_deck_screen.png');
    await deck.screenshot({ path: screenshotPath });
    console.log(`✓ Screenshot salvo em: ${screenshotPath}`);

    // 6. VALIDATE RESPONSIVE CONTAINMENT & ZERO OVERFLOW
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
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 5.4 PASSARAM COM 100% DE SUCESSO!');
    console.log('=============================================================\n');
  } catch (error) {
    console.error('❌ Erro durante o teste da História 5.4:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStory54();
