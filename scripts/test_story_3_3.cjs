const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

async function testStory33() {
  console.log('=== TESTES PLAYWRIGHT: STORY 3.3 — MICROINTERAÇÕES DE HOVER E SHADER DE DISTORÇÃO ===\n');

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

    const worksSection = page.locator('#works');
    await worksSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // 2. TEST HOVER TRANSITION ON CARDS
    console.log('\n[2/4] Validando transição de hover, iluminação do badge e camada de distorção...');
    const caseCards = ['aurastream', 'quake-log-parser', 'jokenpo-franky', 'the-warriors'];

    for (const id of caseCards) {
      const cardSelector = `#case-${id}`;
      const card = page.locator(cardSelector);
      assert(await card.count() > 0, `Card ${cardSelector} deve existir`);

      // Estado antes do hover
      const initialBadgeStyle = await card.locator('[data-badge-indicator]').evaluate((el) => {
        const comp = window.getComputedStyle(el);
        return {
          bg: comp.backgroundColor,
          color: comp.color,
          shadow: comp.boxShadow,
        };
      });

      const initialDistortionOpacity = await card.locator('[data-card-distortion]').evaluate((el) => {
        return window.getComputedStyle(el).opacity;
      });

      assert.strictEqual(initialDistortionOpacity, '0', `Camada de distorção deve estar oculta (opacity: 0) antes do hover`);

      // Executar hover no card
      await card.hover();
      await page.waitForTimeout(220); // Aguardar transição (< 250ms)

      // Estado após o hover
      const hoveredBadgeStyle = await card.locator('[data-badge-indicator]').evaluate((el) => {
        const comp = window.getComputedStyle(el);
        return {
          bg: comp.backgroundColor,
          color: comp.color,
          shadow: comp.boxShadow,
        };
      });

      const hoveredDistortionOpacity = await card.locator('[data-card-distortion]').evaluate((el) => {
        return window.getComputedStyle(el).opacity;
      });

      // Validar iluminação do badge para âmbar (#EBA602 -> aprox rgb(235, 166, 2))
      const rgbMatch = hoveredBadgeStyle.bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      const isAmber = rgbMatch && Number(rgbMatch[1]) >= 225 && Number(rgbMatch[2]) >= 155 && Number(rgbMatch[3]) <= 15;
      assert(
        isAmber,
        `Badge deve transicionar para âmbar ao passar o mouse em ${id} (obtido: ${hoveredBadgeStyle.bg})`
      );
      assert(
        Number(hoveredDistortionOpacity) >= 0.95,
        `Camada de distorção deve estar visível (opacity >= 0.95) ao hover em ${id} (obtido: ${hoveredDistortionOpacity})`
      );

      console.log(`  ✓ Case [${id}]: Badge âmbar ativado (${hoveredBadgeStyle.bg}), distorção CRT visível`);
    }

    // 3. CAPTURE HOVERED CARD SCREENSHOT
    console.log('\n[3/4] Capturando screenshot de card em estado hover...');
    const auraCard = page.locator('#case-aurastream');
    await auraCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000); // Aguardar revelação GSAP dos cards completar 100%
    await auraCard.hover();
    await page.waitForTimeout(300);

    const artifactDir = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';
    const hoverScreenshotPath = path.join(artifactDir, '02_card_hover_amber_scanline.png');
    await auraCard.screenshot({ path: hoverScreenshotPath });
    console.log(`✓ Screenshot de hover salvo em: ${hoverScreenshotPath}`);

    // 4. TEST CLICKABILITY OF BUTTONS (POINTER EVENTS INTEGRITY)
    console.log('\n[4/4] Validando integridade de cliques e pointer-events nos botões de ação...');
    const linkClickable = await page.evaluate(() => {
      const card = document.getElementById('case-aurastream');
      const distortion = card ? card.querySelector('[data-card-distortion]') : null;
      const firstLink = card ? card.querySelector('a') : null;

      if (!distortion || !firstLink) return { ok: false };

      const distStyle = window.getComputedStyle(distortion);
      const isPointerNone = distStyle.pointerEvents === 'none';

      // Hit-test para verificar se o ponto do link é interceptado pelo link e não pelo overlay
      const rect = firstLink.getBoundingClientRect();
      const topElement = document.elementFromPoint(rect.left + 10, rect.top + 10);
      const isLinkOrChild = firstLink.contains(topElement);

      return {
        ok: isPointerNone && isLinkOrChild,
        pointerEvents: distStyle.pointerEvents,
        targetTag: topElement ? topElement.tagName : null,
      };
    });

    assert(linkClickable.ok, `Botões devem receber cliques diretamente sem obstrução do overlay (pointer-events: ${linkClickable.pointerEvents}, target: ${linkClickable.targetTag})`);
    console.log('✓ Links de ação perfeitamente clicáveis com pointer-events-none no overlay');

    console.log('\n=============================================================');
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 3.3 PASSARAM COM 100% DE SUCESSO!');
    console.log('=============================================================\n');
  } finally {
    await browser.close();
  }
}

testStory33().catch((err) => {
  console.error('\n❌ ERRO NOS TESTES DA HISTÓRIA 3.3:');
  console.error(err);
  process.exit(1);
});
