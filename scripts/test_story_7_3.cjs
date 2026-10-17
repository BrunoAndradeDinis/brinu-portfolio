const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

const ARTIFACT_DIR = '/home/br_dinis/.gemini/antigravity-ide/brain/9592735d-5d81-4c34-9ad3-2171f0815e92';

async function testStory73() {
  console.log('=== TESTES PLAYWRIGHT: STORY 7.3 — RODAPÉ CINEMATOGRÁFICO E ASSINATURA BEBOP ===\n');

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

    console.log('[1/5] Carregando a aplicação no Desktop (1440x900)...');
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#intro-preloader', { state: 'detached', timeout: 6000 });
    await page.waitForTimeout(500);

    // 2. SCROLL TO FOOTER AND VERIFY MOUNT
    console.log('\n[2/5] Validando montagem do rodapé [data-bebop-footer]...');
    const footer = page.locator('[data-bebop-footer]');
    await footer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    assert(await footer.isVisible(), 'Rodapé deve estar visível');
    console.log('✓ Rodapé [data-bebop-footer] renderizado com sucesso');

    // 3. VERIFY MONUMENTAL SIGNATURE & NOIR SUBTITLE
    console.log('\n[3/5] Validando frase de assinatura monumental e subtítulo noir...');
    const signatureBox = page.locator('[data-footer-signature]');
    await signatureBox.waitFor({ state: 'visible', timeout: 3000 });

    const signatureText = await signatureBox.innerText();
    assert(
      signatureText.includes('SEE YOU SPACE COWBOY'),
      `Assinatura deve conter SEE YOU SPACE COWBOY (obtido: ${signatureText})`
    );
    assert(
      signatureText.includes("YOU'RE GONNA CARRY THAT WEIGHT"),
      `Subtítulo noir deve conter YOU'RE GONNA CARRY THAT WEIGHT (obtido: ${signatureText})`
    );
    assert(
      signatureText.includes('EPISODE 26'),
      `Badge deve conter menção ao protocolo EPISODE 26 (obtido: ${signatureText})`
    );
    console.log('✓ Assinatura "SEE YOU SPACE COWBOY…" e subtítulo noir validados com sucesso');

    // Capture screenshot of footer
    const screenshotPath = path.join(ARTIFACT_DIR, '01_bebop_footer_screen.png');
    await footer.screenshot({ path: screenshotPath });
    console.log(`✓ Screenshot do rodapé salvo em: ${screenshotPath}`);

    // 4. VERIFY SOCIAL LINKS AND BACK TO TOP BUTTON
    console.log('\n[4/5] Validando links de conexão e botão de retorno ao topo...');
    const githubLink = page.locator('[data-footer-github-link]');
    const linkedinLink = page.locator('[data-footer-linkedin-link]');
    const emailLink = page.locator('[data-footer-email-link]');
    const whoamiLink = page.locator('[data-footer-whoami-link]');
    const backToTopBtn = page.locator('[data-footer-back-to-top]');

    assert(await githubLink.getAttribute('href') === 'https://github.com/BrunoAndradeDinis', 'Link do GitHub deve estar correto');
    assert(await linkedinLink.getAttribute('href') === 'https://www.linkedin.com/in/bruno-de-andrade-dinis', 'Link do LinkedIn deve estar correto');
    assert((await emailLink.getAttribute('href')).startsWith('mailto:bruno.a.dinis96@gmail.com'), 'Link de e-mail deve estar correto');
    assert(await whoamiLink.getAttribute('href') === '/whoami', 'Link para rota /whoami deve estar correto');
    assert(await backToTopBtn.getAttribute('href') === '#main-content', 'Botão de retorno deve apontar para #main-content');
    console.log('✓ Todos os links sociais e rotas de navegação verificados');

    // Test Back to Top Click
    await backToTopBtn.click();
    await page.waitForTimeout(600);
    const scrollY = await page.evaluate(() => window.scrollY);
    console.log(`✓ Ação de voltar ao topo executada (scrollY: ${scrollY})`);

    // 5. TEST RESPONSIVENESS AND ZERO HORIZONTAL OVERFLOW ACROSS VIEWPORTS
    console.log('\n[5/5] Validando contenção responsiva e ausência de overflow horizontal...');
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

    console.log('\n===============================================================');
    console.log('✓ TODOS OS TESTES DA STORY 7.3 FORAM EXECUTADOS COM SUCESSO!');
    console.log('===============================================================\n');
  } catch (error) {
    console.error('❌ Falha nos testes da Story 7.3:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testStory73();
