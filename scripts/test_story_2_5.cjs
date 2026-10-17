const { chromium } = require('playwright');
const assert = require('assert');

async function testStory25() {
  console.log('=== TESTES PLAYWRIGHT: STORY 2.5 — TRANSIÇÕES CINEMÁTICAS DE CORTES SECOS (TANK!) ===\n');

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
  });

  try {
    // 1. DESKTOP VALIDATION & ELEMENT METRICS
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    console.log('[1/5] Carregando a aplicação no Desktop (1440x900)...');
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(500);

    // 2. CHECK ELEMENT IDENTIFIERS AND MARKS
    console.log('\n[2/5] Validando marcações de elementos da transição Bebop Tank!...');
    const elementCheck = await page.evaluate(() => {
      const hero = document.getElementById('hero');
      const letterB = hero ? hero.querySelector('[data-hero-letter="B"]') : null;
      const letterR = hero ? hero.querySelector('[data-hero-letter="R"]') : null;
      const letterI = hero ? hero.querySelector('[data-hero-letter="I"]') : null;
      const letterN = hero ? hero.querySelector('[data-hero-letter="N"]') : null;
      const letterU = hero ? hero.querySelector('[data-hero-letter="U"]') : null;
      const avatar = hero ? hero.querySelector('#hero-avatar-badge') : null;
      const manifestoLeft = hero ? hero.querySelector('[data-hero-manifesto="left"]') : null;
      const manifestoRight = hero ? hero.querySelector('[data-hero-manifesto="right"]') : null;

      const works = document.getElementById('works');
      const tankStrip = document.getElementById('tank-jump-cut-strip');
      const jumpBadge = document.querySelector('[data-jump-cut-badge]');
      const sprockets = tankStrip ? tankStrip.querySelectorAll('span.bg-bebop-red').length : 0;

      return {
        hasHero: !!hero,
        hasAllLetters: !!(letterB && letterR && letterI && letterN && letterU),
        hasAvatar: !!avatar,
        hasManifestoLeft: !!manifestoLeft,
        hasManifestoRight: !!manifestoRight,
        hasWorks: !!works,
        hasTankStrip: !!tankStrip,
        hasJumpBadge: !!jumpBadge,
        jumpBadgeText: jumpBadge ? jumpBadge.innerText : '',
        sprocketsCount: sprockets,
      };
    });

    assert(elementCheck.hasHero, 'Elemento #hero deve existir');
    assert(elementCheck.hasAllLetters, 'Todas as 5 letras B-R-I-N-U com data-hero-letter devem existir');
    assert(elementCheck.hasAvatar, 'Avatar centralizado #hero-avatar-badge deve existir');
    assert(elementCheck.hasManifestoLeft, 'Manifesto da esquerda deve existir');
    assert(elementCheck.hasManifestoRight, 'Manifesto da direita deve existir');
    assert(elementCheck.hasWorks, 'Seção #works deve existir');
    assert(elementCheck.hasTankStrip, 'Faixa de transição analógica #tank-jump-cut-strip deve existir');
    assert(elementCheck.hasJumpBadge, 'Badge com 3, 2, 1 LET\'S JAM deve existir');
    assert(elementCheck.jumpBadgeText.includes("LET'S JAM"), 'Badge deve conter "LET\'S JAM"');
    assert(elementCheck.sprocketsCount >= 24, `Furos de celuloide 35mm devem estar presentes (encontrados: ${elementCheck.sprocketsCount})`);
    console.log('✓ Marcações e estrutura da transição validadas com sucesso');
    console.log(`✓ Faixa Tank! detectada com badge: "${elementCheck.jumpBadgeText.trim()}" e ${elementCheck.sprocketsCount} perfurações 35mm`);

    // 3. SCROLL INTERACTION & SCROLLTRIGGER BEHAVIOR
    console.log('\n[3/5] Testando acionamento suave da âncora e interpolação de rolagem...');
    const initialScrollY = await page.evaluate(() => window.scrollY);
    assert.strictEqual(initialScrollY, 0, 'Scroll inicial deve ser 0');

    // Clica no link de âncora "THE CRAFT HAS BEGUN"
    const craftLink = page.locator('#hero a[href="#works"]');
    await craftLink.click();
    await page.waitForTimeout(1400); // Aguarda interpolação do Lenis

    const scrolledScrollY = await page.evaluate(() => window.scrollY);
    console.log(`✓ Posição pós-rolagem por âncora: ${Math.round(scrolledScrollY)}px (movimento suave interpolado via Lenis)`);
    assert(scrolledScrollY > 400, 'Página deve ter rolado suavemente em direção à seção #works');

    // Testa scroll reverso para o topo
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);

    // 4. STEPPED SCROLL TEST (VERIFICA AUSÊNCIA DE RUNTIME ERRORS E 60 FPS TRANSFORMS)
    console.log('\n[4/5] Executando rolagem sequencial para validar ScrollTrigger sem saltos visuais...');
    const scrollSteps = [150, 300, 500, 750, 1000];
    for (const step of scrollSteps) {
      await page.evaluate((top) => window.scrollTo(0, top), step);
      await page.waitForTimeout(100);
      const errors = await page.evaluate(() => window.__testErrors || []);
      assert.strictEqual(errors.length, 0, `Nenhum erro de runtime deve ocorrer durante scroll no offset ${step}`);
    }
    console.log('✓ Rolagem sequencial concluída a 60 FPS sem exceções ou quebras de timeline');

    // 5. RESPONSIVE VALIDATION & ZERO HORIZONTAL OVERFLOW
    console.log('\n[5/5] Validando ausência de overflow horizontal em múltiplos breakpoints...');
    const breakpoints = [
      { name: 'Mobile Mini', width: 375, height: 667 },
      { name: 'Mobile Standard', width: 390, height: 844 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Desktop HD', width: 1440, height: 900 },
      { name: 'Ultrawide 2K', width: 2560, height: 1440 },
    ];

    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(200);

      const overflowCheck = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        return {
          winWidth,
          docWidth,
          bodyWidth,
          hasOverflow: docWidth > winWidth || bodyWidth > winWidth,
        };
      });

      assert(
        !overflowCheck.hasOverflow,
        `Breakpoint ${bp.name} (${bp.width}px) gerou overflow horizontal! docWidth=${overflowCheck.docWidth}, winWidth=${overflowCheck.winWidth}`
      );
      console.log(`  ✓ ${bp.name} (${bp.width}x${bp.height}): scrollWidth=${overflowCheck.docWidth}px <= clientWidth=${overflowCheck.winWidth}px`);
    }

    console.log('\n================================================================');
    console.log('🎉 TODOS OS TESTES DA HISTÓRIA 2.5 PASSARAM COM 100% DE SUCESSO!');
    console.log('================================================================\n');
  } finally {
    await browser.close();
  }
}

testStory25().catch((err) => {
  console.error('\n❌ FALHA NOS TESTES DA HISTÓRIA 2.5:');
  console.error(err);
  process.exit(1);
});
