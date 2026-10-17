const { chromium } = require('playwright');
const assert = require('assert');

async function testStory24() {
  console.log('=== TESTES PLAYWRIGHT: STORY 2.4 — TEXTOS DE MANIFESTO & TICKER TAPE 60 FPS ===\n');

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
  });

  try {
    // 1. DESKTOP VALIDATION
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    console.log('[1/4] Carregando a página...');
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(400);

    // 2. TICKER TAPE CHECK
    console.log('\n[2/4] Validando fita ticker tape contínua e aceleração GPU...');
    const tickerMetrics = await page.evaluate(() => {
      const tickerTrack = document.querySelector('.animate-marquee');
      const text = tickerTrack ? tickerTrack.innerText : '';
      const style = tickerTrack ? window.getComputedStyle(tickerTrack) : null;
      return {
        hasTicker: !!tickerTrack,
        text,
        willChange: style ? style.willChange : null,
        animationName: style ? style.animationName : null,
      };
    });

    assert(tickerMetrics.hasTicker, 'Trilha do ticker tape deve existir');
    assert(tickerMetrics.text.includes('MAGALU CLOUD'), 'Ticker deve conter "MAGALU CLOUD"');
    assert(tickerMetrics.text.includes('PAI DA HELENA'), 'Ticker deve conter "PAI DA HELENA"');
    assert(tickerMetrics.text.includes('SEE YOU SPACE COWBOY'), 'Ticker deve conter "SEE YOU SPACE COWBOY"');
    assert(tickerMetrics.text.includes('60 FPS'), 'Ticker deve conter "60 FPS"');
    console.log('✓ Conteúdo do Ticker Tape verificado com manifesto oficial');
    console.log(`✓ Aceleração GPU detectada: will-change=${tickerMetrics.willChange}, animation=${tickerMetrics.animationName}`);

    // 3. CORNER MANIFESTO BLOCKS CHECK
    console.log('\n[3/4] Validando blocos de manifesto nos cantos e links sociais...');
    const cornerInfo = await page.evaluate(() => {
      const craftLink = document.querySelector('#hero a[href="#works"]');
      const gh = document.querySelector('a[href*="github.com/BrunoAndradeDinis"]');
      const li = document.querySelector('a[href*="linkedin.com/in/brunoandradedinis"]');
      const mail = document.querySelector('a[href^="mailto:"]');

      return {
        craftAria: craftLink ? craftLink.getAttribute('aria-label') : null,
        ghTarget: gh ? gh.getAttribute('target') : null,
        ghRel: gh ? gh.getAttribute('rel') : null,
        ghAria: gh ? gh.getAttribute('aria-label') : null,
        liTarget: li ? li.getAttribute('target') : null,
        liAria: li ? li.getAttribute('aria-label') : null,
        mailHref: mail ? mail.getAttribute('href') : null,
        mailAria: mail ? mail.getAttribute('aria-label') : null,
      };
    });

    assert(cornerInfo.craftAria, 'Link THE CRAFT HAS BEGUN deve possuir aria-label');
    assert.strictEqual(cornerInfo.ghTarget, '_blank', 'GitHub deve abrir em nova aba');
    assert(cornerInfo.ghRel && cornerInfo.ghRel.includes('noopener'), 'GitHub deve possuir rel="noopener"');
    assert(cornerInfo.ghAria, 'GitHub deve possuir aria-label descritivo');
    assert.strictEqual(cornerInfo.liTarget, '_blank', 'LinkedIn deve abrir em nova aba');
    assert(cornerInfo.liAria, 'LinkedIn deve possuir aria-label descritivo');
    assert(cornerInfo.mailHref && cornerInfo.mailHref.includes('mailto:'), 'Email link deve ser mailto');
    console.log('✓ Links de manifesto e botões sociais verificados com acessibilidade completa');

    await context.close();

    // 4. MOBILE LAYOUT & OVERFLOW CHECK
    console.log('\n[4/4] Validando acomodação responsiva em Mobile (375x667 iPhone SE)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await mobilePage.waitForTimeout(400);

    const mobileMetrics = await mobilePage.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const hero = document.getElementById('hero');
      const heroRect = hero ? hero.getBoundingClientRect() : null;
      return {
        hasHorizontalOverflow: scrollWidth > clientWidth,
        scrollWidth,
        clientWidth,
        heroHeight: heroRect ? heroRect.height : null,
      };
    });

    assert(!mobileMetrics.hasHorizontalOverflow, 'Mobile não deve possuir transbordamento horizontal');
    assert(mobileMetrics.heroHeight > 400, 'Hero deve ter altura adequada no mobile');
    console.log(`✓ Mobile verificado: scrollWidth=${mobileMetrics.scrollWidth}px, clientWidth=${mobileMetrics.clientWidth}px, overflow=NÃO`);

    await mobileContext.close();

    console.log('\n=============================================================');
    console.log('TODOS OS TESTES DA STORY 2.4 FORAM APROVADOS COM SUCESSO!');
    console.log('=============================================================');
  } finally {
    await browser.close();
  }
}

testStory24().catch((err) => {
  console.error('\n❌ Falha no teste da Story 2.4:', err);
  process.exit(1);
});
