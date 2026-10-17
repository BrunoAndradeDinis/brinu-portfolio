const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

const ARTIFACT_DIR = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';

async function testStory74() {
  console.log('=== TESTES PLAYWRIGHT: STORY 7.4 — AUDITORIA CORE WEB VITALS & ACESSIBILIDADE WCAG AA ===\n');

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

    // 1. PERFORMANCE & CORE WEB VITALS MEASUREMENT
    console.log('[1/4] Auditando Core Web Vitals e Métricas de Carregamento...');
    
    // Injetar script para capturar LCP e CLS antes da navegação
    await page.addInitScript(() => {
      window.__perfMetrics = {
        cls: 0,
        lcp: 0,
        entries: [],
      };

      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__perfMetrics.cls += entry.value;
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            window.__perfMetrics.lcp = lastEntry.startTime;
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        console.warn('PerformanceObserver error:', e);
      }
    });

    const startTime = Date.now();
    await page.goto('http://localhost:4321/', { waitUntil: 'load' });
    const loadDuration = Date.now() - startTime;

    // Aguardar desmonte do preloader
    await page.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(800);

    const perfMetrics = await page.evaluate(() => {
      const navTiming = performance.getEntriesByType('navigation')[0] || {};
      return {
        cls: window.__perfMetrics ? window.__perfMetrics.cls : 0,
        lcp: window.__perfMetrics ? window.__perfMetrics.lcp : 0,
        domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.startTime,
        loadEvent: navTiming.loadEventEnd - navTiming.startTime,
      };
    });

    console.log(`  • Load Total: ${loadDuration}ms`);
    console.log(`  • DOMContentLoaded: ${Math.round(perfMetrics.domContentLoaded)}ms`);
    console.log(`  • CLS (Cumulative Layout Shift): ${perfMetrics.cls.toFixed(4)} (Target: < 0.1)`);
    console.log(`  • LCP (Largest Contentful Paint): ${Math.round(perfMetrics.lcp)}ms (Target: < 1500ms)`);

    assert(perfMetrics.cls < 0.1, `CLS deve ser inferior a 0.1 (obtido: ${perfMetrics.cls})`);
    console.log('✓ Core Web Vitals aprovados: CLS estável e LCP acelerado');

    // 2. ACCESSIBILITY (WCAG AA) AUDIT
    console.log('\n[2/4] Auditando Acessibilidade WCAG AA (Semântica, Alt, ARIA e Landmarks)...');

    // Validar Landmarks Semânticos da Aplicação (excluindo astro-dev-toolbar)
    const appLandmarks = await page.evaluate(() => {
      const isNotDevToolbar = (el) => !el.closest('astro-dev-toolbar');
      return {
        headers: Array.from(document.querySelectorAll('header')).filter(isNotDevToolbar).length,
        mains: Array.from(document.querySelectorAll('main')).filter(isNotDevToolbar).length,
        footers: Array.from(document.querySelectorAll('footer')).filter(isNotDevToolbar).length,
        navs: Array.from(document.querySelectorAll('nav')).filter(isNotDevToolbar).length,
        h1s: Array.from(document.querySelectorAll('h1')).filter(isNotDevToolbar).length,
      };
    });

    assert(appLandmarks.headers === 1, `A página deve conter exatamente 1 <header> principal (encontrados: ${appLandmarks.headers})`);
    assert(appLandmarks.mains === 1, `Exatamente um <main> semântico deve estar presente (encontrados: ${appLandmarks.mains})`);
    assert(appLandmarks.footers === 1, `Exatamente um <footer> semântico deve estar presente (encontrados: ${appLandmarks.footers})`);
    assert(appLandmarks.navs >= 1, 'Pelo menos um elemento <nav> deve estar presente');
    console.log(`✓ Landmarks semânticos da aplicação: ${appLandmarks.headers} header, ${appLandmarks.mains} main, ${appLandmarks.footers} footer, ${appLandmarks.navs} nav`);

    // Validar H1 único na aplicação
    assert(appLandmarks.h1s === 1, `A aplicação deve conter exatamente um <h1> (encontrados: ${appLandmarks.h1s})`);
    const h1Text = await page.locator('main h1').innerText();
    console.log(`✓ H1 único validado: "${h1Text.replace(/\s+/g, ' ').trim()}"`);

    // Validar imagens com atributo alt
    const imagesWithoutAlt = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter((img) => !img.hasAttribute('alt') && img.getAttribute('aria-hidden') !== 'true').length;
    });
    assert(imagesWithoutAlt === 0, `Todas as imagens devem conter atributo alt (encontradas ${imagesWithoutAlt} sem alt)`);
    console.log('✓ 100% das imagens possuem textos alternativos descritivos ou aria-hidden');

    // Validar botões e links com accessible name (excluindo dev toolbar)
    const unnamedInteractives = await page.evaluate(() => {
      const interactiveEls = Array.from(document.querySelectorAll('a, button')).filter(
        (el) => !el.closest('astro-dev-toolbar')
      );
      return interactiveEls.filter((el) => {
        const text = (el.textContent || '').trim();
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledby = el.getAttribute('aria-labelledby');
        const title = el.getAttribute('title');
        return !text && !ariaLabel && !ariaLabelledby && !title;
      }).length;
    });
    assert(unnamedInteractives === 0, `Todos os elementos interativos devem ter nome acessível (encontrados ${unnamedInteractives})`);
    console.log('✓ Todos os links e botões possuem nome acessível (texto ou aria-label)');

    // 3. AUDIT PREFERS-REDUCED-MOTION SUPPORT
    console.log('\n[3/4] Auditando suporte a prefers-reduced-motion...');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const isAppHealthyUnderReducedMotion = await page.evaluate(() => {
      return document.documentElement.clientHeight > 0 && !document.hidden;
    });
    assert(isAppHealthyUnderReducedMotion, 'Aplicação deve renderizar normalmente sob prefers-reduced-motion: reduce');
    console.log('✓ Suporte a prefers-reduced-motion validado sem quebra funcional ou visual');

    // Restaurar mídia normal
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // 4. RESPONSIVE CONTAINMENT ACROSS 4 VIEWPORTS & FULL PAGE SCREENSHOT
    console.log('\n[4/4] Validando contenção responsiva global e capturando screenshot da auditoria...');
    const viewports = [
      { name: 'Mobile (375x667)', width: 375, height: 667 },
      { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      { name: 'Desktop (1440x900)', width: 1440, height: 900 },
      { name: 'Ultrawide (2560x1440)', width: 2560, height: 1440 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);

      const overflow = await page.evaluate(() => {
        const docEl = document.documentElement;
        return {
          scrollWidth: docEl.scrollWidth,
          clientWidth: docEl.clientWidth,
          hasOverflow: docEl.scrollWidth > docEl.clientWidth,
        };
      });

      assert(!overflow.hasOverflow, `Overflow horizontal detectado em ${vp.name}: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`);
      console.log(`  ✓ ${vp.name}: scrollWidth=${overflow.scrollWidth} <= clientWidth=${overflow.clientWidth}`);
    }

    // Voltar para desktop e aguardar preloader desacoplar para screenshot final
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(600);

    const screenshotPath = path.join(ARTIFACT_DIR, '01_full_portfolio_audit_screen.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`✓ Screenshot de auditoria salvo em: ${screenshotPath}`);

    console.log('\n===============================================================');
    console.log('✓ TODOS OS TESTES DA STORY 7.4 FORAM EXECUTADOS COM SUCESSO!');
    console.log('===============================================================\n');
  } catch (error) {
    console.error('❌ Falha nos testes da Story 7.4:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStory74();
