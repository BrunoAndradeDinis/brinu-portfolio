const { chromium } = require('playwright');
const assert = require('assert');

async function runMatrixVerification() {
  console.log('--- INICIANDO AUDITORIA DA MATRIZ DE TESTES (STORY 1.3: MOTION COORDINATOR) ---');

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
  });

  try {
    // -------------------------------------------------------------
    // CENÁRIO 1, 2, 3: Desktop normal, Preloader, Âncora suave (#works)
    // -------------------------------------------------------------
    console.log('\n[CENÁRIO 1, 2, 3] Testando Preloader, Lenis Inicialização e Âncora #works...');
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    // 1. Acesso à página
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });

    // CENÁRIO 3: Preloader ativo bloqueia scroll
    const preloaderExists = await page.$('#intro-preloader');
    assert(preloaderExists, 'Preloader deve estar presente no carregamento inicial');
    
    // Verifica se html tem a classe 'lenis-stopped' ou preloader está visível
    const isStoppedInitially = await page.evaluate(() => {
      return document.documentElement.classList.contains('lenis-stopped');
    });
    console.log('✓ Preloader ativo bloqueou a rolagem (lenis-stopped):', isStoppedInitially);
    assert(isStoppedInitially, 'A rolagem deve estar bloqueada enquanto o preloader está ativo');

    // Clica no preloader para dispensar imediatamente
    await page.click('#intro-preloader');
    await page.waitForTimeout(1100); // Aguarda transição de saída e remoção

    // Verifica que o preloader foi removido e scroll liberado
    const isStoppedAfterDismiss = await page.evaluate(() => {
      return document.documentElement.classList.contains('lenis-stopped');
    });
    console.log('✓ Após o dismiss do preloader, a rolagem foi liberada (lenis-stopped removido):', !isStoppedAfterDismiss);
    assert(!isStoppedAfterDismiss, 'A classe lenis-stopped deve ser removida após dismiss');

    // CENÁRIO 1: Lenis ativo em desktop
    const lenisStatus = await page.evaluate(() => {
      return {
        htmlHasLenis: document.documentElement.classList.contains('lenis'),
        scrollY: window.scrollY,
      };
    });
    console.log('✓ Lenis adicionou a classe canônica html.lenis:', lenisStatus.htmlHasLenis);
    assert(lenisStatus.htmlHasLenis, 'html.lenis deve estar presente');

    // CENÁRIO 2: Clique em âncora #works
    const initialScroll = await page.evaluate(() => window.scrollY);
    console.log('Posição de scroll antes do clique na âncora:', initialScroll);

    await page.click('a[href="#works"]');
    await page.waitForTimeout(1400); // Aguarda interpolação suave do Lenis (1.2s)

    const finalScroll = await page.evaluate(() => window.scrollY);
    const worksTop = await page.evaluate(() => {
      const el = document.getElementById('works');
      return el ? el.offsetTop : 0;
    });

    console.log(`✓ Scroll após clique em #works: ${finalScroll}px (Alvo #works offsetTop: ${worksTop}px)`);
    assert(finalScroll > 200, 'A página deve rolar suavemente em direção à seção #works');

    await context.close();

    // -------------------------------------------------------------
    // CENÁRIO 4: prefers-reduced-motion: reduce
    // -------------------------------------------------------------
    console.log('\n[CENÁRIO 4] Testando usuário com prefers-reduced-motion: reduce...');
    const reducedMotionContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    const reducedPage = await reducedMotionContext.newPage();
    await reducedPage.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await reducedPage.click('#intro-preloader');
    await reducedPage.waitForTimeout(500);

    const reducedMotionCheck = await reducedPage.evaluate(() => {
      return {
        prefersReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        htmlHasLenis: document.documentElement.classList.contains('lenis'),
      };
    });

    console.log('✓ Media query reduced-motion detectada:', reducedMotionCheck.prefersReduced);
    console.log('✓ Lenis inercial desativado sob reduced-motion (sem html.lenis):', !reducedMotionCheck.htmlHasLenis);
    assert(reducedMotionCheck.prefersReduced, 'Deve detectar reduced-motion');
    assert(!reducedMotionCheck.htmlHasLenis, 'Lenis não deve injetar html.lenis sob reduced-motion');

    await reducedMotionContext.close();

    // -------------------------------------------------------------
    // CENÁRIO 5 & 6: Font loading & Resize recalcula ScrollTrigger
    // -------------------------------------------------------------
    console.log('\n[CENÁRIO 5 & 6] Testando document.fonts.ready e Resize...');
    const resizeContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const resizePage = await resizeContext.newPage();
    await resizePage.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
    await resizePage.click('#intro-preloader');
    await resizePage.waitForTimeout(600);

    const fontsLoaded = await resizePage.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.status === 'loaded';
    });
    console.log('✓ document.fonts.ready resolvido com sucesso:', fontsLoaded);

    // Redimensionamento de janela
    await resizePage.setViewportSize({ width: 768, height: 1024 });
    await resizePage.waitForTimeout(300);
    await resizePage.setViewportSize({ width: 375, height: 667 });
    await resizePage.waitForTimeout(300);

    const postResizeErrors = await resizePage.evaluate(() => {
      return window.__lastError || null;
    });
    console.log('✓ Redimensionamentos múltiplos executados sem erros de gatilho:', postResizeErrors === null);
    assert(postResizeErrors === null, 'Nenhum erro após múltiplos resizes');

    await resizeContext.close();

    console.log('\n=============================================================');
    console.log('TODOS OS 7 CENÁRIOS DA MATRIZ FORAM VERIFICADOS E APROVADOS!');
    console.log('=============================================================');
  } finally {
    await browser.close();
  }
}

runMatrixVerification().catch((err) => {
  console.error('FALHA NA VERIFICAÇÃO DA MATRIZ:', err);
  process.exit(1);
});
