const { chromium } = require('playwright');
const assert = require('assert');

async function testComicNavAndPreloader() {
  console.log('=== TESTE PLAYWRIGHT: COMICNAV & INTRO PRELOADER (STORY 1.4) ===\n');

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
  });

  try {
    // ------------------------------------------------------------------
    // TESTE 1: Pular Preloader via Tecla (Escape)
    // ------------------------------------------------------------------
    console.log('[CENÁRIO 1] Testando atalho de teclado (Escape) para pular o preloader...');
    const context1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page1 = await context1.newPage();
    await page1.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });

    const preloaderVisible1 = await page1.$('#intro-preloader');
    assert(preloaderVisible1, 'Preloader deve estar presente na abertura');

    // Pressiona Escape
    await page1.keyboard.press('Escape');
    await page1.waitForTimeout(1100);

    const preloaderGone1 = await page1.$('#intro-preloader');
    assert(!preloaderGone1, 'Preloader deve ser removido após tecla Escape');
    console.log('✓ Tecla Escape pulou a abertura com sucesso');

    // ------------------------------------------------------------------
    // TESTE 2: Disparo do Evento cockpit:open no Botão Acid Green
    // ------------------------------------------------------------------
    console.log('\n[CENÁRIO 2] Testando botão Acid Green e evento cockpit:open...');
    let cockpitEventFired = false;
    let cockpitDetail = null;

    await page1.exposeFunction('onCockpitEvent', (detail) => {
      cockpitEventFired = true;
      cockpitDetail = detail;
    });

    await page1.evaluate(() => {
      window.addEventListener('cockpit:open', (e) => {
        window.onCockpitEvent(e.detail);
      });
    });

    const cockpitBtn = await page1.$('#cockpit-trigger-btn');
    assert(cockpitBtn, 'Botão do cockpit deve existir');

    const ariaExpandedInitial = await cockpitBtn.getAttribute('aria-expanded');
    assert.strictEqual(ariaExpandedInitial, 'false');

    await cockpitBtn.click();
    await page1.waitForTimeout(100);

    const ariaExpandedAfter = await cockpitBtn.getAttribute('aria-expanded');
    assert.strictEqual(ariaExpandedAfter, 'true');
    assert(cockpitEventFired, 'Evento cockpit:open deve ser disparado');
    assert(cockpitDetail && cockpitDetail.isOpen === true, 'detail.isOpen deve ser true');
    console.log('✓ Botão Acid Green disparou cockpit:open e atualizou aria-expanded com sucesso');

    // ------------------------------------------------------------------
    // TESTE 3: Comportamento de Rolagem Natural da ComicNav (não-sticky)
    // ------------------------------------------------------------------
    console.log('\n[CENÁRIO 3] Testando comportamento de rolagem natural da ComicNav (sem sticky)...');
    await page1.evaluate(() => window.scrollTo(0, 600));
    await page1.waitForTimeout(300);

    const navPosition = await page1.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return null;
      const rect = header.getBoundingClientRect();
      const style = window.getComputedStyle(header);
      return {
        top: rect.top,
        position: style.position,
        zIndex: style.zIndex,
      };
    });

    assert(navPosition, 'Header deve existir');
    assert.strictEqual(navPosition.position, 'relative', 'Header deve possuir position: relative');
    assert(navPosition.top < 0, 'Header deve rolar naturalmente para fora do viewport ao scrollar');
    console.log(`✓ ComicNav rolou naturalmente com a página (position: ${navPosition.position}, top: ${navPosition.top}px, z-index: ${navPosition.zIndex})`);

    await context1.close();

    // ------------------------------------------------------------------
    // TESTE 4: Modo ?freeze (Preloader permanece estático para inspeção)
    // ------------------------------------------------------------------
    console.log('\n[CENÁRIO 4] Testando modo ?freeze para inspeção e testes...');
    const freezeContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const freezePage = await freezeContext.newPage();
    await freezePage.goto('http://localhost:4321/?freeze', { waitUntil: 'domcontentloaded' });
    await freezePage.waitForTimeout(4200); // Mais tempo que os 3.8s do autoTimer

    const preloaderStillThere = await freezePage.$('#intro-preloader');
    assert(preloaderStillThere, 'Preloader deve continuar visível sob ?freeze');
    const isExiting = await preloaderStillThere.evaluate((el) => el.classList.contains('is-exiting'));
    assert(!isExiting, 'Preloader sob ?freeze não deve ter iniciado is-exiting');
    console.log('✓ Modo ?freeze manteve o preloader congelado sem auto-dismiss');

    await freezeContext.close();

    // ------------------------------------------------------------------
    // TESTE 5: Responsividade Mobile (375x667)
    // ------------------------------------------------------------------
    console.log('\n[CENÁRIO 5] Testando responsividade mobile em 375x667...');
    const mobileContext = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });

    // Salta o preloader via Enter
    await mobilePage.keyboard.press('Enter');
    await mobilePage.waitForTimeout(1100);

    const mobileCheck = await mobilePage.evaluate(() => {
      const header = document.querySelector('header');
      const worksBtn = document.querySelector('a[href="#works"]');
      const bodyWidth = document.body.scrollWidth;
      const windowWidth = window.innerWidth;
      return {
        hasOverflow: bodyWidth > windowWidth,
        worksText: worksBtn ? worksBtn.innerText.trim() : '',
        headerHeight: header ? header.offsetHeight : 0,
      };
    });

    assert(!mobileCheck.hasOverflow, 'Mobile não deve possuir overflow horizontal');
    assert(mobileCheck.worksText.includes('WORKS'), 'Botão mobile deve exibir WORKS');
    console.log(`✓ Mobile 375px verificado sem overflow (Texto botão: "${mobileCheck.worksText}", Altura nav: ${mobileCheck.headerHeight}px)`);

    await mobileContext.close();

    console.log('\n=============================================================');
    console.log('TODOS OS 5 CENÁRIOS DE COMICNAV E PRELOADER FORAM APROVADOS!');
    console.log('=============================================================');
  } finally {
    await browser.close();
  }
}

testComicNavAndPreloader().catch((err) => {
  console.error('FALHA NOS TESTES DE COMICNAV & PRELOADER:', err);
  process.exit(1);
});
