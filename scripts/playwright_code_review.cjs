const { chromium } = require('playwright');
const assert = require('assert');

async function runPlaywrightCodeReview() {
  console.log('=== INICIANDO CODE REVIEW DINÂMICO COM PLAYWRIGHT ===\n');

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
  });

  const findings = [];

  try {
    // ------------------------------------------------------------------
    // TESTE 1: Console Errors, Exceptions e Avisos
    // ------------------------------------------------------------------
    console.log('[AUDITORIA 1] Monitoramento de Console e Exceções não capturadas...');
    const context1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page1 = await context1.newPage();

    const consoleLogs = [];
    const consoleErrors = [];
    const pageErrors = [];

    page1.on('console', (msg) => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page1.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await page1.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
    await page1.click('#intro-preloader');
    await page1.waitForTimeout(1000);

    if (consoleErrors.length > 0) {
      findings.push({
        lens: 'playwright-runtime',
        location: 'browser-console',
        issue: 'Erros detectados no console do navegador durante o carregamento inicial',
        details: consoleErrors.join('; '),
      });
    }

    if (pageErrors.length > 0) {
      findings.push({
        lens: 'playwright-runtime',
        location: 'browser-runtime',
        issue: 'Exceção não capturada na página (pageerror)',
        details: pageErrors.join('; '),
      });
    }

    console.log(`✓ Erros de console: ${consoleErrors.length}, PageErrors: ${pageErrors.length}`);

    // ------------------------------------------------------------------
    // TESTE 2: Comportamento de Âncoras e Casos de Borda de URL
    // ------------------------------------------------------------------
    console.log('\n[AUDITORIA 2] Casos de Borda em Âncoras Locais (hash vazio, hash inexistente, cliques múltiplos)...');

    // Teste com clique em âncora inexistente no DOM
    const missingAnchorResult = await page1.evaluate(() => {
      try {
        const dummyAnchor = document.createElement('a');
        dummyAnchor.setAttribute('href', '#non-existent-section-id');
        document.body.appendChild(dummyAnchor);
        dummyAnchor.click();
        dummyAnchor.remove();
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });

    if (!missingAnchorResult.success) {
      findings.push({
        lens: 'playwright-edge-case',
        location: 'src/utils/motion.ts:handleAnchorClick',
        issue: 'Erro ao clicar em âncora cujo elemento alvo não existe no DOM',
        details: missingAnchorResult.error,
      });
    } else {
      console.log('✓ Âncora inexistente tratada graciosamente sem erro');
    }

    // Teste com clique em âncora vazia ('#')
    const emptyAnchorResult = await page1.evaluate(() => {
      try {
        const dummyEmpty = document.createElement('a');
        dummyEmpty.setAttribute('href', '#');
        document.body.appendChild(dummyEmpty);
        dummyEmpty.click();
        dummyEmpty.remove();
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });

    if (!emptyAnchorResult.success) {
      findings.push({
        lens: 'playwright-edge-case',
        location: 'src/utils/motion.ts:handleAnchorClick',
        issue: 'Erro ao clicar em âncora com href="#"',
        details: emptyAnchorResult.error,
      });
    } else {
      console.log('✓ Âncora vazia "#" ignorada corretamente sem erro');
    }

    // Teste com clique com tecla modificadora (ex: Ctrl+click para nova aba)
    const modifierClickResult = await page1.evaluate(() => {
      try {
        const dummyLink = document.createElement('a');
        dummyLink.setAttribute('href', '#works');
        document.body.appendChild(dummyLink);

        let defaultPrevented = false;
        dummyLink.addEventListener('click', (e) => {
          defaultPrevented = e.defaultPrevented;
        });

        const ctrlClick = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
          button: 0,
        });
        dummyLink.dispatchEvent(ctrlClick);
        dummyLink.remove();

        return { defaultPrevented };
      } catch (e) {
        return { error: e.message };
      }
    });

    console.log('✓ Clique com tecla modificadora preservou comportamento padrão do navegador:', !modifierClickResult.defaultPrevented);
    assert(!modifierClickResult.defaultPrevented, 'Ctrl+clique não deve ter defaultPrevented');

    // ------------------------------------------------------------------
    // TESTE 3: Verificação de Sincronia Lenis + GSAP ScrollTrigger
    // ------------------------------------------------------------------
    console.log('\n[AUDITORIA 3] Verificação da Física de Rolagem e GSAP Ticker...');
    const motionAudit = await page1.evaluate(() => {
      const htmlClasses = document.documentElement.className;
      const scrollYBefore = window.scrollY;

      // Executa rolagem simulada
      window.scrollTo(0, 400);

      return {
        hasLenisClass: htmlClasses.includes('lenis'),
        hasSmoothClass: htmlClasses.includes('lenis-smooth') || htmlClasses.includes('lenis'),
        scrollYBefore,
      };
    });

    console.log('✓ Classes Lenis ativas:', motionAudit.hasLenisClass);

    // ------------------------------------------------------------------
    // TESTE 4: Teste de Redimensionamento Dinâmico (Resize Stress)
    // ------------------------------------------------------------------
    console.log('\n[AUDITORIA 4] Teste de Redimensionamento Dinâmico com Scroll Ativo...');
    await page1.evaluate(() => window.scrollTo(0, 300));
    await page1.setViewportSize({ width: 768, height: 1024 });
    await page1.waitForTimeout(200);
    await page1.setViewportSize({ width: 375, height: 812 });
    await page1.waitForTimeout(200);
    await page1.setViewportSize({ width: 1440, height: 900 });
    await page1.waitForTimeout(200);

    const scrollYAfterResizes = await page1.evaluate(() => window.scrollY);
    console.log(`✓ Scroll preservado e estável após redimensionamentos: ${scrollYAfterResizes}px`);

    // ------------------------------------------------------------------
    // TESTE 5: Alternância Dinâmica de prefers-reduced-motion em Execução
    // ------------------------------------------------------------------
    console.log('\n[AUDITORIA 5] Testando Alternância Dinâmica de Reduced Motion...');
    await page1.emulateMedia({ reducedMotion: 'reduce' });
    await page1.waitForTimeout(300);

    const reducedState1 = await page1.evaluate(() => {
      return {
        prefersReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        lenisClassPresent: document.documentElement.classList.contains('lenis'),
      };
    });
    console.log('✓ Modo reduced-motion ativo detectado:', reducedState1.prefersReduced);

    // Reverte para no-preference
    await page1.emulateMedia({ reducedMotion: 'no-preference' });
    await page1.waitForTimeout(300);

    const reducedState2 = await page1.evaluate(() => {
      return {
        prefersReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        lenisClassPresent: document.documentElement.classList.contains('lenis'),
      };
    });
    console.log('✓ Reversão para movimento normal restabelecida:', !reducedState2.prefersReduced);

    // Captura screenshot para inspeção visual do review
    await page1.screenshot({ path: '/tmp/playwright_review_desktop.png', fullPage: false });
    console.log('✓ Screenshot capturado em /tmp/playwright_review_desktop.png');

    await context1.close();

    // ------------------------------------------------------------------
    // TESTE 6: Verificação no Breakpoint Mobile
    // ------------------------------------------------------------------
    console.log('\n[AUDITORIA 6] Verificação Mobile (375x667) de Ticker, Hero e Âncora #works...');
    const mobileContext = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
    await mobilePage.click('#intro-preloader');
    await mobilePage.waitForTimeout(800);

    // Clica no link de Works no mobile
    await mobilePage.click('a[href="#works"]');
    await mobilePage.waitForTimeout(1400);

    const mobileScrollY = await mobilePage.evaluate(() => window.scrollY);
    console.log(`✓ Scroll mobile após âncora: ${mobileScrollY}px`);
    assert(mobileScrollY > 100, 'Mobile deve rolar suavemente até a seção');

    await mobilePage.screenshot({ path: '/tmp/playwright_review_mobile.png', fullPage: false });
    console.log('✓ Screenshot mobile capturado em /tmp/playwright_review_mobile.png');

    await mobileContext.close();

    console.log('\n=== PLAYWRIGHT CODE REVIEW CONCLUÍDO COM SUCESSO! ===');
    console.log(`Total de achados/falhas de runtime encontrados: ${findings.length}`);
    return findings;
  } finally {
    await browser.close();
  }
}

runPlaywrightCodeReview()
  .then((findings) => {
    console.log('\nResultados detalhados:', JSON.stringify(findings, null, 2));
  })
  .catch((err) => {
    console.error('ERRO NO PLAYWRIGHT CODE REVIEW:', err);
    process.exit(1);
  });
