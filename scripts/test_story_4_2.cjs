const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

const ARTIFACT_DIR = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';

async function testStory42() {
  console.log('=== TESTES PLAYWRIGHT: STORY 4.2 — CRÔNICA AUTORAL, BIO & TOQUES PESSOAIS ===\n');

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

    // Scroll até a seção About para acionar animações e visibilidade
    console.log('\n[2/4] Validando conteúdo da crônica autoral e marcas pessoais...');
    const aboutSection = page.locator('#about');
    await aboutSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const contentPanel = page.locator('[data-about-content-panel]');
    await contentPanel.waitFor({ state: 'visible', timeout: 5000 });
    const contentText = await contentPanel.innerText();

    // 1. Validar menção à Magalu Cloud
    assert(
      contentText.includes('Magalu Cloud'),
      'Crônica deve mencionar Magalu Cloud como trajetória de engenharia'
    );
    console.log('✓ Menção à Magalu Cloud validada na narrativa e ficha técnica');

    // 2. Validar menção a 60 quadros por segundo / interfaces expressivas
    assert(
      contentText.includes('60 quadros por segundo') || contentText.includes('60 FPS'),
      'Crônica deve conter a assinatura de fluidez (60 quadros por segundo)'
    );
    console.log('✓ Assinatura de fluidez visual e técnica validada');

    // 3. Validar toques pessoais genuínos: Helena e Noivado
    assert(
      contentText.includes('Helena') && contentText.includes('Noivo'),
      'Crônica deve conter os pilares humanos: Helena e Noivo'
    );
    console.log('✓ Pilares humanos genuínos validados (Pai da Helena 👧❤️ • Noivo 💍)');

    // 4. Validar citação do manifesto autoral
    const manifestoQuote = contentPanel.locator('blockquote');
    await manifestoQuote.waitFor({ state: 'visible' });
    const quoteText = await manifestoQuote.innerText();
    assert(
      quoteText.toLowerCase().includes('altíssimo rendimento arquitetural'),
      `Manifesto deve conter a citação autoral (obtido: "${quoteText}")`
    );
    console.log('✓ Citação do manifesto autoral validada com destaque');

    // 5. Validar presença do bloco de telemetria / ficha técnica
    assert(
      contentText.includes('CURRENT POSITION') && contentText.includes('HUMAN CORE'),
      'Ficha técnica do operador deve conter campos estruturados'
    );
    console.log('✓ Ficha técnica / telemetria do operador validada');

    console.log('\n[3/4] Capturando screenshot de alta fidelidade do Dossiê do Operador...');
    const screenshotPath = path.join(ARTIFACT_DIR, '01_about_bio_narrative_storyboard.png');
    await aboutSection.screenshot({ path: screenshotPath });
    console.log(`✓ Screenshot salvo em: ${screenshotPath}`);

    console.log('\n[4/4] Validando contenção responsiva e ausência de overflow horizontal...');
    const viewports = [
      { name: 'Mobile Mini (375px)', width: 375, height: 667 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Desktop (1440px)', width: 1440, height: 900 },
      { name: 'Ultrawide (2560px)', width: 2560, height: 1440 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.locator('#about').scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));

      assert(
        !hasHorizontalScroll,
        `Overflow horizontal detectado em ${vp.name}: scrollWidth=${metrics.scrollWidth} > clientWidth=${metrics.clientWidth}`
      );
      console.log(`  ✓ ${vp.name}: scrollWidth=${metrics.scrollWidth}px <= clientWidth=${metrics.clientWidth}px`);
    }

    console.log('\n=============================================================');
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 4.2 PASSARAM COM 100% DE SUCESSO!');
    console.log('=============================================================\n');
  } catch (error) {
    console.error('❌ Erro durante o teste da História 4.2:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStory42();
