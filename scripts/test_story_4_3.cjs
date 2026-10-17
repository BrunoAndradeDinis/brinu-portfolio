const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

const ARTIFACT_DIR = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';

async function testStory43() {
  console.log('=== TESTES PLAYWRIGHT: STORY 4.3 — MATRIZ DE HABILIDADES EM VINHETAS DE HQ ===\n');

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

    // Scroll até a seção Skills Matrix
    console.log('\n[2/4] Validando as 4 vinhetas de HQ e badges de competências...');
    const skillsMatrix = page.locator('[data-skills-matrix]');
    await skillsMatrix.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    await skillsMatrix.waitFor({ state: 'visible', timeout: 5000 });

    // 1. Validar presença das 4 categorias de vinhetas
    const expectedCategories = ['core', 'cloud', 'creative', 'quality'];
    for (const catId of expectedCategories) {
      const vignette = page.locator(`[data-skill-vignette="${catId}"]`);
      await vignette.waitFor({ state: 'visible' });
      const title = await vignette.locator('h4').innerText();
      console.log(`✓ Vinheta [${catId}] detectada: "${title}"`);
    }

    // 2. Validar contagem total de badges de habilidades
    const badges = page.locator('[data-skill-badge]');
    const count = await badges.count();
    assert(count >= 24, `Deve conter ao menos 24 badges de habilidades (encontrados: ${count})`);
    console.log(`✓ Total de ${count} badges de habilidades verificados`);

    // 3. Validar microinteração de hover em badge tátil
    console.log('\nValidando microinteração de hover no badge de habilidade...');
    const firstBadge = badges.first();
    const initialColor = await firstBadge.evaluate((el) => window.getComputedStyle(el).color);
    
    await firstBadge.hover();
    await page.waitForTimeout(300);

    const hoveredColor = await firstBadge.evaluate((el) => window.getComputedStyle(el).color);
    console.log(`✓ Transição de cor no hover verificada (inicial: ${initialColor} -> hover: ${hoveredColor})`);
    
    // O hover aplica acid-green (#2EFE0C -> rgb(46, 254, 12))
    const isAcidGreen = hoveredColor.includes('46, 254, 12') || hoveredColor.includes('46,254,12');
    assert(isAcidGreen, `Badge deve transicionar para verde ácido no hover (obtido: ${hoveredColor})`);
    console.log('✓ Microinteração de hover com iluminação verde ácido validada com sucesso');

    console.log('\n[3/4] Capturando screenshot de alta fidelidade da Matriz de Skills...');
    const screenshotPath = path.join(ARTIFACT_DIR, '01_about_skills_matrix_vignettes.png');
    await skillsMatrix.screenshot({ path: screenshotPath });
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
      await page.locator('[data-skills-matrix]').scrollIntoViewIfNeeded();
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
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 4.3 PASSARAM COM 100% DE SUCESSO!');
    console.log('=============================================================\n');
  } catch (error) {
    console.error('❌ Erro durante o teste da História 4.3:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStory43();
