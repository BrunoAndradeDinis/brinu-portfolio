const { chromium } = require('playwright');
const assert = require('assert');

async function testStory31() {
  console.log('=== TESTES PLAYWRIGHT: STORY 3.1 — SEÇÃO SELECTEDWORKS & GRID TÉCNICO ===\n');

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

    console.log('[1/4] Carregando a página no Desktop (1440x900)...');
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(500);

    // 2. CHECK ELEMENT IDENTIFIERS AND MARKS
    console.log('\n[2/4] Validando título temático BOUNTY ARCHIVE e marcadores cruzados (+)...');
    const technicalCheck = await page.evaluate(() => {
      const works = document.getElementById('works');
      const bountyTitle = works ? works.querySelector('[data-bounty-title]') : null;
      const techGrid = works ? works.querySelector('[data-technical-grid]') : null;
      const crosshairs = techGrid ? Array.from(techGrid.querySelectorAll('div')).filter(d => d.innerText.trim() === '+') : [];
      const cards = works ? works.querySelectorAll('[data-reel-card]') : [];

      return {
        hasWorks: !!works,
        hasTitle: !!bountyTitle,
        titleText: bountyTitle ? bountyTitle.innerText.trim() : '',
        hasGrid: !!techGrid,
        crosshairsCount: crosshairs.length,
        cardsCount: cards.length,
      };
    });

    assert(technicalCheck.hasWorks, 'Seção #works deve existir');
    assert(technicalCheck.hasTitle, 'Título com data-bounty-title deve existir');
    assert(technicalCheck.titleText.includes('BOUNTY ARCHIVE'), `Título deve conter "BOUNTY ARCHIVE" (obtido: ${technicalCheck.titleText})`);
    assert(technicalCheck.hasGrid, 'Container com data-technical-grid deve existir');
    assert.strictEqual(technicalCheck.crosshairsCount, 4, `Devem existir 4 marcadores cruzados (+) nos cantos (obtidos: ${technicalCheck.crosshairsCount})`);
    assert.strictEqual(technicalCheck.cardsCount, 4, `Devem existir 4 cards de projetos autorais (obtidos: ${technicalCheck.cardsCount})`);

    console.log(`✓ Título temático validado: "${technicalCheck.titleText}"`);
    console.log(`✓ Grid técnico detectado com 4 marcadores cruzados (+) nos cantos`);
    console.log(`✓ 4 cards autorais renderizados dentro do grid`);

    // 3. RESPONSIVE GRID VALIDATION (1 COLUNA MOBILE -> 2 COLUNAS DESKTOP)
    console.log('\n[3/4] Validando transição de 1 coluna em mobile para 2 colunas em desktop...');

    // Mobile Check (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    const mobileColumns = await page.evaluate(() => {
      const track = document.querySelector('[data-reel-track="1"]');
      if (!track) return null;
      const comp = window.getComputedStyle(track);
      return comp.gridTemplateColumns.split(' ').length;
    });

    assert.strictEqual(mobileColumns, 1, `Em mobile (375px), o grid deve ter 1 coluna (obtido: ${mobileColumns})`);
    console.log('✓ Mobile (375px): Grid operando estritamente em 1 coluna');

    // Desktop Check (1440px)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);

    const desktopColumns = await page.evaluate(() => {
      const track = document.querySelector('[data-reel-track="1"]');
      if (!track) return null;
      const comp = window.getComputedStyle(track);
      return comp.gridTemplateColumns.split(' ').length;
    });

    assert.strictEqual(desktopColumns, 2, `Em desktop (1440px), o grid deve ter 2 colunas (obtido: ${desktopColumns})`);
    console.log('✓ Desktop (1440px): Grid adaptado com sucesso para 2 colunas');

    // 4. OVERFLOW AND SCROLL CHECK ACROSS ALL VIEWPORTS
    console.log('\n[4/4] Validando ausência de overflow horizontal...');
    const breakpoints = [
      { name: 'Mobile Mini', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1440, height: 900 },
      { name: 'Ultrawide', width: 2560, height: 1440 },
    ];

    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(200);

      const overflow = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        return { docW, winW, hasOverflow: docW > winW };
      });

      assert(!overflow.hasOverflow, `Overflow em ${bp.name}: docW=${overflow.docW}, winW=${overflow.winW}`);
      console.log(`  ✓ ${bp.name} (${bp.width}px): scrollWidth=${overflow.docW}px <= clientWidth=${overflow.winW}px`);
    }

    console.log('\n=============================================================');
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 3.1 PASSARAM COM 100% DE SUCESSO!');
    console.log('=============================================================\n');
  } finally {
    await browser.close();
  }
}

testStory31().catch((err) => {
  console.error('\n❌ ERRO NOS TESTES DA HISTÓRIA 3.1:');
  console.error(err);
  process.exit(1);
});
